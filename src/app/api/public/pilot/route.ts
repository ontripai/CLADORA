import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { validateRequestOrigin } from '@/lib/security/origin';
import { getClientIp, hashClientIp } from '@/lib/security/ip-hash';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { verifyTurnstileToken } from '@/lib/security/turnstile-server';
import { generateReferenceId } from '@/lib/security/reference-id';
import { computeSubmissionFingerprint } from '@/lib/security/fingerprint';
import { notifyNewLead } from '@/lib/notifications/lead-notifier';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

const responseHeaders = {
  'Cache-Control': 'no-store, private',
  'Content-Type': 'application/json',
};

const PilotSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Name is required').max(255),
    email: z.string().trim().email('Invalid email address').max(255),
    phone: z.string().trim().min(5, 'Valid phone number is required').max(50),
    role: z.string().trim().min(1, 'Role is required').max(100),
    buildingType: z.string().trim().max(100).optional().nullable(),
    unitsCount: z
      .number({ message: 'Units count must be a number' })
      .int('Units count must be an integer')
      .positive('Units count must be greater than zero')
      .max(10000, 'Units count cannot exceed 10,000'),
    currentSoftware: z.string().trim().max(100).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    county: z.string().trim().max(100).optional().nullable(),
    message: z.string().trim().max(5000).optional().nullable(),
    locale: z.enum(['ro', 'en', 'fa']),
    sourcePage: z.string().trim().max(255).optional().nullable(),
    consentPrivacy: z.literal(true, {
      message: 'Privacy consent is mandatory',
    }),
    honeypot: z.string().optional().nullable(),
    turnstileToken: z.string().optional().nullable(),
    utm_source: z.string().trim().max(100).optional().nullable(),
    utm_medium: z.string().trim().max(100).optional().nullable(),
    utm_campaign: z.string().trim().max(100).optional().nullable(),
    utm_content: z.string().trim().max(100).optional().nullable(),
    utm_term: z.string().trim().max(100).optional().nullable(),
  })
  .strict();

export async function POST(request: NextRequest) {
  // 1. Same-Origin Protection
  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: 'ORIGIN_REJECTED', message: 'Cross-origin submission rejected.' },
      { status: 403, headers: responseHeaders }
    );
  }

  // 2. Content-Type Check
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { ok: false, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'JSON body required.' },
      { status: 415, headers: responseHeaders }
    );
  }

  // 3. Client IP & Rate Limiting (HMAC hashed, no raw IP)
  const clientIp = getClientIp(request);
  const ipHash = hashClientIp(clientIp);
  const rateLimitKey = `pilot:${ipHash}`;

  const rateLimit = await checkRateLimit(rateLimitKey, 5, 900);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          ...responseHeaders,
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  // 4. Request Payload Parsing & Validation
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
      { status: 400, headers: responseHeaders }
    );
  }

  const parseResult = PilotSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        ok: false,
        code: 'VALIDATION_FAILED',
        message: parseResult.error.issues[0]?.message || 'Invalid input data.',
      },
      { status: 400, headers: responseHeaders }
    );
  }

  const data = parseResult.data;

  // 5. Honeypot check (silently pretend success without saving spam)
  if (data.honeypot && data.honeypot.trim().length > 0) {
    const fakeRef = generateReferenceId('pilot');
    return NextResponse.json(
      { ok: true, referenceId: fakeRef },
      { status: 200, headers: responseHeaders }
    );
  }

  // 6. Turnstile Verification
  const turnstileCheck = await verifyTurnstileToken(data.turnstileToken, clientIp);
  if (!turnstileCheck.success) {
    return NextResponse.json(
      {
        ok: false,
        code: turnstileCheck.errorCode || 'CAPTCHA_FAILED',
        message: 'Security verification failed. Please refresh and try again.',
      },
      { status: 400, headers: responseHeaders }
    );
  }

  // 7. Duplicate Submission Control via HMAC Fingerprint
  const normalizedEmail = data.email.toLowerCase().trim();
  const submissionFingerprint = computeSubmissionFingerprint({
    leadType: 'pilot',
    normalizedEmail,
    normalizedPhone: data.phone,
    messageSnippet: data.message ?? undefined,
  });

  const referenceId = generateReferenceId('pilot');
  const nowIso = new Date().toISOString();
  const rawUserAgent = request.headers.get('user-agent') || '';
  const sanitizedUserAgent = rawUserAgent.slice(0, 255);

  let leadSaved = false;

  // 8. Database Persistence (Server-side Admin Client)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // Check for duplicate fingerprint in active window
      const { data: existingLead } = await supabase
        .from('marketing_leads')
        .select('reference_id, created_at')
        .eq('submission_fingerprint', submissionFingerprint)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLead) {
        return NextResponse.json(
          {
            ok: false,
            code: 'DUPLICATE_SUBMISSION',
            message: 'A matching application was already submitted recently. Please wait a few minutes before resending.',
          },
          { status: 409, headers: responseHeaders }
        );
      }

      const initialMetadata = {
        origin: request.headers.get('origin'),
        rateLimitCount: rateLimit.currentCount,
        submissionFingerprint,
        notification: {
          status: 'pending',
          attemptedAt: nowIso,
        },
      };

      const { error: insertError } = await supabase.from('marketing_leads').insert({
        reference_id: referenceId,
        lead_type: 'pilot',
        full_name: data.fullName,
        email: normalizedEmail,
        phone: data.phone,
        role: data.role,
        building_type: data.buildingType || null,
        units_count: data.unitsCount,
        current_software: data.currentSoftware || null,
        city: data.city || null,
        county: data.county || null,
        message: data.message || null,
        locale: data.locale,
        source_page: data.sourcePage || null,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
        status: 'new',
        consent_privacy: true,
        consent_timestamp: nowIso,
        ip_hash: ipHash,
        user_agent: sanitizedUserAgent,
        metadata: initialMetadata,
        submission_fingerprint: submissionFingerprint,
      });

      if (insertError) {
        console.error('[DATABASE_ERROR] Failed to save pilot lead:', insertError.message);
        return NextResponse.json(
          {
            ok: false,
            code: 'SUBMISSION_FAILED',
            message: 'Unable to save application at this time. Please try again later.',
          },
          { status: 500, headers: responseHeaders }
        );
      }

      leadSaved = true;
    } catch (err: unknown) {
      console.error('[DATABASE_EXCEPTION] Pilot lead error:', err instanceof Error ? err.message : String(err));
      return NextResponse.json(
        {
          ok: false,
          code: 'SUBMISSION_FAILED',
          message: 'Unable to save application at this time. Please try again later.',
        },
        { status: 500, headers: responseHeaders }
      );
    }
  } else {
    // Non-production fallback when Supabase is not configured locally
    console.warn('[DEV_MODE] Supabase not configured. Pilot application accepted with reference ID:', referenceId);
    leadSaved = true;
  }

  // 9. Lead Notification Dispatch (non-blocking, never fails lead)
  if (leadSaved) {
    notifyNewLead({
      referenceId,
      leadType: 'pilot',
      fullName: data.fullName,
      email: normalizedEmail,
      phone: data.phone,
      role: data.role,
      buildingType: data.buildingType,
      unitsCount: data.unitsCount,
      currentSoftware: data.currentSoftware,
      city: data.city,
      county: data.county,
      message: data.message,
      locale: data.locale,
      createdAt: nowIso,
      sourcePage: data.sourcePage,
    }).then(async (notifResult) => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          await supabase
            .from('marketing_leads')
            .update({
              metadata: {
                origin: request.headers.get('origin'),
                rateLimitCount: rateLimit.currentCount,
                submissionFingerprint,
                notification: notifResult,
              },
            })
            .eq('reference_id', referenceId);
        } catch {
          // Ignore background update errors
        }
      }
    }).catch(() => {
      // Ignore background notification exceptions
    });
  }

  // 10. Standard Localized Safe JSON Response
  return NextResponse.json(
    {
      ok: true,
      referenceId,
    },
    { status: 200, headers: responseHeaders }
  );
}

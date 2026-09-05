import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAllowedOrigin, validateRequestOrigin } from '@/lib/security/origin';
import { getClientIp, hashClientIp } from '@/lib/security/ip-hash';
import { generateReferenceId } from '@/lib/security/reference-id';
import { computeSubmissionFingerprint } from '@/lib/security/fingerprint';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { verifyTurnstileToken } from '@/lib/security/turnstile-server';
import { notifyNewLead } from '@/lib/notifications/lead-notifier';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseJsonWithLimit } from '@/lib/security/request-body';

// Enforce dynamic server execution
export const dynamic = 'force-dynamic';

const ContactPayloadSchema = z
  .object({
    fullName: z
      .string({ message: 'Full name is required.' })
      .trim()
      .min(2, { message: 'Full name must be at least 2 characters.' })
      .max(255, { message: 'Full name cannot exceed 255 characters.' }),
    email: z
      .string({ message: 'Email address is required.' })
      .trim()
      .email({ message: 'Please enter a valid email address.' })
      .max(255, { message: 'Email address cannot exceed 255 characters.' }),
    phone: z
      .string()
      .trim()
      .max(50, { message: 'Phone number cannot exceed 50 characters.' })
      .optional()
      .nullable(),
    message: z
      .string({ message: 'Message content is required.' })
      .trim()
      .min(10, { message: 'Message must be at least 10 characters.' })
      .max(5000, { message: 'Message cannot exceed 5000 characters.' }),
    locale: z.enum(['ro', 'en', 'fa'], { message: 'Unsupported language.' }),
    sourcePage: z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable(),
    utm_source: z.string().trim().max(100).optional().nullable(),
    utm_medium: z.string().trim().max(100).optional().nullable(),
    utm_campaign: z.string().trim().max(100).optional().nullable(),
    utm_content: z.string().trim().max(100).optional().nullable(),
    utm_term: z.string().trim().max(100).optional().nullable(),
    consentPrivacy: z.literal(true, {
      message: 'You must accept the privacy policy to submit this request.',
    }),
    honeypot: z.string().optional(),
    turnstileToken: z.string().optional().nullable(),
  })
  .strict();

export async function POST(request: NextRequest) {
  // 1. Same-Origin Validation
  if (!validateRequestOrigin(request)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'FORBIDDEN_ORIGIN',
        message: 'Requests from this origin are not permitted.',
      },
      { status: 403 }
    );
  }

  // 2. Enforce Request Body Size Limit before parsing
  const { data: rawBody, errorResponse } = await parseJsonWithLimit(request);
  if (errorResponse) {
    return errorResponse;
  }

  // 3. Honeypot check (silent discard of spam bot submissions)
  if (typeof rawBody === 'object' && rawBody !== null && 'honeypot' in rawBody) {
    const hp = (rawBody as { honeypot?: unknown }).honeypot;
    if (typeof hp === 'string' && hp.trim().length > 0) {
      return NextResponse.json(
        {
          ok: true,
          referenceId: generateReferenceId('contact'),
          message: 'Request received.',
        },
        { status: 200 }
      );
    }
  }

  // 4. Strict Schema Validation
  const validation = ContactPayloadSchema.safeParse(rawBody);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Invalid form submission.',
        issues: validation.error.issues,
      },
      { status: 400 }
    );
  }

  const data = validation.data;
  const clientIp = getClientIp(request);
  const nowIso = new Date().toISOString();

  // 5. Cloudflare Turnstile Verification
  const turnstile = await verifyTurnstileToken(data.turnstileToken, clientIp);
  if (!turnstile.success) {
    return NextResponse.json(
      {
        ok: false,
        code: turnstile.errorCode || 'CAPTCHA_VERIFICATION_FAILED',
        message: 'Security challenge failed. Please refresh and try again.',
      },
      { status: 400 }
    );
  }

  // 6. Persistent Database Rate Limiter (Atomic fail-closed in production)
  const ipHash = hashClientIp(clientIp);
  const actionKey = `contact:${ipHash}`;
  const rateLimit = await checkRateLimit(actionKey, 'contact');

  const responseHeaders = new Headers();
  responseHeaders.set('X-RateLimit-Limit', '5');
  responseHeaders.set('X-RateLimit-Remaining', String(Math.max(0, 5 - rateLimit.currentCount)));

  if (!rateLimit.allowed) {
    responseHeaders.set('Retry-After', String(rateLimit.retryAfterSeconds));
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a few minutes before trying again.',
      },
      { status: 429, headers: responseHeaders }
    );
  }

  // 7. Atomic Deduplication via Rolling 15-Minute HMAC Fingerprint & Bucket
  const normalizedEmail = data.email.toLowerCase();
  const { fingerprint: submissionFingerprint, bucket: fingerprintBucket } = computeSubmissionFingerprint({
    leadType: 'contact',
    normalizedEmail,
    normalizedPhone: data.phone || undefined,
    messageSnippet: data.message,
  });

  // 8. Lead Persistence to Supabase
  if (!isSupabaseConfigured()) {
    const isProductionOrPreview =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL_ENV === 'preview';

    if (isProductionOrPreview || process.env.ALLOW_MOCK_LEAD_CAPTURE !== 'true') {
      console.error('[SERVICE_UNAVAILABLE] Supabase is not configured in production/preview.');
      return NextResponse.json(
        {
          ok: false,
          code: 'SERVICE_UNAVAILABLE',
          message: 'Lead submission service is currently unavailable. Please try again later.',
        },
        { status: 503, headers: responseHeaders }
      );
    }

    // Local development mock only when explicitly allowed
    const mockReferenceId = generateReferenceId('contact');
    return NextResponse.json(
      {
        ok: true,
        referenceId: mockReferenceId,
        message: 'Request received (mock).',
      },
      { status: 200, headers: responseHeaders }
    );
  }

  const rawUserAgent = request.headers.get('user-agent') || '';
  const sanitizedUserAgent = rawUserAgent.slice(0, 250);

  const initialMetadata = {
    origin: request.headers.get('origin'),
    rateLimitCount: rateLimit.currentCount,
    submissionFingerprint,
    fingerprintBucket,
    notification: {
      status: 'pending',
      attemptedAt: nowIso,
    },
  };

  let savedReferenceId: string | null = null;
  const MAX_RETRIES = 3;

  try {
    const supabase = createAdminClient();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const candidateReferenceId = generateReferenceId('contact');

      const { error: insertError } = await supabase.from('marketing_leads').insert({
        reference_id: candidateReferenceId,
        lead_type: 'contact',
        full_name: data.fullName,
        email: normalizedEmail,
        phone: data.phone || null,
        message: data.message,
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
        fingerprint_bucket: fingerprintBucket,
      });

      if (!insertError) {
        savedReferenceId = candidateReferenceId;
        break;
      }

      // Check duplicate fingerprint constraint (atomic 409)
      if (
        insertError.code === '23505' &&
        (insertError.message?.includes('fingerprint') || insertError.details?.includes('fingerprint'))
      ) {
        return NextResponse.json(
          {
            ok: false,
            code: 'DUPLICATE_SUBMISSION',
            message: 'A matching request was already submitted recently. Please wait a few minutes before resending.',
          },
          { status: 409, headers: responseHeaders }
        );
      }

      // If collision on reference_id, retry with new reference ID
      if (
        insertError.code === '23505' &&
        (insertError.message?.includes('reference_id') || insertError.details?.includes('reference_id'))
      ) {
        console.warn(`[REFERENCE_COLLISION] Retrying generation (attempt ${attempt + 1}/${MAX_RETRIES})`);
        continue;
      }

      console.error('[DATABASE_ERROR] Failed to save contact lead:', insertError.message);
      return NextResponse.json(
        {
          ok: false,
          code: 'SUBMISSION_FAILED',
          message: 'Unable to save request at this time. Please try again later.',
        },
        { status: 500, headers: responseHeaders }
      );
    }

    if (!savedReferenceId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'SUBMISSION_FAILED',
          message: 'Unable to allocate a unique reference. Please try again later.',
        },
        { status: 500, headers: responseHeaders }
      );
    }
  } catch (err: unknown) {
    console.error('[DATABASE_EXCEPTION] Contact lead error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        ok: false,
        code: 'SUBMISSION_FAILED',
        message: 'Unable to save request at this time. Please try again later.',
      },
      { status: 500, headers: responseHeaders }
    );
  }

  // 9. Lead Notification Dispatch (awaited, failure does NOT delete or fail saved lead)
  const notifResult = await notifyNewLead({
    referenceId: savedReferenceId,
    leadType: 'contact',
    fullName: data.fullName,
    email: normalizedEmail,
    phone: data.phone,
    message: data.message,
    locale: data.locale,
    createdAt: nowIso,
    sourcePage: data.sourcePage,
  });

  try {
    const supabase = createAdminClient();
    await supabase
      .from('marketing_leads')
      .update({
        metadata: {
          ...initialMetadata,
          notification: {
            status: notifResult.status,
            attemptedAt: notifResult.attemptedAt,
            errorCode: notifResult.errorCode ?? null,
          },
        },
      })
      .eq('reference_id', savedReferenceId);
  } catch (updateErr) {
    console.error('[METADATA_UPDATE_ERROR] Failed to record notification status in lead record:', updateErr);
  }

  return NextResponse.json(
    {
      ok: true,
      referenceId: savedReferenceId,
      message: 'Thank you for reaching out. Your request has been received.',
    },
    { status: 200, headers: responseHeaders }
  );
}

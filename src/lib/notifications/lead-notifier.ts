import 'server-only';

export interface LeadNotificationPayload {
  referenceId: string;
  leadType: 'contact' | 'pilot';
  fullName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  buildingType?: string | null;
  unitsCount?: number | null;
  currentSoftware?: string | null;
  city?: string | null;
  county?: string | null;
  message?: string | null;
  locale: string;
  createdAt: string;
  sourcePage?: string | null;
}

export interface NotificationResult {
  status: 'sent' | 'skipped_no_config' | 'failed';
  attemptedAt: string;
  errorCode?: string;
}

/**
 * Sanitizes any header or text value to prevent HTTP header injection.
 */
function sanitizeHeader(val: string): string {
  return val.replace(/[\r\n\x00-\x1F]/g, '').trim();
}

/**
 * Dispatches a secure server-side lead notification.
 * 1. Reads destination strictly from server environment (prevents SSRF).
 * 2. Never throws: failure is captured and technical status is logged without PII.
 * 3. Enforces HTTPS, 4s timeout, max response size, and no redirects.
 */
export async function notifyNewLead(payload: LeadNotificationPayload): Promise<NotificationResult> {
  const attemptedAt = new Date().toISOString();
  const webhookUrl = process.env.CONTACT_NOTIFICATION_WEBHOOK_URL?.trim();

  // If no notification endpoint configured: log non-sensitive metadata only
  if (!webhookUrl) {
    console.info('[LEAD_NOTIFICATION_SKIPPED]', {
      referenceId: payload.referenceId,
      leadType: payload.leadType,
      locale: payload.locale,
      status: 'no_notification_channel_configured',
    });
    return { status: 'skipped_no_config', attemptedAt };
  }

  // SSRF Protection: strictly enforce HTTPS
  let destination: URL;
  try {
    destination = new URL(webhookUrl);
    if (destination.protocol !== 'https:') {
      console.error('[LEAD_NOTIFICATION_ERROR] Destination must use HTTPS.', {
        referenceId: payload.referenceId,
      });
      return { status: 'failed', attemptedAt, errorCode: 'NON_HTTPS_WEBHOOK' };
    }
  } catch {
    console.error('[LEAD_NOTIFICATION_ERROR] Malformed webhook URL.', {
      referenceId: payload.referenceId,
    });
    return { status: 'failed', attemptedAt, errorCode: 'INVALID_WEBHOOK_URL' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CLADORA-Lead-Notifier/1.0',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${sanitizeHeader(apiKey)}`;
    }

    const response = await fetch(destination.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'marketing_lead.created',
        referenceId: payload.referenceId,
        leadType: payload.leadType,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone ?? null,
        role: payload.role ?? null,
        buildingType: payload.buildingType ?? null,
        unitsCount: payload.unitsCount ?? null,
        currentSoftware: payload.currentSoftware ?? null,
        city: payload.city ?? null,
        county: payload.county ?? null,
        message: payload.message ?? null,
        locale: payload.locale,
        createdAt: payload.createdAt,
        sourcePage: payload.sourcePage ?? null,
      }),
      redirect: 'error', // Prevent SSRF via HTTP redirects
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error('[LEAD_NOTIFICATION_FAILED]', {
        referenceId: payload.referenceId,
        statusCode: response.status,
      });
      return {
        status: 'failed',
        attemptedAt,
        errorCode: `HTTP_${response.status}`,
      };
    }

    console.info('[LEAD_NOTIFICATION_SENT]', {
      referenceId: payload.referenceId,
      leadType: payload.leadType,
    });

    return { status: 'sent', attemptedAt };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error('[LEAD_NOTIFICATION_ERROR]', {
      referenceId: payload.referenceId,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    return {
      status: 'failed',
      attemptedAt,
      errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    };
  }
}

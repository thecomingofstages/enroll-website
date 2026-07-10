const RESEND_API_URL = 'https://api.resend.com/emails';

// Resend is called over HTTPS (port 443), not raw SMTP (25/465/587). Render
// (and most PaaS free tiers) blocks outbound SMTP ports, and Gmail SMTP
// itself is unreliable from datacenter IPs regardless — HTTPS sidesteps
// both problems, and there's no port fallback chain or handshake tuning
// needed anymore.
const REQUEST_TIMEOUT_MS = 10000;

async function sendPasswordResetEmail({ to, resetUrl }) {
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, skipped: true };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const rawFrom = process.env.RESEND_FROM || process.env.NO_REPLY_EMAIL || 'no-reply@localhost';
  const fromName = process.env.RESEND_FROM_NAME || process.env.NO_REPLY_NAME || 'TCOS';
  const from = typeof rawFrom === 'string' && rawFrom.includes('<')
    ? rawFrom
    : `${fromName} <${rawFrom}>`;
  const replyTo = process.env.RESEND_REPLY_TO || rawFrom;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: replyTo,
        subject: 'Password Reset for TCOS Enroll Website',
        html: `
          <p>You requested a password reset.</p>
          <p>Use the link below to create a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      }),
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause.name === 'AbortError') {
      const error = new Error(`Resend request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      error.code = 'RESEND_TIMEOUT';
      throw error;
    }
    const error = new Error(`Resend request failed: ${cause.message}`);
    error.code = 'RESEND_NETWORK_ERROR';
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `Resend API responded with HTTP ${response.status}`;
    const error = new Error(`Resend send failed: ${message}`);
    error.code = 'RESEND_SEND_FAILED';
    throw error;
  }

  return { ok: true, messageId: data?.id };
}

module.exports = {
  sendPasswordResetEmail,
};
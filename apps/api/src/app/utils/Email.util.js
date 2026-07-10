const nodemailer = require('nodemailer');

// Remembers which attempt config last succeeded so subsequent sends skip
// straight to it instead of re-walking the fallback chain from the top.
// Reset to null whenever a send fails outright.
let cachedWorkingAttempt = null;

// Nodemailer's own defaults (connectionTimeout 120s, greetingTimeout 30s,
// socketTimeout 600s) are meant for long-lived batch senders, not a
// request/response path. A transactional email should fail fast so the
// fallback loop below can move to the next config in seconds, not minutes.
const ATTEMPT_TIMEOUTS = {
  connectionTimeout: 8000,  // time to open the TCP socket
  greetingTimeout: 5000,    // time to receive the SMTP greeting
  socketTimeout: 10000,     // time allowed for the send itself
};

async function sendPasswordResetEmail({ to, resetUrl }) {
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, skipped: true };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { ok: false, skipped: true, reason: 'SMTP not configured' };
  }

  const rawFrom = process.env.SMTP_FROM || process.env.NO_REPLY_EMAIL || 'no-reply@localhost';
  const fromName = process.env.SMTP_FROM_NAME || process.env.NO_REPLY_NAME || 'TCOS';
  const fromValue = typeof rawFrom === 'string' && rawFrom.includes('<')
    ? rawFrom
    : { name: fromName, address: rawFrom };
  const replyTo = process.env.SMTP_REPLY_TO || rawFrom;
  const baseConfig = {
    host: process.env.SMTP_HOST,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...ATTEMPT_TIMEOUTS,
  };

  const defaultAttempts = [
    {
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
    },
    {
      port: 587,
      secure: false,
    },
    {
      port: 465,
      secure: true,
    },
  ].filter(
    // Drop later entries that are identical to an earlier one — e.g. when
    // SMTP_PORT=587 / SMTP_SECURE=false (Gmail's own recommended config),
    // the env-derived attempt and the hardcoded "587 fallback" are the same
    // combo, and retrying an identical failing config wastes a full
    // connect+greeting timeout for nothing.
    (attempt, index, all) => all.findIndex(
      (other) => other.port === attempt.port && other.secure === attempt.secure
    ) === index
  );

  // If a previous call already found a working port/secure combo, try that
  // first so a healthy production instance doesn't keep re-discovering it
  // (and re-paying the earlier attempts' timeouts) on every single request.
  const attempts = cachedWorkingAttempt
    ? [cachedWorkingAttempt, ...defaultAttempts.filter(
        (attempt) => attempt.port !== cachedWorkingAttempt.port || attempt.secure !== cachedWorkingAttempt.secure
      )]
    : defaultAttempts;

  const mailOptions = {
    from: fromValue,
    replyTo,
    to,
    subject: 'Password Reset for TCOS Enroll Website',
    html: `
      <p>You requested a password reset.</p>
      <p>Use the link below to create a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  };

  let lastError;
  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      ...baseConfig,
      ...attempt,
    });

    try {
      const info = await transporter.sendMail(mailOptions);
      cachedWorkingAttempt = attempt;
      return { ok: true, messageId: info.messageId };
    } catch (error) {
      lastError = error;
    } finally {
      // Release the socket/pool immediately rather than waiting for GC.
      transporter.close?.();
    }
  }

  // Every attempt failed — don't keep pointing future calls at a config
  // that just proved broken.
  cachedWorkingAttempt = null;

  const message = lastError?.message || 'SMTP send failed';
  const error = new Error(`SMTP send failed: ${message}`);
  error.code = 'SMTP_SEND_FAILED';
  throw error;
}

module.exports = {
  sendPasswordResetEmail,
};
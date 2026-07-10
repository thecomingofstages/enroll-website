const nodemailer = require('nodemailer');

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
  };

  const attempts = [
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
  ];

  let lastError;
  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      ...baseConfig,
      ...attempt,
    });

    try {
      const info = await transporter.sendMail({
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
      });
      return { ok: true, messageId: info.messageId };
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError?.message || 'SMTP send failed';
  const error = new Error(`SMTP send failed: ${message}`);
  error.code = 'SMTP_SEND_FAILED';
  throw error;
}

module.exports = {
  sendPasswordResetEmail,
};

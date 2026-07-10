jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');
const { sendPasswordResetEmail } = require('../src/app/utils/Email.util');

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
  });

  test('retries with alternate TLS settings when the first SMTP attempt fails with a protocol mismatch', async () => {
    const sendMail = jest.fn()
      .mockRejectedValueOnce(new Error('wrong version number'))
      .mockResolvedValueOnce({ messageId: 'test-id' });

    nodemailer.createTransport
      .mockReturnValueOnce({ sendMail })
      .mockReturnValueOnce({ sendMail });

    const result = await sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://example.com/reset?token=abc',
    });

    expect(result.ok).toBe(true);
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });
});

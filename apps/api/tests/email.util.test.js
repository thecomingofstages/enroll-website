const { sendPasswordResetEmail } = require('../src/app/utils/Email.util');

describe('sendPasswordResetEmail', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM = 'no-reply@example.com';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NODE_ENV = 'test';
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
  });

  test('sends via the Resend HTTP API and returns the message id on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend-message-id' }),
    });

    const result = await sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://example.com/reset?token=abc',
    });

    expect(result).toEqual({ ok: true, messageId: 'resend-message-id' });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers.Authorization).toBe('Bearer re_test_key');

    const body = JSON.parse(options.body);
    expect(body.to).toBe('user@example.com');
    expect(body.html).toContain('https://example.com/reset?token=abc');
  });

  test('throws when Resend responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Invalid `from` field' }),
    });

    await expect(
      sendPasswordResetEmail({ to: 'user@example.com', resetUrl: 'https://example.com/reset' })
    ).rejects.toThrow(/Invalid `from` field/);
  });

  test('returns a skipped result when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    global.fetch = jest.fn();

    const result = await sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://example.com/reset',
    });

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
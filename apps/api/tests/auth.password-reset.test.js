const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('../src/app/models/User.model');
jest.mock('../src/app/models/PasswordResetToken.model');
jest.mock('../src/app/utils/Email.util', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ ok: true }),
}));

const UserModel = require('../src/app/models/User.model');
const PasswordResetTokenModel = require('../src/app/models/PasswordResetToken.model');
const EmailUtil = require('../src/app/utils/Email.util');
const buildApp = require('./helpers/app');

const app = buildApp();

describe('Password reset flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /v1/auth/forgot-password sends a reset email when the account exists', async () => {
    const user = {
      _id: 'user-1',
      email: 'tester@example.com',
      first_name: 'Test',
      last_name: 'User',
      nickname: 'Tester',
      password_hash: 'hash',
      role: 'user',
      gender: 'Unspecified',
    };

    UserModel.findOne.mockReturnValue({ lean: () => Promise.resolve(user) });
    PasswordResetTokenModel.deleteMany.mockResolvedValue({});
    PasswordResetTokenModel.create.mockResolvedValue({});

    const res = await request(app)
      .post('/v1/auth/forgot-password')
      .send({ email: 'Tester@Example.com' });

    expect(res.status).toBe(200);
    expect(EmailUtil.sendPasswordResetEmail).toHaveBeenCalled();
    expect(PasswordResetTokenModel.create).toHaveBeenCalled();
  });

  test('POST /v1/auth/reset-password updates the password when the token is valid', async () => {
    const user = {
      _id: 'user-1',
      email: 'tester@example.com',
      password_hash: 'old-hash',
      password_changed_at: new Date('2024-01-01'),
      save: jest.fn().mockResolvedValue(true),
    };

    const resetToken = {
      _id: 'token-1',
      user_id: 'user-1',
      token_hash: 'hashed-token',
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
      save: jest.fn().mockResolvedValue(true),
    };

    const crypto = require('crypto');
    const token = 'raw-token';
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    UserModel.findById.mockReturnValue({
      lean: () => Promise.resolve(user),
      exec: () => Promise.resolve(user),
    });
    UserModel.findByIdAndUpdate.mockResolvedValue(user);
    PasswordResetTokenModel.findOne.mockReturnValue({
      lean: () => Promise.resolve(resetToken),
    });
    PasswordResetTokenModel.updateOne.mockResolvedValue({});
    PasswordResetTokenModel.deleteMany.mockResolvedValue({});

    const res = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword@123' });

    expect(res.status).toBe(200);
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(PasswordResetTokenModel.deleteMany).toHaveBeenCalled();
  });
});

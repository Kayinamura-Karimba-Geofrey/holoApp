const request = require('supertest');
const { useDatabase, app, auth, signIn } = require('./helpers');
const emailService = require('../services/emailService');

useDatabase();

describe('password reset', () => {
  const email = 'reset@example.com';
  let sent;
  let oldToken;

  beforeAll(async () => {
    oldToken = (await signIn(email)).token;
    jest.spyOn(emailService, 'sendPasswordReset').mockImplementation(async (to, token) => {
      sent = { to, token };
    });
  });

  afterAll(() => jest.restoreAllMocks());

  test('unknown emails get the same response and no email', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  test('a reset email is sent to registered users', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
    expect(sent.to).toBe(email);
    expect(sent.token).toMatch(/^[a-f0-9]{64}$/);
  });

  test('the token resets the password and revokes old sessions', async () => {
    const res = await request(app).post('/auth/reset-password')
      .send({ token: sent.token, newPassword: 'brand-new-password' });
    expect(res.status).toBe(200);

    expect((await request(app).get('/holobot/history').set(auth(oldToken))).status).toBe(401);
    const login = await request(app).post('/auth/login').send({ email, password: 'brand-new-password' });
    expect(login.status).toBe(200);
  });

  test('the token cannot be reused', async () => {
    const res = await request(app).post('/auth/reset-password')
      .send({ token: sent.token, newPassword: 'another-password' });
    expect(res.status).toBe(400);
  });
});

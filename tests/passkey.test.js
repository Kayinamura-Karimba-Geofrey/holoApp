const request = require('supertest');
const { useDatabase, app, auth, signIn } = require('./helpers');
const config = require('../config/env');

useDatabase();

describe('passkeys', () => {
  let token;

  beforeAll(async () => {
    token = (await signIn('passkey@example.com')).token;
  });

  test('registration options require sign-in', async () => {
    expect((await request(app).post('/auth/passkeys/register/options')).status).toBe(401);

    const res = await request(app).post('/auth/passkeys/register/options').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.challengeId).toMatch(/^[a-f0-9]{24}$/);
    expect(res.body.options.rp.id).toBe(config.webauthn.rpID);
    expect(res.body.options.user.name).toBe('passkey@example.com');
  });

  test('an invalid registration response is rejected and the challenge is single use', async () => {
    const { body } = await request(app).post('/auth/passkeys/register/options').set(auth(token));
    const attempt = () => request(app).post('/auth/passkeys/register/verify').set(auth(token))
      .send({ challengeId: body.challengeId, response: { id: 'bogus', type: 'public-key', response: {} } });

    const first = await attempt();
    expect(first.status).toBe(400);
    expect(first.body.message).toContain('Passkey registration failed');

    const second = await attempt();
    expect(second.body.message).toContain('Challenge expired or not found');
  });

  test('login options look the same for unknown emails', async () => {
    const known = await request(app).post('/auth/passkeys/login/options').send({ email: 'passkey@example.com' });
    const unknown = await request(app).post('/auth/passkeys/login/options').send({ email: 'ghost@example.com' });
    expect(known.status).toBe(200);
    expect(Object.keys(unknown.body.options).sort()).toEqual(Object.keys(known.body.options).sort());
  });

  test('login with an unknown credential fails', async () => {
    const { body } = await request(app).post('/auth/passkeys/login/options').send({});
    const res = await request(app).post('/auth/passkeys/login/verify')
      .send({ challengeId: body.challengeId, response: { id: 'unknown-credential', type: 'public-key', response: {} } });
    expect(res.status).toBe(401);
  });

  test('users can list passkeys', async () => {
    const res = await request(app).get('/auth/passkeys').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect((await request(app).delete('/auth/passkeys/000000000000000000000000').set(auth(token))).status).toBe(404);
  });
});

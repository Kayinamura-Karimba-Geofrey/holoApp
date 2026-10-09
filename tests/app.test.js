const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, disconnectDB } = require('../config/db');
const app = require('../server');
const User = require('../model/user');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
});

afterAll(async () => {
  await disconnectDB();
  await mongo.stop();
});

const creds = { email: 'Alice@Example.com', password: 'correct-horse-battery' };

const register = (body = creds) => request(app).post('/auth/register').send(body);
const login = (body = creds) => request(app).post('/auth/login').send(body);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('basics', () => {
  test('health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('malformed JSON returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('auth', () => {
  let tokens;

  test('register rejects invalid input', async () => {
    const res = await register({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('register ignores role escalation and hides secrets', async () => {
    const res = await register({ ...creds, role: 'admin', fingerprintId: 'abc123def' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeDefined();
  });

  test('duplicate registration returns 409', async () => {
    const res = await register();
    expect(res.status).toBe(409);
  });

  test('login with wrong password returns 401', async () => {
    const res = await login({ ...creds, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('login succeeds', async () => {
    const res = await login();
    expect(res.status).toBe(200);
    tokens = res.body;
  });

  test('fingerprint login requires the matching email', async () => {
    const ok = await request(app).post('/auth/fingerprint')
      .send({ email: creds.email, fingerprintId: 'abc123def' });
    expect(ok.status).toBe(200);

    const bad = await request(app).post('/auth/fingerprint')
      .send({ email: 'someone@else.com', fingerprintId: 'abc123def' });
    expect(bad.status).toBe(401);
  });

  test('protected route requires a valid token', async () => {
    expect((await request(app).get('/holobot/history')).status).toBe(401);
    expect((await request(app).get('/holobot/history').set(auth('garbage'))).status).toBe(401);

    const res = await request(app).get('/holobot/history').set(auth(tokens.token));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('refresh issues new tokens', async () => {
    const res = await request(app).post('/auth/refresh-token').send({ refreshToken: tokens.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('logout revokes access and refresh tokens', async () => {
    const { body } = await login();
    const out = await request(app).post('/auth/logout').set(auth(body.token));
    expect(out.status).toBe(200);

    expect((await request(app).get('/holobot/history').set(auth(body.token))).status).toBe(401);
    const refresh = await request(app).post('/auth/refresh-token').send({ refreshToken: body.refreshToken });
    expect(refresh.status).toBe(401);
  });

  test('forgot password does not reveal unknown emails', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
  });
});

describe('authorization and settings', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    await register({ email: 'bob@example.com', password: 'bob-password-123' });
    await register({ email: 'admin@example.com', password: 'admin-password-123' });
    await User.updateOne({ email: 'admin@example.com' }, { role: 'admin' });
    userToken = (await login({ email: 'bob@example.com', password: 'bob-password-123' })).body.token;
    adminToken = (await login({ email: 'admin@example.com', password: 'admin-password-123' })).body.token;
  });

  test('non-admins cannot reach admin routes', async () => {
    const res = await request(app).get('/operations/stats').set(auth(userToken));
    expect(res.status).toBe(403);
  });

  test('admins can read stats', async () => {
    const res = await request(app).get('/operations/stats').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.adminCount).toBe(1);
  });

  test('system settings persist and reject unknown fields', async () => {
    const res = await request(app).put('/settings/system').set(auth(adminToken))
      .send({ maintenanceMode: true, injected: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.maintenanceMode).toBe(true);
    expect(res.body.injected).toBeUndefined();
  });

  test('users set their own theme', async () => {
    const put = await request(app).put('/settings/theme').set(auth(userToken)).send({ theme: 'neon' });
    expect(put.status).toBe(200);
    const get = await request(app).get('/settings/theme').set(auth(userToken));
    expect(get.body.current).toBe('neon');

    const bad = await request(app).put('/settings/theme').set(auth(userToken)).send({ theme: 'plaid' });
    expect(bad.status).toBe(400);
  });

  test('holobot settings persist per user', async () => {
    const res = await request(app).put('/holobot/settings').set(auth(userToken)).send({ tone: 'formal' });
    expect(res.status).toBe(200);
    expect(res.body.tone).toBe('formal');
  });

  test('holobot chat returns 503 when no AI key is configured', async () => {
    const res = await request(app).post('/holobot/chat').set(auth(userToken)).send({ message: 'hi' });
    expect(res.status).toBe(503);
  });

  test('help article lifecycle', async () => {
    const created = await request(app).post('/help').set(auth(adminToken))
      .send({ title: 'Getting started', content: 'Put on your headset and...' });
    expect(created.status).toBe(201);
    expect(created.body.createdBy).toBeDefined();

    const list = await request(app).get('/help/articles?limit=5');
    expect(list.body.total).toBe(1);

    expect((await request(app).get('/help/not-an-id')).status).toBe(400);
    expect((await request(app).get('/help/000000000000000000000000')).status).toBe(404);
  });

  test('vr scene lookup validates id', async () => {
    expect((await request(app).get('/vr/scenes/1').set(auth(userToken))).status).toBe(200);
    expect((await request(app).get('/vr/scenes/99').set(auth(userToken))).status).toBe(404);
    expect((await request(app).get('/vr/scenes/abc').set(auth(userToken))).status).toBe(400);
  });
});

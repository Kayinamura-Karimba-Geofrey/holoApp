const request = require('supertest');
const { useDatabase, app, auth, signIn } = require('./helpers');
const User = require('../model/user');
const SystemLog = require('../model/SystemLog');

useDatabase();

const creds = { email: 'Alice@Example.com', password: 'correct-horse-battery' };

const register = (body = creds) => request(app).post('/auth/register').send(body);
const login = (body = creds) => request(app).post('/auth/login').send(body);

describe('basics', () => {
  test('health check reports database status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('up');
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
    const res = await register({ ...creds, role: 'admin' });
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

  test('failed and successful logins are audited', async () => {
    const bad = await login({ ...creds, password: 'wrong-password' });
    expect(bad.status).toBe(401);

    const res = await login();
    expect(res.status).toBe(200);
    tokens = res.body;

    const actions = (await SystemLog.find()).map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['auth.register', 'auth.login_failed', 'auth.login']));
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

  test('old fingerprint endpoint is gone', async () => {
    const res = await request(app).post('/auth/fingerprint').send({ email: creds.email, fingerprintId: 'abc123def' });
    expect(res.status).toBe(404);
  });
});

describe('authorization and settings', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    userToken = (await signIn('bob@example.com')).token;
    adminToken = (await signIn('admin@example.com', { admin: true })).token;
  });

  test('non-admins cannot reach admin routes', async () => {
    const res = await request(app).get('/operations/stats').set(auth(userToken));
    expect(res.status).toBe(403);
  });

  test('admins can read stats and logs', async () => {
    const res = await request(app).get('/operations/stats').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.adminCount).toBe(1);

    const logs = await request(app).get('/operations/logs?limit=2').set(auth(adminToken));
    expect(logs.status).toBe(200);
    expect(logs.body.items).toHaveLength(2);
  });

  test('clearing logs leaves an audit entry', async () => {
    await request(app).delete('/operations/logs').set(auth(adminToken));
    const logs = await SystemLog.find();
    expect(logs.map((l) => l.action)).toEqual(['operations.logs_cleared']);
  });

  test('system settings persist and reject unknown fields', async () => {
    const res = await request(app).put('/settings/system').set(auth(adminToken))
      .send({ version: '1.1.0', injected: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.1.0');
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

  test('admin flag on the user document is what grants access', async () => {
    await User.updateOne({ email: 'admin@example.com' }, { role: 'user' });
    expect((await request(app).get('/operations/stats').set(auth(adminToken))).status).toBe(403);
    await User.updateOne({ email: 'admin@example.com' }, { role: 'admin' });
  });
});

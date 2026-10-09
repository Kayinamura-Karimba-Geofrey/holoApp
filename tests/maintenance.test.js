const request = require('supertest');
const { useDatabase, app, auth, signIn } = require('./helpers');

useDatabase();

describe('maintenance mode', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    userToken = (await signIn('m-user@example.com')).token;
    adminToken = (await signIn('m-admin@example.com', { admin: true })).token;
    const res = await request(app).put('/settings/system').set(auth(adminToken)).send({ maintenanceMode: true });
    expect(res.body.maintenanceMode).toBe(true);
  });

  test('blocks regular users with 503', async () => {
    const res = await request(app).get('/holobot/history').set(auth(userToken));
    expect(res.status).toBe(503);
    expect(res.headers['retry-after']).toBe('300');
  });

  test('admins and sign-in stay available', async () => {
    expect((await request(app).get('/holobot/history').set(auth(adminToken))).status).toBe(200);
    expect((await request(app).get('/health')).status).toBe(200);
    const login = await request(app).post('/auth/login').send({ email: 'm-user@example.com', password: 'wrong' });
    expect(login.status).toBe(401);
  });

  test('turning it off restores access immediately', async () => {
    await request(app).put('/settings/system').set(auth(adminToken)).send({ maintenanceMode: false });
    expect((await request(app).get('/holobot/history').set(auth(userToken))).status).toBe(200);
  });
});

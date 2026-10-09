const http = require('http');
const request = require('supertest');
const WebSocket = require('ws');
const { useDatabase, app, auth, signIn } = require('./helpers');
const vrSocket = require('../services/vrSocket');
const VRDevice = require('../model/VRDevice');

useDatabase();

// Opens a device connection and returns helpers to read its messages.
const connectDevice = (port) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/vr/ws`);
    const messages = [];
    const waiters = [];
    ws.on('message', (raw) => {
      messages.push(JSON.parse(raw));
      waiters.splice(0).forEach((w) => w());
    });
    const next = () =>
      new Promise((res) => {
        const check = () => (messages.length ? res(messages.shift()) : waiters.push(check));
        check();
      });
    const closed = new Promise((res) => ws.on('close', (code) => res(code)));
    ws.on('open', () => resolve({ ws, next, closed }));
    ws.on('error', reject);
  });

const waitFor = async (fn, tries = 50) => {
  for (let i = 0; i < tries; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('condition not met');
};

describe('vr', () => {
  let server;
  let port;
  let adminToken;
  let userToken;
  let device;
  let deviceKey;

  beforeAll(async () => {
    adminToken = (await signIn('vr-admin@example.com', { admin: true })).token;
    userToken = (await signIn('vr-user@example.com')).token;
    server = http.createServer(app);
    vrSocket.attach(server);
    await new Promise((r) => server.listen(0, r));
    port = server.address().port;
  });

  afterAll(async () => {
    await vrSocket.close();
    await new Promise((r) => server.close(r));
  });

  test('only admins can register devices; the key is shown once', async () => {
    const denied = await request(app).post('/vr/devices').set(auth(userToken)).send({ name: 'Quest' });
    expect(denied.status).toBe(403);

    const res = await request(app).post('/vr/devices').set(auth(adminToken)).send({ name: 'Quest', type: 'VR' });
    expect(res.status).toBe(201);
    ({ device, deviceKey } = res.body);
    expect(deviceKey).toMatch(/^[a-f0-9]{64}$/);
    expect(device.keyHash).toBeUndefined();

    const list = await request(app).get('/vr/devices').set(auth(userToken));
    expect(list.body[0].keyHash).toBeUndefined();
  });

  test('a device with the wrong key is rejected', async () => {
    const { ws, closed } = await connectDevice(port);
    ws.send(JSON.stringify({ type: 'auth', deviceId: device._id, key: 'f'.repeat(64) }));
    expect(await closed).toBe(4003);
  });

  test('config is pushed live to a connected device', async () => {
    const { ws, next } = await connectDevice(port);
    ws.send(JSON.stringify({ type: 'auth', deviceId: device._id, key: deviceKey }));
    expect((await next()).type).toBe('ready');
    await waitFor(async () => (await VRDevice.findById(device._id)).status === 'connected');

    const res = await request(app).post('/vr/config').set(auth(userToken))
      .send({ deviceId: device._id, settings: { brightness: 0.7 } });
    expect(res.body.delivered).toBe(true);
    expect(await next()).toEqual({ type: 'config', settings: { brightness: 0.7 } });

    ws.close();
    await waitFor(async () => (await VRDevice.findById(device._id)).status === 'disconnected');
  });

  test('offline devices get the saved config when they reconnect', async () => {
    const res = await request(app).post('/vr/config').set(auth(userToken))
      .send({ deviceId: device._id, settings: { brightness: 0.2 } });
    expect(res.body.delivered).toBe(false);

    const { ws, next } = await connectDevice(port);
    ws.send(JSON.stringify({ type: 'auth', deviceId: device._id, key: deviceKey }));
    expect(await next()).toEqual({ type: 'ready', config: { brightness: 0.2 } });
    ws.close();
  });

  test('scene CRUD', async () => {
    const created = await request(app).post('/vr/scenes').set(auth(adminToken))
      .send({ name: 'Holofabric Lab', description: 'Sandbox' });
    expect(created.status).toBe(201);

    const one = await request(app).get(`/vr/scenes/${created.body._id}`).set(auth(userToken));
    expect(one.body.name).toBe('Holofabric Lab');

    expect((await request(app).get('/vr/scenes/abc').set(auth(userToken))).status).toBe(400);
    expect((await request(app).post('/vr/scenes').set(auth(userToken)).send({ name: 'Nope' })).status).toBe(403);

    const del = await request(app).delete(`/vr/scenes/${created.body._id}`).set(auth(adminToken));
    expect(del.status).toBe(200);
  });
});

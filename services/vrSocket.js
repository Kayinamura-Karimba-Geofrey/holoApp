const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const VRDevice = require('../model/VRDevice');
const logger = require('../utils/logger');

// Headsets connect to ws(s)://<host>/vr/ws and must send, within AUTH_TIMEOUT_MS:
//   {"type":"auth","deviceId":"<id>","key":"<device key>"}
// The server replies {"type":"ready","config":{...}} and later pushes
// {"type":"config","settings":{...}} whenever someone applies a new config.

const AUTH_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 30000;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const sockets = new Map(); // deviceId -> WebSocket
let wss = null;
let heartbeat = null;

const setStatus = (deviceId, status, ipAddress) =>
  VRDevice.updateOne(
    { _id: deviceId },
    { $set: { status, lastSeenAt: new Date(), ...(ipAddress && { ipAddress }) } }
  ).catch((err) => logger.error({ err, deviceId }, 'Failed to update device status'));

const authenticate = async (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (msg?.type !== 'auth' || typeof msg.deviceId !== 'string' || typeof msg.key !== 'string') return null;
  if (!/^[a-f0-9]{24}$/.test(msg.deviceId)) return null;

  const device = await VRDevice.findById(msg.deviceId).select('+keyHash');
  const expected = device && Buffer.from(device.keyHash, 'hex');
  const actual = Buffer.from(sha256(msg.key), 'hex');
  if (!expected || !crypto.timingSafeEqual(expected, actual)) return null;
  return device;
};

exports.attach = (server) => {
  wss = new WebSocketServer({ server, path: '/vr/ws', maxPayload: 64 * 1024 });

  wss.on('connection', (ws, req) => {
    let deviceId = null;
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    const authTimer = setTimeout(() => ws.close(4001, 'Authentication timeout'), AUTH_TIMEOUT_MS);

    ws.on('message', async (raw) => {
      if (deviceId) return; // Devices only send the auth message for now.
      clearTimeout(authTimer);
      const device = await authenticate(raw.toString());
      if (!device) return ws.close(4003, 'Authentication failed');

      deviceId = device._id.toString();
      sockets.get(deviceId)?.close(4000, 'Replaced by a new connection');
      sockets.set(deviceId, ws);
      await setStatus(deviceId, 'connected', req.socket.remoteAddress);
      ws.send(JSON.stringify({ type: 'ready', config: device.config }));
      logger.info({ deviceId }, 'VR device connected');
    });

    ws.on('close', () => {
      clearTimeout(authTimer);
      if (deviceId && sockets.get(deviceId) === ws) {
        sockets.delete(deviceId);
        setStatus(deviceId, 'disconnected');
        logger.info({ deviceId }, 'VR device disconnected');
      }
    });
  });

  heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_MS);

  return wss;
};

// Returns true if the device is online and the message was sent.
exports.push = (deviceId, message) => {
  const ws = sockets.get(deviceId.toString());
  if (!ws || ws.readyState !== ws.OPEN) return false;
  ws.send(JSON.stringify(message));
  return true;
};

exports.disconnect = (deviceId) => sockets.get(deviceId.toString())?.close(4004, 'Device removed');

exports.close = () =>
  new Promise((resolve) => {
    clearInterval(heartbeat);
    if (!wss) return resolve();
    wss.clients.forEach((ws) => ws.close(1001, 'Server shutting down'));
    wss.close(() => resolve());
  });

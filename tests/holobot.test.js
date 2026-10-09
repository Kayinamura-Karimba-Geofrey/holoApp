const request = require('supertest');
const { Readable } = require('stream');
const axios = require('axios');
const { useDatabase, app, auth, signIn } = require('./helpers');
const config = require('../config/env');
const HelpArticle = require('../model/helpArticle');
const ChatHistory = require('../model/chatHistory');

useDatabase();

const reply = (content) => ({ data: { choices: [{ message: { content } }] } });

const sseStream = (chunks) =>
  Readable.from([
    ...chunks.map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`),
    'data: [DONE]\n\n',
  ]);

describe('holobot', () => {
  let token;
  let post;

  beforeAll(async () => {
    config.ai.apiKey = 'test-key';
    token = (await signIn('chat@example.com')).token;
    await HelpArticle.syncIndexes();
    await HelpArticle.create({ title: 'Calibrating your headset', content: 'Open settings and choose calibrate to align the lenses.' });
  });

  beforeEach(() => {
    post = jest.spyOn(axios, 'post');
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    delete config.ai.apiKey;
  });

  test('returns 503 when no AI key is configured', async () => {
    delete config.ai.apiKey;
    const res = await request(app).post('/holobot/chat').set(auth(token)).send({ message: 'hi' });
    expect(res.status).toBe(503);
    config.ai.apiKey = 'test-key';
  });

  test('includes relevant help articles and the user tone in the prompt', async () => {
    await request(app).put('/holobot/settings').set(auth(token)).send({ tone: 'formal' });
    post.mockResolvedValue(reply('Open settings, then calibrate.'));

    const res = await request(app).post('/holobot/chat').set(auth(token))
      .send({ message: 'How do I calibrate my headset?' });

    expect(res.status).toBe(200);
    expect(res.body.response).toBe('Open settings, then calibrate.');
    expect(res.body.sources[0].title).toBe('Calibrating your headset');

    const [, body, options] = post.mock.calls[0];
    expect(body.messages[0].content).toContain('formal tone');
    expect(body.messages[0].content).toContain('Calibrating your headset');
    expect(options.timeout).toBe(config.ai.timeoutMs);
  });

  test('provider failures return 502', async () => {
    post.mockRejectedValue(Object.assign(new Error('boom'), { response: { status: 500 } }));
    const res = await request(app).post('/holobot/chat').set(auth(token)).send({ message: 'hello' });
    expect(res.status).toBe(502);
  });

  test('streams replies as server-sent events and saves the result', async () => {
    post.mockResolvedValue({ data: sseStream(['Hel', 'lo!']) });

    const res = await request(app).post('/holobot/chat/stream').set(auth(token)).send({ message: 'stream please' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: delta\ndata: {"delta":"Hel"}');
    expect(res.text).toContain('event: done');
    expect(await ChatHistory.findOne({ message: 'stream please' })).toMatchObject({ response: 'Hello!' });
  });

  test('enforces the daily message limit', async () => {
    const original = config.ai.dailyLimit;
    config.ai.dailyLimit = 2; // two messages were already saved above

    const usage = await request(app).get('/holobot/usage').set(auth(token));
    expect(usage.body).toMatchObject({ used: 2, remaining: 0 });

    const res = await request(app).post('/holobot/chat').set(auth(token)).send({ message: 'one more' });
    expect(res.status).toBe(429);
    expect(post).not.toHaveBeenCalled();

    config.ai.dailyLimit = original;
  });
});

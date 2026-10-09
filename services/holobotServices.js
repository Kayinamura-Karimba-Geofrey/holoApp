const ChatHistory = require('../model/chatHistory');
const HelpArticle = require('../model/helpArticle');
const User = require('../model/user');
const axios = require('axios');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { paginate } = require('../utils/pagination');

const HISTORY_TURNS = 5;
const ARTICLE_LIMIT = 3;
const ARTICLE_CHARS = 1500;

const startOfUtcDay = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

exports.getUsage = async (userId) => {
  const used = await ChatHistory.countDocuments({ userId, createdAt: { $gte: startOfUtcDay() } });
  return { used, limit: config.ai.dailyLimit, remaining: Math.max(config.ai.dailyLimit - used, 0) };
};

const assertCanChat = async (userId) => {
  if (!config.ai.apiKey) throw new AppError('Holobot is not configured', 503);
  const { remaining } = await exports.getUsage(userId);
  if (remaining === 0) throw new AppError('Daily Holobot message limit reached; try again tomorrow', 429);
};

// Help articles matching the question, so answers reflect HoloApp's own docs.
const findRelevantArticles = (message) =>
  HelpArticle.find({ $text: { $search: message } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(ARTICLE_LIMIT)
    .lean();

const buildMessages = async (user, { message, context }) => {
  const { aiTone } = user.preferences;
  const [recent, articles] = await Promise.all([
    ChatHistory.find({ userId: user._id }).sort({ createdAt: -1 }).limit(HISTORY_TURNS),
    findRelevantArticles(message),
  ]);

  let system = `You are Holobot, the HoloApp assistant. Respond in a ${aiTone} tone.`;
  if (context) system += ` The user is currently in: ${context}.`;
  if (articles.length) {
    system += '\n\nUse these HoloApp help articles when they are relevant. If they do not answer the question, say so rather than guessing.\n';
    system += articles
      .map((a) => `\n### ${a.title}\n${a.content.slice(0, ARTICLE_CHARS)}`)
      .join('\n');
  }

  return {
    messages: [
      { role: 'system', content: system },
      ...recent.reverse().flatMap((h) => [
        { role: 'user', content: h.message },
        { role: 'assistant', content: h.response }
      ]),
      { role: 'user', content: message }
    ],
    sources: articles.map((a) => ({ id: a._id, title: a.title })),
  };
};

const requestOptions = (extra = {}) => ({
  headers: { Authorization: `Bearer ${config.ai.apiKey}` },
  timeout: config.ai.timeoutMs,
  ...extra,
});

exports.sendMessage = async (user, { message, context }) => {
  await assertCanChat(user._id);
  const { messages, sources } = await buildMessages(user, { message, context });

  let reply;
  try {
    const response = await axios.post(config.ai.apiUrl, {
      model: config.ai.model,
      temperature: user.preferences.aiTemperature,
      messages
    }, requestOptions());
    reply = response.data.choices[0].message.content;
  } catch (err) {
    logger.error({ status: err.response?.status, message: err.message }, 'AI provider error');
    throw new AppError('Holobot is temporarily unavailable', 502);
  }

  await ChatHistory.create({ userId: user._id, message, response: reply, context });
  return { response: reply, sources };
};

// Streams the reply as it is generated. `onDelta` receives each text chunk;
// resolves with the full reply once the provider finishes.
exports.streamMessage = async (user, { message, context }, { onDelta, signal }) => {
  await assertCanChat(user._id);
  const { messages, sources } = await buildMessages(user, { message, context });

  let stream;
  try {
    const response = await axios.post(config.ai.apiUrl, {
      model: config.ai.model,
      temperature: user.preferences.aiTemperature,
      messages,
      stream: true
    }, requestOptions({ responseType: 'stream', signal }));
    stream = response.data;
  } catch (err) {
    logger.error({ status: err.response?.status, message: err.message }, 'AI provider error');
    throw new AppError('Holobot is temporarily unavailable', 502);
  }

  let reply = '';
  let buffer = '';
  try {
    for await (const chunk of stream) {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, '').trim();
        if (!line.startsWith('data:') || !data || data === '[DONE]') continue;
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) {
          reply += delta;
          onDelta(delta);
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return { response: reply, sources, aborted: true };
    logger.error({ err }, 'AI stream error');
    throw new AppError('Holobot stream was interrupted', 502);
  }

  if (reply) await ChatHistory.create({ userId: user._id, message, response: reply, context });
  return { response: reply, sources };
};

exports.getHistory = async (userId, pagination) => paginate(ChatHistory, { userId }, pagination);

exports.clearHistory = async (userId) => {
  await ChatHistory.deleteMany({ userId });
  return { message: 'Chat history cleared' };
};

const toSettings = (preferences) => ({
  model: config.ai.model,
  tone: preferences.aiTone,
  temperature: preferences.aiTemperature
});

exports.getSettings = async (user) => toSettings(user.preferences);

exports.updateSettings = async (userId, { tone, temperature }) => {
  const update = {};
  if (tone !== undefined) update['preferences.aiTone'] = tone;
  if (temperature !== undefined) update['preferences.aiTemperature'] = temperature;

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true });
  return toSettings(user.preferences);
};

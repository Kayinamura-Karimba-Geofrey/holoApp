const ChatHistory = require('../model/chatHistory');
const User = require('../model/user');
const axios = require('axios');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { paginate } = require('../utils/pagination');

const HISTORY_TURNS = 5;

exports.sendMessage = async (user, { message, context }) => {
  if (!config.ai.apiKey) throw new AppError('Holobot is not configured', 503);

  const { aiTone, aiTemperature } = user.preferences;
  const recent = await ChatHistory.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURNS);

  const messages = [
    {
      role: 'system',
      content: `You are Holobot, the HoloApp assistant. Respond in a ${aiTone} tone.` +
        (context ? ` The user is currently in: ${context}.` : '')
    },
    ...recent.reverse().flatMap((h) => [
      { role: 'user', content: h.message },
      { role: 'assistant', content: h.response }
    ]),
    { role: 'user', content: message }
  ];

  let reply;
  try {
    const response = await axios.post(config.ai.apiUrl, {
      model: config.ai.model,
      temperature: aiTemperature,
      messages
    }, {
      headers: { Authorization: `Bearer ${config.ai.apiKey}` },
      timeout: config.ai.timeoutMs
    });
    reply = response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI provider error:', err.response?.status || err.message);
    throw new AppError('Holobot is temporarily unavailable', 502);
  }

  await ChatHistory.create({ userId: user._id, message, response: reply, context });
  return { response: reply };
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

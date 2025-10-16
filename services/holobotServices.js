const ChatHistory = require('../model/chartHistory');
const axios = require('axios');

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY;

exports.sendMessage = async (userId, { message, context }) => {
  const response = await axios.post(AI_API_URL, {
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: message }]
  }, {
    headers: { Authorization: `Bearer ${AI_API_KEY}` }
  });

  const reply = response.data.choices[0].message.content;
  await ChatHistory.create({ userId, message, response: reply, context });
  return { response: reply };
};

exports.getHistory = async (userId) => {
  return await ChatHistory.find({ userId }).sort({ createdAt: -1 });
};

exports.clearHistory = async (userId) => {
  await ChatHistory.deleteMany({ userId });
  return { message: 'Chat history cleared' };
};

exports.getSettings = async () => {
  return { model: 'gpt-4-turbo', tone: 'friendly', temperature: 0.8 };
};

exports.updateSettings = async (settings) => {
  // Persist if needed in DB
  return { message: 'AI settings updated', settings };
};

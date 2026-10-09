// Seeds default VR scenes and, optionally, the first admin account.
//   npm run seed
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' npm run seed
// Safe to run more than once.
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../model/user');
const VRScene = require('../model/VRScene');
const logger = require('../utils/logger');

const DEFAULT_SCENES = [
  { name: 'Solar System Arena', description: 'Explore the planets at true relative scale.' },
  { name: 'Holofabric Lab', description: 'A sandbox for building holographic objects.' },
];

const seedScenes = async () => {
  for (const scene of DEFAULT_SCENES) {
    await VRScene.updateOne({ name: scene.name }, { $setOnInsert: scene }, { upsert: true });
  }
  logger.info(`Ensured ${DEFAULT_SCENES.length} default scenes`);
};

const seedAdmin = async () => {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email) return;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    logger.info(`Promoted ${email} to admin`);
    return;
  }
  if (!password || password.length < 12) {
    throw new Error('ADMIN_PASSWORD (12+ characters) is required to create a new admin');
  }
  await User.create({ email, password: await bcrypt.hash(password, 12), role: 'admin' });
  logger.info(`Created admin ${email}`);
};

(async () => {
  try {
    await connectDB();
    await seedScenes();
    await seedAdmin();
  } catch (err) {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();

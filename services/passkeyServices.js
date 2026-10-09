const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const Passkey = require('../model/passkey');
const Challenge = require('../model/webauthnChallenge');
const User = require('../model/user');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const audit = require('./auditService');
const { issueTokens } = require('./authServices');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const { rpID, rpName, origins } = config.webauthn;

const saveChallenge = (challenge, type, userId) =>
  Challenge.create({ challenge, type, userId, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) });

// Challenges are single use: fetch and delete in one step.
const takeChallenge = async (id, type, userId) => {
  const filter = { _id: id, type, expiresAt: { $gt: new Date() }, ...(userId && { userId }) };
  const doc = await Challenge.findOneAndDelete(filter);
  if (!doc) throw new AppError('Challenge expired or not found; start again', 400);
  return doc;
};

exports.registrationOptions = async (user) => {
  const existing = await Passkey.find({ userId: user._id });
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.name || user.email,
    userID: new TextEncoder().encode(user._id.toString()),
    attestationType: 'none',
    excludeCredentials: existing.map((p) => ({ id: p.credentialId, transports: p.transports })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  const challenge = await saveChallenge(options.challenge, 'registration', user._id);
  return { challengeId: challenge._id, options };
};

exports.verifyRegistration = async (user, { challengeId, response, name }, req) => {
  const { challenge } = await takeChallenge(challengeId, 'registration', user._id);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origins,
      expectedRPID: rpID,
    });
  } catch (err) {
    throw new AppError(`Passkey registration failed: ${err.message}`, 400);
  }
  if (!verification.verified) throw new AppError('Passkey registration failed', 400);

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const passkey = await Passkey.create({
    userId: user._id,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports || [],
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    name,
  });
  await audit.log('auth.passkey_added', { userId: user._id, passkeyId: passkey._id, req });
  return passkey;
};

exports.authenticationOptions = async ({ email } = {}) => {
  // With an email we list that user's passkeys; without one the browser offers
  // any discoverable passkey for this site. Unknown emails get the same
  // response shape so accounts can't be enumerated.
  let allowCredentials;
  if (email) {
    const user = await User.findOne({ email });
    const passkeys = user ? await Passkey.find({ userId: user._id }) : [];
    allowCredentials = passkeys.map((p) => ({ id: p.credentialId, transports: p.transports }));
  }
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });
  const challenge = await saveChallenge(options.challenge, 'authentication');
  return { challengeId: challenge._id, options };
};

exports.verifyAuthentication = async ({ challengeId, response }, req) => {
  const { challenge } = await takeChallenge(challengeId, 'authentication');

  const passkey = await Passkey.findOne({ credentialId: response.id });
  if (!passkey) {
    await audit.log('auth.login_failed', { method: 'passkey', req });
    throw new AppError('Passkey not recognized', 401);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origins,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });
  } catch {
    verification = { verified: false };
  }
  if (!verification.verified) {
    await audit.log('auth.login_failed', { userId: passkey.userId, method: 'passkey', req });
    throw new AppError('Passkey verification failed', 401);
  }

  passkey.counter = verification.authenticationInfo.newCounter;
  passkey.lastUsedAt = new Date();
  await passkey.save();

  const user = await User.findById(passkey.userId);
  if (!user) throw new AppError('Passkey not recognized', 401);
  await audit.log('auth.login', { userId: user._id, method: 'passkey', req });
  return { ...issueTokens(user), user };
};

exports.listPasskeys = async (userId) => Passkey.find({ userId }).sort({ createdAt: -1 });

exports.deletePasskey = async (userId, id, req) => {
  const deleted = await Passkey.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new AppError('Passkey not found', 404);
  await audit.log('auth.passkey_removed', { userId, passkeyId: id, req });
  return { message: 'Passkey removed' };
};

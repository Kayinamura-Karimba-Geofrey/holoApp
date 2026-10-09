const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

const transport = config.mail.smtp ? nodemailer.createTransport(config.mail.smtp) : null;

if (!transport && config.env === 'production') {
  logger.warn('SMTP is not configured: emails will not be delivered');
}

exports.send = async ({ to, subject, text, html }) => {
  if (!transport) {
    // No SMTP configured: show the message in development, drop it elsewhere.
    if (config.env === 'development') logger.info({ to, subject, text }, 'Email (not sent: SMTP not configured)');
    return;
  }
  await transport.sendMail({ from: config.mail.from, to, subject, text, html });
};

exports.sendPasswordReset = async (email, token) => {
  const link = `${config.appUrl}/reset-password?token=${token}`;
  await exports.send({
    to: email,
    subject: 'Reset your HoloApp password',
    text: `Someone asked to reset your HoloApp password.\n\nReset it here (valid for 1 hour): ${link}\n\nIf this wasn't you, ignore this email.`,
    html: `<p>Someone asked to reset your HoloApp password.</p>
<p><a href="${link}">Reset your password</a> (valid for 1 hour).</p>
<p>If this wasn't you, ignore this email.</p>`,
  });
};

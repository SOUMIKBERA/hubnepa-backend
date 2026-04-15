const crypto = require('crypto');

const generateOTP = (length = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
};

const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

const generateReferralCode = (name) => {
  const prefix = name.substring(0, 5).toUpperCase().replace(/\s/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
};

module.exports = { generateOTP, generateToken, generateReferralCode };
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./auth.model');
const { sendEmail, resetPasswordTemplate } = require('../../utils/sendEmail');
const { generateReferralCode } = require('../../utils/generateOTP');

const generateAccessToken = (userId, role, email) => {
  return jwt.sign({ userId, role, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

const register = async (data) => {
  const { firstName, lastName, email, password, phone, role, referralCode } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  const userReferralCode = generateReferralCode(`${firstName}${lastName}`);

  let referredByUser = null;
  if (referralCode) {
    referredByUser = await User.findOne({ referralCode });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role: role || 'customer',
    referralCode: userReferralCode,
    referredBy: referredByUser ? referredByUser._id : null,
    rewardPoints: referredByUser ? 200 : 0,
  });

  // Reward referrer
  if (referredByUser) {
    await User.findByIdAndUpdate(referredByUser._id, {
      $inc: { walletBalance: 20, rewardPoints: 500 },
    });
  }

  const accessToken = generateAccessToken(user._id, user.role, user.email);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account has been deactivated. Contact support.');
    err.statusCode = 403;
    throw err;
  }

  if (user.authProvider === 'google') {
    const err = new Error('This account uses Google login. Please sign in with Google.');
    err.statusCode = 400;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken(user._id, user.role, user.email);
  const refreshToken = generateRefreshToken(user._id);

  await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

const googleAuth = async (googleData) => {
  const { googleId, email, firstName, lastName, avatar } = googleData;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (avatar) user.avatar = avatar;
      await user.save();
    }
  } else {
    const referralCode = generateReferralCode(`${firstName}${lastName}`);
    user = await User.create({
      firstName,
      lastName,
      email,
      googleId,
      avatar,
      authProvider: 'google',
      isEmailVerified: true,
      role: 'customer',
      referralCode,
    });
  }

  const accessToken = generateAccessToken(user._id, user.role, user.email);
  const refreshToken = generateRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

  const userObj = user.toObject();
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('No account found with this email.');
    err.statusCode = 404;
    throw err;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpire: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'HubNepa Password Reset Request',
    html: resetPasswordTemplate(resetUrl),
  });

  return true;
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    const err = new Error('Invalid or expired reset token.');
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = undefined;
  await user.save();

  return true;
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('Refresh token is required.');
    err.statusCode = 400;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token.');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error('Refresh token mismatch. Please login again.');
    err.statusCode = 401;
    throw err;
  }

  const newAccessToken = generateAccessToken(user._id, user.role, user.email);
  return { accessToken: newAccessToken };
};

module.exports = {
  register,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};
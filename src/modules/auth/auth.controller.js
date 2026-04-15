const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, 201, 'Registration successful.', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, 200, 'Login successful.', result);
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    // In production: verify Google ID token server-side using google-auth-library
    // Here we accept the payload (integrate with Google OAuth2 token verification)
    const result = await authService.googleAuth(req.body);
    return successResponse(res, 200, 'Google authentication successful.', result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return successResponse(res, 200, 'Password reset link sent to your email.');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    return successResponse(res, 200, 'Password reset successful. Please login.');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    return successResponse(res, 200, 'Access token refreshed.', result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Current user fetched.', { user: req.user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const User = require('./auth.model');
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return successResponse(res, 200, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, forgotPassword, resetPassword, refreshToken, getMe, logout };
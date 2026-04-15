const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('./auth.validation');

// @route   POST /api/v1/auth/register
// @desc    Register new user (all roles)
// @access  Public
router.post('/register', authLimiter, validateRegister, authController.register);

// @route   POST /api/v1/auth/login
// @desc    Login user (all roles)
// @access  Public
router.post('/login', authLimiter, validateLogin, authController.login);

// @route   POST /api/v1/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', authLimiter, authController.googleAuth);

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', authLimiter, validateForgotPassword, authController.forgotPassword);

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', authLimiter, validateResetPassword, authController.resetPassword);

// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', authController.refreshToken);

// @route   GET /api/v1/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   POST /api/v1/auth/logout
// @desc    Logout and invalidate refresh token
// @access  Private
router.post('/logout', protect, authController.logout);

module.exports = router;
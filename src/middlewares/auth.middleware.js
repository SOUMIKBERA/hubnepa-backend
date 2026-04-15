const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../modules/auth/auth.model');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return errorResponse(res, 401, 'Access denied. No token provided.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user) {
      return errorResponse(res, 401, 'Token is invalid or user no longer exists.');
    }
    if (!user.isActive) {
      return errorResponse(res, 401, 'Your account has been deactivated.');
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid token.');
    if (error.name === 'TokenExpiredError') return errorResponse(res, 401, 'Token expired.');
    return errorResponse(res, 500, 'Authentication error.');
  }
};

module.exports = { protect };
const ERROR_MESSAGES = require('../utils/messages.error');
const CODES = require('../utils/codes');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by verifyToken middleware)
    if (!req.user || !req.user.id) {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // Check if user is admin using role from JWT token
    if (req.user.role !== 'admin') {
      return res.status(CODES.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED
      });
    }
    
    next();
  } catch (err) {
    console.error('Error in requireAdmin middleware:', err);
    return res.status(CODES.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// Middleware to check if user is admin or member (for mixed access)
const requireAdminOrMember = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // Check if user is admin or member using role from JWT token
    if (!['admin', 'member'].includes(req.user.role)) {
      return res.status(CODES.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_ROLE
      });
    }
    
    next();
  } catch (err) {
    console.error('Error in requireAdminOrMember middleware:', err);
    return res.status(CODES.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// Middleware to check if user can access their own data or is admin
const requireAdminOrOwner = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // Check if user is admin or accessing their own data using role from JWT token
    const targetUserId = req.params.user_id || req.params.id || req.body.user_id;
    
    if (req.user.role === 'admin' || req.user.id === targetUserId) {
      next();
    } else {
      return res.status(CODES.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.ACCESS_DENIED
      });
    }
  } catch (err) {
    console.error('Error in requireAdminOrOwner middleware:', err);
    return res.status(CODES.SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  requireAdmin,
  requireAdminOrMember,
  requireAdminOrOwner
};

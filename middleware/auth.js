const jwt = require('jsonwebtoken');
const CODES = require('../utils/codes');
const ERROR_MESSAGES = require('../utils/messages.error');
const {JWT_SECRET,JWT_EXPIRES_IN} = require('../config/env');

exports.generateToken = (user) => {
  const payload = {
    id: user.id,
    mobilenumber: user.mobilenumber,
    fullname: user.fullname,
    role: user.role || 'member', // Include role in token, default to 'member'
    iat: Math.floor(Date.now() / 1000) // issued at
  };
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN// 1 day expiry
  });
};

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(CODES.UNAUTHORIZED).json({ 
      success: false, 
      message: 'Authorization header is required' 
    });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(CODES.UNAUTHORIZED).json({ 
      success: false, 
      message: 'Token must start with Bearer ' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(CODES.UNAUTHORIZED).json({ 
      success: false, 
      message: 'Token is required' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'Token has expired' 
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else {
      return res.status(CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'Token verification failed' 
      });
    }
  }
};

// API endpoint for token verification (public endpoint)
exports.verifyTokenAPI = (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Authorization header is required'
    });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Token must start with Bearer '
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(CODES.UNAUTHORIZED).json({
      success: false,
      message: 'Token is required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return res.status(CODES.SUCCESS).json({
      success: true,
      data: {
        user: decoded,
        token: token,
        message: 'Token is valid'
      },
      message: 'Token verification successful'
    });
    
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      return res.status(CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
};

const userService = require('../services/user.service');
const sequelize = require('../config/db');
const CODES = require('../utils/codes');
const ERROR_MESSAGES = require('../utils/messages.error');

// Create user
exports.createUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await userService.createUser(req.body, transaction);
    await transaction.commit();
    return res.status(CODES.CREATED || 201).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message === ERROR_MESSAGES.USER_EXISTS) {
      return res.status(CODES.CONFLICT || 409).json({
        success: false,
        message: ERROR_MESSAGES.USER_EXISTS
      });
    }
    
    if (err.message.includes('validation')) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        errors: err.message.split(', '),
        message: ERROR_MESSAGES.BAD_REQUEST
      });
    }
    
    return next(err);
  }
};

// Get all users with search, filter, and pagination
exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    console.log("err ==>>", err);
    err.message = ERROR_MESSAGES.SERVER_ERROR;
    return next(err);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const result = await userService.updateUser(id, req.body, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }
    
    if (err.message.includes('validation')) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        errors: err.message.split(', '),
        message: ERROR_MESSAGES.BAD_REQUEST
      });
    }
    
    return next(err);
  }
};

// Login user (check device token or generate OTP)
exports.loginUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { mobilenumber, deviceToken } = req.body;

    const result = await userService.loginUser(mobilenumber, deviceToken, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }
    
    if (err.message === ERROR_MESSAGES.MOBILE_REQUIRED) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MOBILE_REQUIRED
      });
    }
    
    return next(err);
  }
};

// Verify OTP and login
exports.verifyOtp = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { mobilenumber, otp, devicetoken } = req.body;
    const result = await userService.verifyOtp(mobilenumber, otp, devicetoken, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }
    
    if (err.message === ERROR_MESSAGES.INVALID_OTP) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_OTP
      });
    }
    
    if (err.message === ERROR_MESSAGES.OTP_EXPIRED) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.OTP_EXPIRED
      });
    }
    
    if (err.message === ERROR_MESSAGES.MOBILE_OTP_REQUIRED) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.MOBILE_OTP_REQUIRED
      });
    }
    
    if (err.message === ERROR_MESSAGES.INVALID_OTP_FORMAT) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_OTP_FORMAT
      });
    }
    
    return next(err);
  }
};
const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, loginUser, verifyOtp } = require('../controllers/user.controller');
const { verifyToken, verifyTokenAPI } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/verify-token', verifyTokenAPI);

// Protected routes (authentication required)
router.get('/', verifyToken, getAllUsers);  // Enhanced with search and filter
router.post('/create', verifyToken, createUser);
router.put('/:id', verifyToken, updateUser);

module.exports = router;

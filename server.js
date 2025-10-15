require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const { PORT } = require('./config/env');
const routes = require('./routes');

const app = express();
const port = PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Family Tree Management API'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      errors: err.errors.map(e => e.message),
      message: err.message
    });
  }
  
  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      errors: err.details.map(e => e.message),
      message: err.message
    });
  }
  
  // Other errors
  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong!'
  });
});

// Start server
app.listen(port, async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error('Database sync failed:', err);
  }
});

module.exports = app;


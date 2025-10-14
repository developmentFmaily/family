require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const {PORT} = require('./config/env');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

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
    error: err.message || 'Something went wrong!',
    details: err
  });
});

const port = PORT || 3000;
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection has been established successfully.');
    // Sync models with DB (dev only)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

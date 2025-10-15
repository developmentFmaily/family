const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 5432,
  
  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  OTP_EXPIRES_IN: process.env.OTP_EXPIRES_IN || '5m',
  
  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
};
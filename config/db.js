const { Sequelize } = require('sequelize');
const {DB_HOST, DB_NAME,DB_PASS,DB_PORT,DB_USER} = require('../config/env')


const dbConfig = {
      database: DB_NAME,
      username: DB_USER,
      password: DB_PASS,
      host: DB_HOST,
      port: DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    };

const sequelize = new Sequelize(dbConfig);

module.exports = sequelize;

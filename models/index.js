const sequelize = require('../config/db');

// Import all models
const { User } = require('./User');
const { FamilyTree } = require('./FamilyTree');

// Create models object
const models = {
  User,
  FamilyTree,
  sequelize
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;

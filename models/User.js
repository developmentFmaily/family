// User schema for validation
const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  profileimageurl: Joi.string().max(500).allow(null, ''),
  fullname: Joi.string().max(100).required(),
  mobilenumber: Joi.string().max(15).required(),
  birthdate: Joi.date().allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null, ''),
  age: Joi.number().integer().allow(null),
  education: Joi.string().max(100).allow(null, ''),
  familymembers: Joi.number().integer().default(0),
  
  // Native Address (village, taluka, district, state, country)
  native_village: Joi.string().max(100).allow(null, ''),
  native_taluka: Joi.string().max(100).allow(null, ''),
  native_district: Joi.string().max(100).allow(null, ''),
  native_state: Joi.string().max(100).allow(null, ''),
  native_country: Joi.string().max(100).allow(null, ''),
  
  // Current Address (current residence details)
  current_city: Joi.string().max(100).allow(null, ''),
  current_state: Joi.string().max(100).allow(null, ''),
  current_country: Joi.string().max(100).allow(null, ''),
  current_pincode: Joi.string().max(10).allow(null, ''),
  current_area: Joi.string().max(100).allow(null, ''),
  current_buildingnumber: Joi.string().max(100).allow(null, ''),
  current_mapaddress: Joi.string().max(300).allow(null, ''),
  current_latitude: Joi.number().precision(8).allow(null),
  current_longitude: Joi.number().precision(8).allow(null),
  
  // Additional fields
  blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(null, ''),
  living_outside_india: Joi.boolean().default(false),
  key_person_in_family: Joi.boolean().default(false),
  role: Joi.string().valid('admin', 'member').default('member'),
  
  isactive: Joi.boolean().default(true),
  isdeleted: Joi.boolean().default(false),
  createdat: Joi.date().default(Date.now),
  updatedat: Joi.date().default(Date.now),
  createdby: Joi.string().guid({ version: 'uuidv4' }).allow(null, ''),
  updatedby: Joi.string().guid({ version: 'uuidv4' }).allow(null, ''),
  deletedat: Joi.date().allow(null),
  deletedby: Joi.string().guid({ version: 'uuidv4' }).allow(null, ''),
});

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  profileimageurl: { type: DataTypes.STRING(500) },
  fullname: { type: DataTypes.STRING(100) },
  mobilenumber: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  device_token: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  otp: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  otp_created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  birthdate: { type: DataTypes.DATEONLY },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Male', 'Female', 'Other']],
    },
    // Note: This will store as VARCHAR, but you can keep your gender_enum in DB and add a check constraint or use migrations for strict enum type
  },
  age: { type: DataTypes.INTEGER },
  education: { type: DataTypes.STRING(100) },
  familymembers: { type: DataTypes.INTEGER, defaultValue: 0 },
  
  // Native Address fields
  native_village: { type: DataTypes.STRING(100) },
  native_taluka: { type: DataTypes.STRING(100) },
  native_district: { type: DataTypes.STRING(100) },
  native_state: { type: DataTypes.STRING(100) },
  native_country: { type: DataTypes.STRING(100) },
  
  // Current Address fields
  current_city: { type: DataTypes.STRING(100) },
  current_state: { type: DataTypes.STRING(100) },
  current_country: { type: DataTypes.STRING(100) },
  current_pincode: { type: DataTypes.STRING(10) },
  current_area: { type: DataTypes.STRING(100) },
  current_buildingnumber: { type: DataTypes.STRING(100) },
  current_mapaddress: { type: DataTypes.STRING(300) },
  current_latitude: { type: DataTypes.DECIMAL(10, 8) },
  current_longitude: { type: DataTypes.DECIMAL(11, 8) },
  
  // Additional fields
  blood_group: { 
    type: DataTypes.STRING(5),
    allowNull: true,
    validate: {
      isIn: [['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']]
    }
  },
  living_outside_india: { type: DataTypes.BOOLEAN, defaultValue: false },
  key_person_in_family: { type: DataTypes.BOOLEAN, defaultValue: false },
  role: { 
    type: DataTypes.STRING(20),
    defaultValue: 'member',
    validate: {
      isIn: [['admin', 'member']]
    }
  },
  
  isactive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isdeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdby: { type: DataTypes.UUID },
  updatedby: { type: DataTypes.UUID },
  deletedat: { type: DataTypes.DATE },
  deletedby: { type: DataTypes.UUID },
}, {
  tableName: 'User',
  timestamps: false,
});

// Define associations
User.associate = (models) => {
  // Family relationships where user is a parent
  User.hasMany(models.FamilyTree, {
    foreignKey: 'parent_id',
    as: 'children'
  });
  
  // Family relationships where user is a child
  User.hasMany(models.FamilyTree, {
    foreignKey: 'child_id',
    as: 'parents'
  });
  
  // Created relationships
  User.hasMany(models.FamilyTree, {
    foreignKey: 'createdby',
    as: 'createdRelationships'
  });
  
  // Updated relationships
  User.hasMany(models.FamilyTree, {
    foreignKey: 'updatedby',
    as: 'updatedRelationships'
  });
  
  // Deleted relationships
  User.hasMany(models.FamilyTree, {
    foreignKey: 'deletedby',
    as: 'deletedRelationships'
  });
};

module.exports = {
  User,
  userSchema
};

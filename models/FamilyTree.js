const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Joi = require('joi');

// Joi validation schema for family tree relationships
const familyTreeSchema = Joi.object({
  parent_id: Joi.string().uuid().allow(null).optional(),
  child_id: Joi.string().uuid().required(),
  relationship_type: Joi.string().valid(
    'father', 'mother', 'son', 'daughter', 'brother', 'sister',
    'grandfather', 'grandmother', 'grandson', 'granddaughter',
    'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'spouse',
    'father_in_law', 'mother_in_law', 'son_in_law', 'daughter_in_law',
    'brother_in_law', 'sister_in_law', 'stepfather', 'stepmother',
    'stepson', 'stepdaughter', 'half_brother', 'half_sister'
  ).required(),
  is_primary_contact: Joi.boolean().default(false),
  notes: Joi.string().max(500).allow('').optional(),
  isactive: Joi.boolean().default(true),
  isdeleted: Joi.boolean().default(false),
  createdat: Joi.date().optional(),
  updatedat: Joi.date().optional(),
  createdby: Joi.string().uuid().allow(null).optional(),
  updatedby: Joi.string().uuid().allow(null).optional(),
  deletedat: Joi.date().allow(null).optional(),
  deletedby: Joi.string().uuid().allow(null).optional()
});

// FamilyTree model definition
const FamilyTree = sequelize.define('FamilyTree', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    },
    comment: 'Reference to parent/related user'
  },
  child_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    },
    comment: 'Reference to child/related user'
  },
  relationship_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['father', 'mother', 'son', 'daughter', 'brother', 'sister',
              'grandfather', 'grandmother', 'grandson', 'granddaughter',
              'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'spouse',
              'father_in_law', 'mother_in_law', 'son_in_law', 'daughter_in_law',
              'brother_in_law', 'sister_in_law', 'stepfather', 'stepmother',
              'stepson', 'stepdaughter', 'half_brother', 'half_sister']]
    },
    comment: 'Type of relationship between parent and child'
  },
  is_primary_contact: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this person is the primary contact for the family'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the relationship'
  },
  isactive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isdeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdby: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  updatedby: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  deletedat: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletedby: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  }
}, {
  tableName: 'FamilyTree',
  timestamps: false,
  indexes: [
    {
      fields: ['parent_id', 'child_id'],
      unique: true,
      name: 'unique_parent_child_relationship'
    },
    {
      fields: ['child_id']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['relationship_type']
    },
    {
      fields: ['is_primary_contact']
    }
  ]
});

// Define associations
FamilyTree.associate = (models) => {
  // Parent relationship
  FamilyTree.belongsTo(models.User, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  // Child relationship
  FamilyTree.belongsTo(models.User, {
    foreignKey: 'child_id',
    as: 'child'
  });
  
  // Created by relationship
  FamilyTree.belongsTo(models.User, {
    foreignKey: 'createdby',
    as: 'creator'
  });
  
  // Updated by relationship
  FamilyTree.belongsTo(models.User, {
    foreignKey: 'updatedby',
    as: 'updater'
  });
  
  // Deleted by relationship
  FamilyTree.belongsTo(models.User, {
    foreignKey: 'deletedby',
    as: 'deleter'
  });
};

module.exports = { FamilyTree, familyTreeSchema };

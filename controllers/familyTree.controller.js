const familyTreeService = require('../services/familyTree.service');
const CODES = require('../utils/codes');
const SUCCESS_MESSAGES = require('../utils/messages.success');
const ERROR_MESSAGES = require('../utils/messages.error');
const sequelize = require('../config/db');

// Get complete family tree structure
exports.getFamilyTree = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    const result = await familyTreeService.getFamilyTree(user_id);
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    console.error('Error in getFamilyTree controller:', err);
    return next(err);
  }
};

// Add family member relationship
exports.addFamilyMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const relationshipData = {
      ...req.body,
      createdby: req.user.id // Get from authenticated user
    };
    
    const result = await familyTreeService.addFamilyMember(relationshipData, transaction);
    await transaction.commit();
    return res.status(CODES.CREATED).json(result);
  } catch (err) {
    await transaction.rollback();
    
    // Handle required field errors
    if (err.message === ERROR_MESSAGES.CHILD_ID_REQUIRED ||
        err.message === ERROR_MESSAGES.RELATIONSHIP_TYPE_REQUIRED) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: err.message
      });
    }
    
    if (err.message.includes('validation')) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        errors: err.message.split(', '),
        message: ERROR_MESSAGES.BAD_REQUEST
      });
    }
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }
    
    if (err.message === ERROR_MESSAGES.RELATIONSHIP_EXISTS) {
      return res.status(CODES.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.RELATIONSHIP_EXISTS
      });
    }
    
    return next(err);
  }
};

// Update family member relationship
exports.updateFamilyMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedby: req.user.id // Get from authenticated user
    };
    
    const result = await familyTreeService.updateFamilyMember(id, updateData, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message.includes('validation')) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        errors: err.message.split(', '),
        message: ERROR_MESSAGES.BAD_REQUEST
      });
    }
    
    if (err.message === ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND
      });
    }
    
    return next(err);
  }
};

// Remove family member relationship
exports.removeFamilyMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const result = await familyTreeService.removeFamilyMember(id, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    if (err.message === ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND
      });
    }
    
    return next(err);
  }
};

// Search family members
exports.searchFamilyMembers = async (req, res, next) => {
  try {
    const searchParams = req.query;
    const result = await familyTreeService.searchFamilyMembers(searchParams);
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    console.error('Error in searchFamilyMembers controller:', err);
    return next(err);
  }
};

// Get family directory (primary contacts)
exports.getFamilyDirectory = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const result = await familyTreeService.getFamilyDirectory(queryParams);
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    console.error('Error in getFamilyDirectory controller:', err);
    return next(err);
  }
};

// Assign family head (key person)
exports.assignFamilyHead = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id } = req.body;
    const result = await familyTreeService.assignFamilyHead(user_id, transaction);
    await transaction.commit();
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    await transaction.rollback();
    
    // Handle required field errors
    if (err.message === ERROR_MESSAGES.USER_ID_REQUIRED) {
      return res.status(CODES.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.USER_ID_REQUIRED
      });
    }
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }
    
    return next(err);
  }
};

// Get family member details by relationship ID
exports.getFamilyMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { FamilyTree } = require('../models/FamilyTree');
    const { User } = require('../models/User');
    
    // Import models to ensure associations are initialized
    require('../models');
    
    const relationship = await FamilyTree.findOne({
      where: { id: id, isdeleted: false },
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family']
        },
        {
          model: User,
          as: 'child',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family']
        }
      ]
    });

    if (!relationship) {
      return res.status(CODES.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND
      });
    }

    return res.status(CODES.SUCCESS).json({
      success: true,
      data: relationship,
      message: SUCCESS_MESSAGES.FAMILY_MEMBER_FETCHED
    });
  } catch (err) {
    console.error('Error in getFamilyMember controller:', err);
    return next(err);
  }
};

// Get relationships for a specific user
exports.getUserRelationships = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    
    const { FamilyTree } = require('../models/FamilyTree');
    const { User } = require('../models/User');
    
    // Import models to ensure associations are initialized
    require('../models');
    
    const relationships = await FamilyTree.findAll({
      where: {
        [require('../config/db').Sequelize.Op.or]: [
          { parent_id: user_id },
          { child_id: user_id }
        ],
        isdeleted: false
      },
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family']
        },
        {
          model: User,
          as: 'child',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family']
        }
      ],
      order: [['createdat', 'ASC']]
    });

    return res.status(CODES.SUCCESS).json({
      success: true,
      data: {
        relationships: relationships,
        totalCount: relationships.length
      },
      message: SUCCESS_MESSAGES.USER_RELATIONSHIPS_FETCHED
    });
  } catch (err) {
    console.error('Error in getUserRelationships controller:', err);
    return next(err);
  }
};

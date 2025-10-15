const {
  getFamilyTreeData,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  assignFamilyHead
} = require('../services/familyTree.service');
const CODES = require('../utils/codes');
const SUCCESS_MESSAGES = require('../utils/messages.success');
const ERROR_MESSAGES = require('../utils/messages.error');
const sequelize = require('../config/db');

// Unified family tree GET endpoint
exports.getFamilyTreeData = async (req, res, next) => {
  try {
    const { type, user_id, name, relationship_type, birthdate_from, birthdate_to, is_primary_contact, page, limit, sort_by, sort_order } = req.query;
    
    // Use the unified service function that handles all query types
    const result = await getFamilyTreeData({
      type,
      user_id,
      name,
      relationship_type,
      birthdate_from,
      birthdate_to,
      is_primary_contact,
      page,
      limit,
      sort_by,
      sort_order
    });
    
    return res.status(CODES.SUCCESS).json(result);
  } catch (err) {
    console.error('Error in getFamilyTreeData controller:', err);
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
    
    const result = await addFamilyMember(relationshipData, transaction);
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
    
    const result = await updateFamilyMember(id, updateData, transaction);
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
    const result = await removeFamilyMember(id, transaction);
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


// Assign family head (key person)
exports.assignFamilyHead = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id } = req.body;
    const result = await assignFamilyHead(user_id, transaction);
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


const { FamilyTree, familyTreeSchema } = require('../models/FamilyTree');
const { User } = require('../models/User');
const sequelize = require('../config/db');

// Import models to ensure associations are initialized
require('../models');
const ERROR_MESSAGES = require('../utils/messages.error');
const SUCCESS_MESSAGES = require('../utils/messages.success');

// Get complete family tree structure
module.exports.getFamilyTree = async (userId = null) => {
  try {
    let whereClause = { isdeleted: false };
    
    // If userId provided, get tree starting from that user
    if (userId) {
      whereClause = {
        ...whereClause,
        [sequelize.Sequelize.Op.or]: [
          { parent_id: userId },
          { child_id: userId }
        ]
      };
    }

    const relationships = await FamilyTree.findAll({
      where: whereClause,
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

    // Build hierarchical tree structure
    const treeStructure = buildTreeStructure(relationships, userId);

    return {
      success: true,
      data: {
        tree: treeStructure,
        totalRelationships: relationships.length
      },
      message: SUCCESS_MESSAGES.FAMILY_TREE_FETCHED
    };
  } catch (err) {
    console.error('Error in getFamilyTree:', err);
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Add family member relationship
module.exports.addFamilyMember = async (relationshipData, transaction) => {
  try {
    // Validate required fields first
    if (!relationshipData.child_id) {
      throw new Error(ERROR_MESSAGES.CHILD_ID_REQUIRED);
    }
    
    if (!relationshipData.relationship_type) {
      throw new Error(ERROR_MESSAGES.RELATIONSHIP_TYPE_REQUIRED);
    }

    // Validate relationship data with Joi
    const validatedData = familyTreeSchema.validate(relationshipData, { abortEarly: false });
    
    if (validatedData.error) {
      throw new Error(validatedData.error.details.map(e => e.message).join(', '));
    }

    // Check if both users exist
    const parent = relationshipData.parent_id ? await User.findByPk(relationshipData.parent_id) : null;
    const child = await User.findByPk(relationshipData.child_id);
    
    if (relationshipData.parent_id && !parent) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    if (!child) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if relationship already exists
    const existingRelationship = await FamilyTree.findOne({
      where: {
        parent_id: relationshipData.parent_id,
        child_id: relationshipData.child_id,
        relationship_type: relationshipData.relationship_type
      }
    });

    if (existingRelationship) {
      throw new Error(ERROR_MESSAGES.RELATIONSHIP_EXISTS);
    }

    // Create relationship
    const relationship = await FamilyTree.create(validatedData.value, { transaction });

    // If this is marked as primary contact, unmark others
    if (relationshipData.is_primary_contact) {
      await FamilyTree.update(
        { is_primary_contact: false },
        {
          where: {
            child_id: relationshipData.child_id,
            id: { [sequelize.Sequelize.Op.ne]: relationship.id }
          },
          transaction
        }
      );
    }

    return {
      success: true,
      data: relationship,
      message: SUCCESS_MESSAGES.FAMILY_MEMBER_ADDED
    };
  } catch (err) {
    console.error('Error in addFamilyMember:', err);
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND || 
        err.message === ERROR_MESSAGES.RELATIONSHIP_EXISTS) {
      throw err;
    }
    
    if (err.name === 'SequelizeValidationError') {
      throw new Error(err.errors.map(e => e.message).join(', '));
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Update family member relationship
module.exports.updateFamilyMember = async (relationshipId, updateData, transaction) => {
  try {
    // Validate relationship ID
    if (!relationshipId) {
      throw new Error(ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND);
    }

    const relationship = await FamilyTree.findByPk(relationshipId);
    
    if (!relationship) {
      throw new Error(ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND);
    }

    // Validate update data
    const validatedData = familyTreeSchema.validate(updateData, { abortEarly: false });
    
    if (validatedData.error) {
      throw new Error(validatedData.error.details.map(e => e.message).join(', '));
    }

    // Update relationship
    Object.assign(relationship, validatedData.value);
    await relationship.save({ transaction });

    // If this is marked as primary contact, unmark others
    if (updateData.is_primary_contact) {
      await FamilyTree.update(
        { is_primary_contact: false },
        {
          where: {
            child_id: relationship.child_id,
            id: { [sequelize.Sequelize.Op.ne]: relationshipId }
          },
          transaction
        }
      );
    }

    return {
      success: true,
      data: relationship,
      message: SUCCESS_MESSAGES.FAMILY_MEMBER_UPDATED
    };
  } catch (err) {
    console.error('Error in updateFamilyMember:', err);
    
    if (err.message === ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND) {
      throw err;
    }
    
    if (err.name === 'SequelizeValidationError') {
      throw new Error(err.errors.map(e => e.message).join(', '));
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Remove family member relationship
module.exports.removeFamilyMember = async (relationshipId, transaction) => {
  try {
    const relationship = await FamilyTree.findByPk(relationshipId);
    
    if (!relationship) {
      throw new Error(ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND);
    }

    // Soft delete relationship
    relationship.isdeleted = true;
    relationship.deletedat = new Date();
    await relationship.save({ transaction });

    return {
      success: true,
      data: relationship,
      message: SUCCESS_MESSAGES.FAMILY_MEMBER_REMOVED
    };
  } catch (err) {
    console.error('Error in removeFamilyMember:', err);
    
    if (err.message === ERROR_MESSAGES.RELATIONSHIP_NOT_FOUND) {
      throw err;
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Search family members
module.exports.searchFamilyMembers = async (searchParams) => {
  try {
    const {
      name,
      relationship_type,
      birthdate_from,
      birthdate_to,
      is_primary_contact,
      page = 1,
      limit = 20
    } = searchParams;

    // Build where clause
    const whereClause = { isdeleted: false };
    const userWhereClause = { isdeleted: false };

    // Name search
    if (name) {
      userWhereClause.fullname = {
        [sequelize.Sequelize.Op.iLike]: `%${name}%`
      };
    }

    // Relationship type filter
    if (relationship_type) {
      whereClause.relationship_type = relationship_type;
    }

    // Birthdate range filter
    if (birthdate_from || birthdate_to) {
      userWhereClause.birthdate = {};
      if (birthdate_from) userWhereClause.birthdate[sequelize.Sequelize.Op.gte] = birthdate_from;
      if (birthdate_to) userWhereClause.birthdate[sequelize.Sequelize.Op.lte] = birthdate_to;
    }

    // Primary contact filter
    if (is_primary_contact !== undefined) {
      whereClause.is_primary_contact = is_primary_contact;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await FamilyTree.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family'],
          where: userWhereClause,
          required: false
        },
        {
          model: User,
          as: 'child',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family'],
          where: userWhereClause,
          required: true
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['is_primary_contact', 'DESC'], ['createdat', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        relationships: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: SUCCESS_MESSAGES.FAMILY_MEMBERS_FOUND
    };
  } catch (err) {
    console.error('Error in searchFamilyMembers:', err);
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Get family directory (primary contacts)
module.exports.getFamilyDirectory = async (queryParams) => {
  try {
    const {
      sort_by = 'fullname',
      sort_order = 'ASC',
      page = 1,
      limit = 20
    } = queryParams;

    const offset = (page - 1) * limit;

    const { count, rows } = await FamilyTree.findAndCountAll({
      where: {
        isdeleted: false,
        is_primary_contact: true
      },
      include: [
        {
          model: User,
          as: 'child',
          attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'key_person_in_family', 'current_city', 'current_state', 'current_country'],
          order: [[sort_by, sort_order]]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[{ model: User, as: 'child' }, sort_by, sort_order]]
    });

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        primaryContacts: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: SUCCESS_MESSAGES.FAMILY_DIRECTORY_FETCHED
    };
  } catch (err) {
    console.error('Error in getFamilyDirectory:', err);
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Assign family head (key person)
module.exports.assignFamilyHead = async (userId, transaction) => {
  try {
    // Validate required field
    if (!userId) {
      throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update user as key person
    user.key_person_in_family = true;
    await user.save({ transaction });

    // Mark as primary contact in family tree
    await FamilyTree.update(
      { is_primary_contact: true },
      {
        where: {
          child_id: userId,
          isdeleted: false
        },
        transaction
      }
    );

    // Unmark other primary contacts
    await FamilyTree.update(
      { is_primary_contact: false },
      {
        where: {
          child_id: { [sequelize.Sequelize.Op.ne]: userId },
          isdeleted: false
        },
        transaction
      }
    );

    return {
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.FAMILY_HEAD_ASSIGNED
    };
  } catch (err) {
    console.error('Error in assignFamilyHead:', err);
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      throw err;
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Helper function to build tree structure
function buildTreeStructure(relationships, rootUserId = null) {
  const tree = {};
  const processed = new Set();

  // Find root nodes (users with no parents or specified root)
  const rootNodes = relationships.filter(rel => 
    !rel.parent_id || (rootUserId && (rel.parent_id === rootUserId || rel.child_id === rootUserId))
  );

  function buildNode(userId, level = 0) {
    if (processed.has(userId) || level > 10) return null; // Prevent infinite loops
    
    processed.add(userId);
    
    const userRelationships = relationships.filter(rel => 
      rel.child_id === userId || rel.parent_id === userId
    );

    if (userRelationships.length === 0) return null;

    const node = {
      id: userId,
      level: level,
      relationships: []
    };

    userRelationships.forEach(rel => {
      const relatedUserId = rel.child_id === userId ? rel.parent_id : rel.child_id;
      const relationshipType = rel.child_id === userId ? 
        getInverseRelationship(rel.relationship_type) : 
        rel.relationship_type;

      if (relatedUserId) {
        const childNode = buildNode(relatedUserId, level + 1);
        if (childNode) {
          node.relationships.push({
            ...rel.toJSON(),
            relationship_type: relationshipType,
            relatedUser: childNode
          });
        }
      }
    });

    return node;
  }

  return rootNodes.map(rel => buildNode(rel.child_id)).filter(Boolean);
}

// Helper function to get inverse relationship
function getInverseRelationship(relationshipType) {
  const inverseMap = {
    'father': 'son',
    'mother': 'daughter',
    'son': 'father',
    'daughter': 'mother',
    'brother': 'brother',
    'sister': 'sister',
    'grandfather': 'grandson',
    'grandmother': 'granddaughter',
    'grandson': 'grandfather',
    'granddaughter': 'grandmother',
    'uncle': 'nephew',
    'aunt': 'niece',
    'nephew': 'uncle',
    'niece': 'aunt',
    'cousin': 'cousin',
    'spouse': 'spouse',
    'father_in_law': 'son_in_law',
    'mother_in_law': 'daughter_in_law',
    'son_in_law': 'father_in_law',
    'daughter_in_law': 'mother_in_law',
    'brother_in_law': 'brother_in_law',
    'sister_in_law': 'sister_in_law',
    'stepfather': 'stepson',
    'stepmother': 'stepdaughter',
    'stepson': 'stepfather',
    'stepdaughter': 'stepmother',
    'half_brother': 'half_brother',
    'half_sister': 'half_sister'
  };

  return inverseMap[relationshipType] || relationshipType;
}

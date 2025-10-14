const { User } = require('../models/User');
const sequelize = require('../config/db');

// Import models to ensure associations are initialized
require('../models');
const ERROR_MESSAGES = require('../utils/messages.error');
const SUCCESS_MESSAGES = require('../utils/messages.success');

// Assign role to user (Admin only)
module.exports.assignUserRole = async (userId, role, transaction) => {
  try {
    // Validate required fields
    if (!userId) {
      throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    
    if (!role) {
      throw new Error(ERROR_MESSAGES.INVALID_ROLE);
    }
    
    // Validate role
    if (!['admin', 'member'].includes(role)) {
      throw new Error(ERROR_MESSAGES.INVALID_ROLE);
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update user role
    user.role = role;
    await user.save({ transaction });

    return {
      success: true,
      data: {
        id: user.id,
        fullname: user.fullname,
        role: user.role
      },
      message: SUCCESS_MESSAGES.USER_ROLE_ASSIGNED
    };
  } catch (err) {
    console.error('Error in assignUserRole:', err);
    
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND || 
        err.message === ERROR_MESSAGES.INVALID_ROLE) {
      throw err;
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Get users by role
module.exports.getUsersByRole = async (role, queryParams) => {
  try {
    // Validate role
    if (!['admin', 'member'].includes(role)) {
      throw new Error(ERROR_MESSAGES.INVALID_ROLE);
    }

    const {
      page = 1,
      limit = 20,
      sort_by = 'fullname',
      sort_order = 'ASC'
    } = queryParams;

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: {
        role: role,
        isdeleted: false
      },
      attributes: ['id', 'fullname', 'mobilenumber', 'profileimageurl', 'role', 'key_person_in_family', 'createdat'],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order]]
    });

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        users: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: parseInt(limit)
        }
      },
      message: SUCCESS_MESSAGES.USERS_BY_ROLE_FETCHED
    };
  } catch (err) {
    console.error('Error in getUsersByRole:', err);
    
    if (err.message === ERROR_MESSAGES.INVALID_ROLE) {
      throw err;
    }
    
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

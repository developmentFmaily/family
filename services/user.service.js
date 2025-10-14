const { User } = require('../models/User');
const sequelize = require('../config/db');

// Import models to ensure associations are initialized
require('../models');
const { generateToken } = require('../middleware/auth');
const { userSchema } = require('../models/User');
const CODES = require('../utils/codes');
const ERROR_MESSAGES = require('../utils/messages.error');
const SUCCESS_MESSAGES = require('../utils/messages.success');

// Get all users with search, filter, and pagination
module.exports.getAllUsers = async (queryParams) => {
  try {
    const {
      name,
      village,
      current_city,
      country,
      blood_group,
      key_person,
      living_outside_india,
      sort_by = 'key_person_in_family',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = queryParams;

  // Build where clause for search filters
  const whereClause = { isdeleted: false };
  const whereConditions = [];

  // Name search (case insensitive)
  if (name) {
    whereConditions.push({
      fullname: {
        [sequelize.Sequelize.Op.iLike]: `%${name}%`
      }
    });
  }

  // Village search (native address)
  if (village) {
    whereConditions.push({
      native_village: {
        [sequelize.Sequelize.Op.iLike]: `%${village}%`
      }
    });
  }

  // Current city search
  if (current_city) {
    whereConditions.push({
      current_city: {
        [sequelize.Sequelize.Op.iLike]: `%${current_city}%`
      }
    });
  }

  // Country search (current or native)
  if (country) {
    whereConditions.push({
      [sequelize.Sequelize.Op.or]: [
        {
          current_country: {
            [sequelize.Sequelize.Op.iLike]: `%${country}%`
          }
        },
        {
          native_country: {
            [sequelize.Sequelize.Op.iLike]: `%${country}%`
          }
        }
      ]
    });
  }

  // Blood group filter
  if (blood_group) {
    whereConditions.push({
      blood_group: blood_group
    });
  }

  // Key person filter
  if (key_person !== undefined) {
    whereConditions.push({
      key_person_in_family: key_person === 'true'
    });
  }

  // Living outside India filter
  if (living_outside_india !== undefined) {
    whereConditions.push({
      living_outside_india: living_outside_india === 'true'
    });
  }

  // Combine all conditions
  if (whereConditions.length > 0) {
    whereClause[sequelize.Sequelize.Op.and] = whereConditions;
  }

  // Calculate pagination
  const offset = (page - 1) * limit;

  // Get total count for pagination
  const totalCount = await User.count({ where: whereClause });

  // Build order clause based on sort parameters
  const orderClause = [];
  
  // Validate sort_by field
  const allowedSortFields = [
    'fullname', 'mobilenumber', 'birthdate', 'gender', 'age',
    'native_village', 'native_taluka', 'native_district', 'native_state', 'native_country',
    'current_city', 'current_state', 'current_country', 'current_pincode',
    'blood_group', 'living_outside_india', 'key_person_in_family',
    'createdat', 'updatedat'
  ];
  
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'key_person_in_family';
  const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
  
  // Add primary sort
  orderClause.push([sortField, sortDirection]);
  
  // Add secondary sort for consistency (always sort by name as secondary)
  if (sortField !== 'fullname') {
    orderClause.push(['fullname', 'ASC']);
  }

  // Get filtered users with pagination
  const users = await User.findAll({
    where: whereClause,
    attributes: [
      'id', 'fullname', 'mobilenumber', 'profileimageurl', 'birthdate', 'gender', 'age',
      'native_village', 'native_taluka', 'native_district', 'native_state', 'native_country',
      'current_city', 'current_state', 'current_country', 'current_pincode',
      'blood_group', 'living_outside_india', 'key_person_in_family',
      'createdat', 'updatedat'
    ],
    order: orderClause,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

    return {
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        limit: parseInt(limit)
      },
      message: SUCCESS_MESSAGES.USER_FETCHED
    };
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Create user with transaction parameter
module.exports.createUser = async (userData, transaction) => {
  try {
    // Validate user data first
    const validatedData = userSchema.validate(userData, { abortEarly: false });
    if (validatedData.error) {
      throw new Error(validatedData.error.details.map(e => e.message).join(', '));
    }

    // Check if user already exists
    const existing = await User.findOne({ 
      where: { mobilenumber: validatedData.value.mobilenumber }
    });
    
    if (existing) {
      throw new Error(ERROR_MESSAGES.USER_EXISTS);
    }

    const user = await User.create(validatedData.value, { transaction });
    
    return {
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.USER_CREATED
    };
  } catch (err) {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      throw new Error(err.errors.map(e => e.message).join(', '));
    }
    
    // Handle unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error(ERROR_MESSAGES.USER_EXISTS);
    }
    
    throw err;
  }
};

// Update user with transaction parameter
module.exports.updateUser = async (userId, updateData, transaction) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update user data
    Object.assign(user, updateData);
    await user.save({ transaction });
    
    return {
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.USER_UPDATED
    };
  } catch (err) {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      throw new Error(err.errors.map(e => e.message).join(', '));
    }
    
    throw err;
  }
};

// Login user (check device token or generate OTP) with transaction parameter
module.exports.loginUser = async (mobileNumber, deviceToken, transaction) => {
  try {
    // Validate mobile number
    if (!mobileNumber) {
      throw new Error(ERROR_MESSAGES.MOBILE_REQUIRED);
    }

    const user = await User.findOne({ 
      where: { mobilenumber: mobileNumber },
       
    });
    
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    

    // Check if device token matches
    if (deviceToken && user.device_token === deviceToken) {
      // Device token matches - direct login without OTP
      const token = generateToken(user);
      
      // Prepare user response
      const userResponse = {
        id: user.id,
        fullname: user.fullname,
        mobilenumber: user.mobilenumber,
        profileimageurl: user.profileimageurl,
        birthdate: user.birthdate,
        gender: user.gender,
        age: user.age,
        native_village: user.native_village,
        native_taluka: user.native_taluka,
        native_district: user.native_district,
        native_state: user.native_state,
        native_country: user.native_country,
        current_city: user.current_city,
        current_state: user.current_state,
        current_country: user.current_country,
        current_pincode: user.current_pincode,
        current_area: user.current_area,
        current_buildingnumber: user.current_buildingnumber,
        current_mapaddress: user.current_mapaddress,
        current_latitude: user.current_latitude,
        current_longitude: user.current_longitude,
        blood_group: user.blood_group,
        living_outside_india: user.living_outside_india,
        key_person_in_family: user.key_person_in_family,
        createdat: user.createdat,
        updatedat: user.updatedat
      };
      
      return {
        success: true,
        data: {
          user: userResponse,
          token: token,
          isDirectLogin: true,
          isNeedOtp: false
        },
        message: SUCCESS_MESSAGES.USER_LOGIN_SUCCESS
      };
    } else {
      // Device token doesn't match or not provided - generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Update user with OTP and expiry
      user.otp = otp;
      user.otpexpiry = otpExpiry;
      await user.save({ transaction });
      
      // In production, send OTP via SMS/Email
      console.log(`OTP for ${mobileNumber}: ${otp}`);
      
      return {
        success: true,
        data: {
          isDirectLogin: false,
          isNeedOtp: true
        },
        message: SUCCESS_MESSAGES.OTP_SENT
      };
    }
  } catch (err) {
    console.error('Error in loginUser:', err);
    
    // Handle specific error types
    if (err.message === ERROR_MESSAGES.MOBILE_REQUIRED || 
        err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      throw err;
    }
    
    // Handle database errors
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Verify OTP and generate token with transaction parameter
module.exports.verifyOtp = async (mobileNumber, otp, deviceToken, transaction) => {
  try {
    // Validate input parameters
    if (!mobileNumber || !otp) {
      throw new Error(ERROR_MESSAGES.MOBILE_OTP_REQUIRED);
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      throw new Error(ERROR_MESSAGES.INVALID_OTP_FORMAT);
    }

    const user = await User.findOne({ 
      where: { mobilenumber: mobileNumber }
    });
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if OTP matches
    if (user.otp !== parseInt(otp, 10)) {
      throw new Error(ERROR_MESSAGES.INVALID_OTP);
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otpexpiry)) {
      throw new Error(ERROR_MESSAGES.OTP_EXPIRED);
    }

    // Update device token and clear OTP
    user.device_token = deviceToken;
    user.otp = null;
    user.otpexpiry = null;
    await user.save({ transaction });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Prepare user response
    const userResponse = {
      id: user.id,
      fullname: user.fullname,
      mobilenumber: user.mobilenumber,
      profileimageurl: user.profileimageurl,
      birthdate: user.birthdate,
      gender: user.gender,
      age: user.age,
      native_village: user.native_village,
      native_taluka: user.native_taluka,
      native_district: user.native_district,
      native_state: user.native_state,
      native_country: user.native_country,
      current_city: user.current_city,
      current_state: user.current_state,
      current_country: user.current_country,
      current_pincode: user.current_pincode,
      current_area: user.current_area,
      current_buildingnumber: user.current_buildingnumber,
      current_mapaddress: user.current_mapaddress,
      current_latitude: user.current_latitude,
      current_longitude: user.current_longitude,
      blood_group: user.blood_group,
      living_outside_india: user.living_outside_india,
      key_person_in_family: user.key_person_in_family,
      createdat: user.createdat,
      updatedat: user.updatedat
    };
    
    return {
      success: true,
      data: {
        user: userResponse,
        token: token
      },
      message: SUCCESS_MESSAGES.USER_LOGIN_SUCCESS
    };
  } catch (err) {
    console.error('Error in verifyOtp:', err);
    
    // Handle specific error types
    if (err.message === ERROR_MESSAGES.MOBILE_OTP_REQUIRED ||
        err.message === ERROR_MESSAGES.INVALID_OTP_FORMAT ||
        err.message === ERROR_MESSAGES.USER_NOT_FOUND ||
        err.message === ERROR_MESSAGES.INVALID_OTP ||
        err.message === ERROR_MESSAGES.OTP_EXPIRED) {
      throw err;
    }
    
    // Handle database errors
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};


// Get user by ID with error handling
module.exports.getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    return {
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.USER_FETCHED
    };
  } catch (err) {
    console.error('Error in getUserById:', err);
    
    // Handle specific error types
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      throw err;
    }
    
    // Handle database errors
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

// Delete user (soft delete) with transaction parameter
module.exports.deleteUser = async (userId, transaction) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    user.isdeleted = true;
    await user.save({ transaction });
    
    return {
      success: true,
      data: user,
      message: SUCCESS_MESSAGES.USER_DELETED
    };
  } catch (err) {
    console.error('Error in deleteUser:', err);
    
    // Handle specific error types
    if (err.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      throw err;
    }
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      throw new Error(err.errors.map(e => e.message).join(', '));
    }
    
    // Handle database errors
    if (err.name === 'SequelizeDatabaseError') {
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }
    
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

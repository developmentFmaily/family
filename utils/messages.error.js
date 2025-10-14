const ERROR_MESSAGES = {
  SERVER_ERROR: 'Something went wrong!',
  USER_NOT_FOUND: 'User not found',
  BAD_REQUEST: 'Invalid request parameters',
  USER_EXISTS: 'User already exists',
  INVALID_OTP: 'Invalid or expired OTP',
  INVALID_OTP_FORMAT: 'OTP must be 6 digits',
  OTP_EXPIRED: 'OTP has expired',
  MOBILE_REQUIRED: 'Mobile number is required',
  MOBILE_OTP_REQUIRED: 'Mobile number and OTP are required',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_REQUIRED: 'Token is required',
  
  // Family Tree Error Messages
  RELATIONSHIP_EXISTS: 'Relationship already exists',
  RELATIONSHIP_NOT_FOUND: 'Family relationship not found',
  
  // Role-based Error Messages
  ADMIN_ACCESS_REQUIRED: 'Admin access required for this operation',
  INVALID_ROLE: 'Invalid user role',
  ACCESS_DENIED: 'Access denied - insufficient permissions',
  
  // Required Field Error Messages
  CHILD_ID_REQUIRED: 'Child ID is required',
  RELATIONSHIP_TYPE_REQUIRED: 'Relationship type is required',
  USER_ID_REQUIRED: 'User ID is required',
  
  // Add more error messages as needed
};

module.exports = ERROR_MESSAGES;

const db = require('../config/db');

exports.createOrUpdateOtp = async (mobile, otp) => {
  // Upsert OTP for mobile number
  await db.query(
    'INSERT INTO otps (mobile, otp, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (mobile) DO UPDATE SET otp = $2, created_at = NOW()',
    [mobile, otp]
  );
};

exports.verifyOtp = async (mobile, otp) => {
  const result = await db.query(
    'SELECT * FROM otps WHERE mobile = $1 AND otp = $2 AND created_at > NOW() - INTERVAL \'5 minutes\'',
    [mobile, otp]
  );
  return result.rows.length > 0;
};

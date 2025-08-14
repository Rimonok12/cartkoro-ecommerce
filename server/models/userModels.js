// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: { type: String },
  email: { type: String },
  phone_number: { type: String, required: true, unique: true},
  is_admin: { type: Boolean, default: false },
  profile_pic:{ type: String},
  referral_code: { type: String, unique: true },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const addressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: String,
  address_line1: String,
  address_line2: String,
  upazila_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Upazila' },
  pincode: String,
  phone: String,
  is_default_shipping: { type: Boolean, default: false },
  is_default_billing: { type: Boolean, default: false }
});

const customerOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: true });


module.exports = {
  User: mongoose.model('User', userSchema),
  UserAddress: mongoose.model('UserAddress', addressSchema),
  CustomerOtp: mongoose.model('CustomerOtp', customerOtpSchema)
};

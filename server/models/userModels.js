// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String },
    email: { type: String },
    phone_number: { type: String, required: true, unique: true },
    is_admin: { type: Boolean, default: false },
    profile_pic: { type: String },
    referral_code: { type: String, unique: true, sparse: true },
    status: Number,
  },
  { timestamps: true }
);

const referenceSchema = new mongoose.Schema(
  {
    referred_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: Number,
  },
  { timestamps: true }
);

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  label: String,
  address_line1: String,
  address_line2: String,
  upazila_id: { type: mongoose.Schema.Types.ObjectId, ref: "Upazila" },
  pincode: String,
  phone: String,
  is_default_shipping: { type: Boolean, default: false },
  is_default_billing: { type: Boolean, default: false },
  status: Number,
});

const customerOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        sku_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductSku" },
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

const cashbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, default: 0 },
    last_updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const userSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refresh_token: { type: String, required: true }, // optionally hash this
    expires_at: { type: Date, required: true },
    device_info: { type: String },
    ip_address: { type: String },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model("User", userSchema),
  UserAddress: mongoose.model("UserAddress", addressSchema),
  CustomerOtp: mongoose.model("CustomerOtp", customerOtpSchema),
  Reference: mongoose.model("Reference", referenceSchema),
  Cart: mongoose.model("Cart", cartSchema),
  Cashback: mongoose.model("Cashback", cashbackSchema),
  UserSession: mongoose.model("UserSession", userSessionSchema),
};

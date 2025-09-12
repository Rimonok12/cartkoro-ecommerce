// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String },
    email: { type: String },
    phone_number: { type: String, required: true, unique: true },
    is_super_admin: { type: Boolean, default: false },
    is_admin: { type: Boolean, default: false },
    is_seller: { type: Boolean, default: false },
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

const addressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }, // House, Road, Area
    district_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    upazila_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upazila",
      required: true,
    },
    postcode: { type: String, required: true },
    landmark: { type: String },
    alternate_phone: { type: String },
    status: { type: String, default: 1 },
  },
  { timestamps: true }
);

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

module.exports = {
  User: mongoose.model("User", userSchema),
  UserAddress: mongoose.model("UserAddress", addressSchema),
  CustomerOtp: mongoose.model("CustomerOtp", customerOtpSchema),
  Reference: mongoose.model("Reference", referenceSchema),
  Cart: mongoose.model("Cart", cartSchema),
  Cashback: mongoose.model("Cashback", cashbackSchema),
};

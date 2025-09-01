// models/order.js
const mongoose = require('mongoose');

/* ======================= Order Status (optional dictionary) ======================= */
const orderStatusSchema = new mongoose.Schema(
  {
    status_code: { type: String, required: true, unique: true }, // e.g. CREATED, PAID, SHIPPED, DELIVERED, CANCELED
    status_desc: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

/* ======================= Order ======================= */
const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    total_amount: { type: Number, required: true, min: 0 },
    shipping_address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAddress', required: true },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ user_id: 1, createdAt: -1 });

/* ======================= Order Item ======================= */
const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSku', required: true },
    quantity: { type: Number, required: true, min: 1 },
    mrp_each: { type: Number, required: true, min: 0 },
    sp_each: { type: Number, required: true, min: 0 },
    cashback_amount: { type: Number, required: true, min: 0 },
    delivery_amount: { type: Number, required: true, min: 0 },

    // Keep but optional; can be populated later if you want
    item_status_history: [
      {
        // IMPORTANT: ref must be a **model** name
        status_code: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderStatus', index: true },
        note: { type: String },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true, versionKey: false }
);

module.exports = {
  OrderStatus: mongoose.model('OrderStatus', orderStatusSchema),
  Order: mongoose.model('Order', orderSchema),
  OrderItem: mongoose.model('OrderItem', orderItemSchema)
};

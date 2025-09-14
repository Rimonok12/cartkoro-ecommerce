// models/ordermodels.js
const mongoose = require('mongoose');

/* ======================= Order Status ======================= */
const orderStatusSchema = new mongoose.Schema(
  {
    status: { type: String, required: true, unique: true },
    status_desc: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

/* ======================= Order (order-level charges) ======================= */
const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shipping_address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAddress', required: true },

    // 💡 Order-level monetarys
    item_subtotal: { type: Number, required: true, min: 0, default: 0 },  // sum of sp_each*qty
    delivery_fee:  { type: Number, required: true, min: 0, default: 0 },  // single fee for the whole order
    order_cashback:{ type: Number, required: true, min: 0, default: 0 },  // single cashback for the whole order
    total_amount:  { type: Number, required: true, min: 0 },              // grand total = item_subtotal + delivery_fee - order_cashback
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ user_id: 1, createdAt: -1 });

/* ======================= Order Item (item-level fields deprecated) ======================= */
const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSku', required: true },
    quantity: { type: Number, required: true, min: 1 },
    mrp_each: { type: Number, required: true, min: 0 },
    sp_each: { type: Number, required: true, min: 0 },

    // ⚠️ deprecated: keep for backward compatibility; always 0 going forward
    cashback_amount: { type: Number, min: 0, default: 0 },
    delivery_amount: { type: Number, min: 0, default: 0 },

    item_status_history: [
      {
        status_code: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderStatus', index: true },
        note: { type: String, default: "" },
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

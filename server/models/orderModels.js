// models/order.js
const mongoose = require('mongoose');

const orderStatusSchema = new mongoose.Schema({
  status_code: { type: String, required: true, unique: true },
  status_desc: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status_code: { type: String, ref: 'OrderStatus' },
  total_amount: Number,
  shipping_address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAddress' }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSku' },
  quantity: { type: Number, required: true },
  price_each: { type: Number, required: true }
});

module.exports = {
  OrderStatus: mongoose.model('OrderStatus', orderStatusSchema),
  Order: mongoose.model('Order', orderSchema),
  OrderItem: mongoose.model('OrderItem', orderItemSchema)
};

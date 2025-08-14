const { Order } = require('../models/orderModels');


const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user_id: req.user.userId }).populate('shipping_address_id');
  res.json(orders);
};

const createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, user_id: req.user.userId });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports={getUserOrders, createOrder}

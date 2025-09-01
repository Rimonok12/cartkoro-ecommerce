// controllers/orderController.js
const mongoose = require('mongoose');
const { Order, OrderItem } = require('../models/orderModels');
const { ProductSku } = require('../models/productModels');

//
// POST /orders
// Body trusted from FE (basic checks done on FE).
// {
//   shipping_address_id,
//   total_amount,
//   items: [{ sku_id, quantity, mrp_each, sp_each, cashback_amount, delivery_amount }]
// }
//
const createOrder = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { shipping_address_id, total_amount, items = [] } = req.body || {};
  if (!shipping_address_id) return res.status(400).json({ error: 'shipping_address_id required' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // create order exactly with FE total
    const [order] = await Order.create(
      [{ user_id: userId, shipping_address_id, total_amount: Number(total_amount) || 0 }],
      { session }
    );

    // create items as-is (trust FE numbers)
    const docs = items.map((it) => ({
      order_id: order._id,
      sku_id: it.sku_id,
      quantity: Number(it.quantity) || 1,
      mrp_each: Number(it.mrp_each) || 0,
      sp_each: Number(it.sp_each) || 0,
      cashback_amount: Number(it.cashback_amount) || 0,
      delivery_amount: Number(it.delivery_amount) || 0,
      // keep history optional; FE can add later via separate endpoint if needed
      item_status_history: []
    }));
    await OrderItem.insertMany(docs, { session });

    // minimal but important: atomic stock increment (prevents oversell races)
    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const upd = await ProductSku.updateOne(
        {
          _id: it.sku_id,
          $expr: { $gte: [{ $subtract: ['$initial_stock', '$sold_stock'] }, qty] }
        },
        { $inc: { sold_stock: qty } },
        { session }
      );
      if (upd.modifiedCount !== 1) {
        throw new Error(`Insufficient stock or race for SKU ${it.sku_id}`);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      ok: true,
      order: {
        _id: order._id,
        total_amount: order.total_amount,
        shipping_address_id: order.shipping_address_id,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error('createOrder error:', err);
    return res.status(400).json({ error: err.message || 'Server error' });
  }
};

//
// GET /getUserOrders
//
const getUserOrders = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const orders = await Order.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) return res.json({ ok: true, orders: [] });

    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    const itemsByOrder = new Map(orderIds.map((id) => [String(id), []]));
    for (const it of items) {
      itemsByOrder.get(String(it.order_id))?.push({
        _id: it._id,
        sku_id: it.sku_id,
        quantity: it.quantity,
        mrp_each: it.mrp_each,
        sp_each: it.sp_each,
        cashback_amount: it.cashback_amount,
        delivery_amount: it.delivery_amount,
        createdAt: it.createdAt
      });
    }

    const payload = orders.map((o) => ({
      _id: o._id,
      total_amount: o.total_amount,
      shipping_address_id: o.shipping_address_id,
      createdAt: o.createdAt,
      items: itemsByOrder.get(String(o._id)) || []
    }));

    return res.json({ ok: true, orders: payload });
  } catch (err) {
    console.error('getUserOrders error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders
};

// controllers/orderController.js
const mongoose = require('mongoose');
const { Order, OrderItem, OrderStatus } = require('../models/orderModels.js');
const { Cashback } = require("../models/userModels");

const { ProductSku } = require('../models/productModels');

const {
  setHash,
  getHash,
  delHash
} = require("../config/redisClient");

//
// POST /orders   (or /orders/createOrder depending on your router)
// Body trusted from FE.
// {
//   shipping_address_id,
//   total_amount,
//   items: [{ sku_id, quantity, mrp_each, sp_each, cashback_amount, delivery_amount }]
// }
//
// controller/order.js (or your current file)
const createOrder = async (req, res) => {
  const userId = req.user?.userId;
  const userKey = `user:${userId}`;
  const EXPIRY_SEC = 60 * 24 * 60 * 60;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { shipping_address_id, total_amount, items = [] } = req.body || {};
  if (!shipping_address_id) return res.status(400).json({ error: 'shipping_address_id required' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) CREATED status (do NOT create if missing)
    const createdStatus = await OrderStatus.findOne({ status: 'CREATED' })
      .session(session).lean();
    if (!createdStatus?._id) {
      throw new Error('OrderStatus "CREATED" not found');
    }

    // 2) Create order
    const [order] = await Order.create(
      [{ user_id: userId, shipping_address_id, total_amount: Number(total_amount) || 0 }],
      { session }
    );

    // 3) Items (+ CREATED in history)
    const docs = items.map((it) => ({
      order_id: order._id,
      sku_id: it.sku_id,
      quantity: Number(it.quantity) || 1,
      mrp_each: Number(it.mrp_each) || 0,
      sp_each: Number(it.sp_each) || 0,
      cashback_amount: Number(it.cashback_amount) || 0,
      delivery_amount: Number(it.delivery_amount) || 0,
      item_status_history: [{ status_code: createdStatus._id }],
    }));
    await OrderItem.insertMany(docs, { session });

    // 4) Atomic stock increment
    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const upd = await ProductSku.updateOne(
        { _id: it.sku_id, $expr: { $gte: [{ $subtract: ['$initial_stock', '$sold_stock'] }, qty] } },
        { $inc: { sold_stock: qty } },
        { session }
      );
      if (upd.modifiedCount !== 1) {
        throw new Error(`Insufficient stock or race for SKU ${it.sku_id}`);
      }
    }

    // 5) Cashback: debit the amount actually used (sum of item cashback_amount)
    const totalCashbackUsed = items.reduce(
      (sum, it) => sum + (Number(it.cashback_amount) || 0),
      0
    );

    if (totalCashbackUsed > 0) {
      // Read current cashback, then set to max(current - used, 0) within SAME transaction
      const cbDoc = await Cashback.findOne({ user_id: userId }).session(session).lean();
      const current = Number(cbDoc?.amount) || 0;
      const nextAmount = Math.max(0, current - totalCashbackUsed);
      await setHash(userKey, "cashback", { amount: nextAmount }, EXPIRY_SEC);

      if (!cbDoc) {
        await Cashback.create([{ user_id: userId, amount: nextAmount }], { session });
      } else {
        await Cashback.updateOne(
          { _id: cbDoc._id },
          { $set: { amount: nextAmount } },
          { session }
        );
      }
    }

    // Commit all DB changes atomically
    await session.commitTransaction();
    session.endSession();

    // 6) Redis: clear cart; if cashback used, also clear cashback field
    try {
      await delHash(userKey, 'cart');
      if (totalCashbackUsed > 0) {
        await delHash(userKey, 'cashback');
      }
    } catch (e) {
      // best-effort; do not fail the request on Redis cleanup
      console.warn('Redis cleanup warning:', e?.message || e);
    }

    return res.status(201).json({
      ok: true,
      order: {
        _id: order._id,
        total_amount: order.total_amount,
        shipping_address_id: order.shipping_address_id,
        createdAt: order.createdAt,
      },
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
        createdAt: it.createdAt,
        item_status_history: it.item_status_history || [] // contains status_code ObjectIds
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

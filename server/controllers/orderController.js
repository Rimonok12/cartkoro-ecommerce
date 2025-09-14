// controllers/orderController.js
const mongoose = require("mongoose");
const { Order, OrderItem, OrderStatus } = require("../models/orderModels.js");
const { Cashback, User, UserAddress } = require("../models/userModels");

const { Product, ProductSku } = require("../models/productModels");

const { setHash, getHash, delHash } = require("../config/redisClient");
const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);

const CASHBACK_LINE_THRESHOLD = 500; // a line must be >= this to be eligible

function n(val, fallback = 0) {
  const x = Number(val);
  return Number.isFinite(x) ? x : fallback;
}

const getOrderStatuses = async (req, res) => {
  try {
    const statuses = await OrderStatus.find({})
      .select("_id status status_desc")
      .sort({ status: 1 })
      .lean();
    return res.json({ ok: true, statuses });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
};

// const createOrder = async (req, res) => {
//   const userId = req.user?.userId;
//   if (!userId) return res.status(401).json({ error: "Unauthorized" });

//   const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);

//   const {
//     shipping_address_id,
//     items = [],
//     shipping_fee = 0,                 // 👈 FE sends this
//     order_cashback = 0,               // 👈 FE sends this (appliedCashback)
//     // subtotal_after_discounts,      // FE convenience value (not needed if we recompute)
//     total_amount                      // FE grand total; we will validate against server calc
//   } = req.body || {};

//   console.log("req.body::", req.body)

//   if (!shipping_address_id) return res.status(400).json({ error: "shipping_address_id required" });
//   if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "items required" });

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const createdStatus = await OrderStatus.findOne({ status: "CREATED" }).session(session).lean();
//     if (!createdStatus?._id) throw new Error('OrderStatus "CREATED" not found');

//     const skuIds = items.map((it) => it.sku_id);
//     const skus = await ProductSku.find({ _id: { $in: skuIds } })
//       .select("_id MRP SP initial_stock sold_stock product_id status")
//       .session(session)
//       .lean();

//     const skuMap = new Map(skus.map((s) => [String(s._id), s]));

//     // ✅ compute item_subtotal from server-trusted prices
//     let item_subtotal = 0;
//     const docs = items.map((it) => {
//       const s = skuMap.get(String(it.sku_id));
//       if (!s) throw new Error(`SKU not found: ${it.sku_id}`);
//       const mrp = Number(s.MRP) || 0;
//       let sp = Number(s.SP) || 0;
//       if (sp > mrp) sp = mrp;

//       const quantity = Number(it.quantity) || 1;
//       item_subtotal += sp * quantity;

//       return {
//         order_id: null, // filled after we create order
//         sku_id: it.sku_id,
//         quantity,
//         mrp_each: mrp,
//         sp_each: sp,

//         // 🔕 item-level fees are deprecated -> force 0
//         cashback_amount: 0,
//         delivery_amount: 0,

//         item_status_history: [{ status_code: createdStatus._id }],
//       };
//     });

//     const delivery_fee = Math.max(0, Number(shipping_fee) || 0);
//     const order_cashback_num = Math.max(0, Number(order_cashback) || 0);

//     // ✅ compute authoritative grand total server-side
//     const computed_total = Math.max(0, item_subtotal + delivery_fee - order_cashback_num);

//     // optional: guard client-provided total
//     if (total_amount != null && Math.abs(Number(total_amount) - computed_total) > 0.01) {
//       throw new Error("Total mismatch. Please refresh and try again.");
//     }

//     // 3) Create Order (with order-level fields)
//     const [order] = await Order.create(
//       [
//         {
//           user_id: userId,
//           shipping_address_id,
//           item_subtotal,
//           delivery_fee,
//           order_cashback: order_cashback_num,
//           total_amount: computed_total,
//         },
//       ],
//       { session }
//     );

//     // attach order_id now
//     const docsWithOrderId = docs.map((d) => ({ ...d, order_id: order._id }));
//     await OrderItem.insertMany(docsWithOrderId, { session });

//     // stock updates unchanged...
//     for (const it of items) {
//       const qty = Number(it.quantity) || 1;
//       const upd = await ProductSku.updateOne(
//         {
//           _id: it.sku_id,
//           $expr: { $gte: [{ $subtract: ["$initial_stock", "$sold_stock"] }, qty] },
//         },
//         { $inc: { sold_stock: qty } },
//         { session }
//       );
//       if (upd.modifiedCount !== 1) throw new Error(`Insufficient stock for SKU ${it.sku_id}`);
//     }

//     await ProductSku.updateMany(
//       { _id: { $in: skuIds }, $expr: { $gte: ["$sold_stock", "$initial_stock"] } },
//       { $set: { status: 0 } },
//       { session }
//     );

//     const productIds = await ProductSku.distinct("product_id", { _id: { $in: skuIds } }).session(session);
//     if (productIds.length) {
//       const perProductStock = await ProductSku.aggregate([
//         { $match: { product_id: { $in: productIds } } },
//         {
//           $project: {
//             product_id: 1,
//             remaining: { $subtract: ["$initial_stock", "$sold_stock"] },
//           },
//         },
//         { $group: { _id: "$product_id", anyInStock: { $max: { $cond: [{ $gt: ["$remaining", 0] }, 1, 0] } } } },
//       ]).session(session);

//       const productsAllOut = perProductStock.filter((p) => p.anyInStock === 0).map((p) => p._id);
//       if (productsAllOut.length) {
//         await Product.updateMany({ _id: { $in: productsAllOut } }, { $set: { status: 0 } }, { session });
//       }
//     }

//     await session.commitTransaction();
//     session.endSession();

//     try { await delHash(`user:${userId}`, "cart"); } catch {}

//     return res.status(201).json({
//       ok: true,
//       order: {
//         _id: order._id,
//         createdAt: order.createdAt,
//         shipping_address_id: order.shipping_address_id,

//         // expose order-level totals
//         item_subtotal: order.item_subtotal,
//         delivery_fee: order.delivery_fee,
//         order_cashback: order.order_cashback,
//         total_amount: order.total_amount,
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction().catch(() => {});
//     session.endSession();
//     console.error("createOrder error:", err);
//     return res.status(400).json({ error: err.message || "Server error" });
//   }
// };

// const getUserOrders = async (req, res) => {
//   const userId = req.user?.userId;
//   if (!userId) return res.status(401).json({ error: "Unauthorized" });

//   try {
//     const orders = await Order.find({ user_id: userId })
//       .sort({ createdAt: -1 })
//       .lean();

//     if (orders.length === 0) return res.json({ ok: true, orders: [] });

//     const orderIds = orders.map((o) => o._id);
//     const items = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

//     const itemsByOrder = new Map(orderIds.map((id) => [String(id), []]));
//     for (const it of items) {
//       itemsByOrder.get(String(it.order_id))?.push({
//         _id: it._id,
//         sku_id: it.sku_id,
//         quantity: it.quantity,
//         mrp_each: it.mrp_each,
//         sp_each: it.sp_each,
//         cashback_amount: it.cashback_amount,
//         delivery_amount: it.delivery_amount,
//         createdAt: it.createdAt,
//         item_status_history: it.item_status_history || [], // contains status_code ObjectIds
//       });
//     }

//     const payload = orders.map((o) => ({
//       _id: o._id,
//       total_amount: o.total_amount,
//       shipping_address_id: o.shipping_address_id,
//       createdAt: o.createdAt,
//       items: itemsByOrder.get(String(o._id)) || [],
//     }));

//     return res.json({ ok: true, orders: payload });
//   } catch (err) {
//     console.error("getUserOrders error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };
// controllers/order.controller.js


// Your redis helpers
const createOrder = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const {
    shipping_address_id,
    items = [],
    shipping_fee = 0,           // FE suggested shipping (validated server-side)
    order_cashback = 0,         // FE suggested applied cashback
    total_amount,               // FE grand total (validated against server calc)
  } = req.body || {};

  if (!shipping_address_id) {
    return res.status(400).json({ error: "shipping_address_id required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Status doc for CREATED
    const createdStatus = await OrderStatus
      .findOne({ status: "CREATED" })
      .session(session)
      .lean();

    if (!createdStatus?._id) {
      throw new Error('OrderStatus "CREATED" not found');
    }

    // 2) Fetch SKUs used in this order
    const skuIds = items.map(it => it.sku_id);
    const skus = await ProductSku.find({ _id: { $in: skuIds } })
      .select("_id MRP SP initial_stock sold_stock product_id status")
      .session(session)
      .lean();

    const skuMap = new Map(skus.map(s => [String(s._id), s]));

    // 3) Build item docs using authoritative server prices
    //    Also compute: per-line totals to know eligibility ceiling for cashback
    let item_subtotal = 0;
    let biggestEligibleLine = 0;

    const orderItemDocs = items.map((it) => {
      const s = skuMap.get(String(it.sku_id));
      if (!s) throw new Error(`SKU not found: ${it.sku_id}`);

      const mrp = n(s.MRP, 0);
      let sp = Math.min(n(s.SP, 0), mrp);       // SP cannot exceed MRP
      const quantity = Math.max(1, Math.floor(n(it.quantity, 1)));

      const lineSubtotal = sp * quantity;
      item_subtotal += lineSubtotal;

      // For cashback eligibility: consider only lines >= threshold
      if (lineSubtotal >= CASHBACK_LINE_THRESHOLD) {
        biggestEligibleLine = Math.max(biggestEligibleLine, lineSubtotal);
      }

      return {
        order_id: null, // set after Order creation
        sku_id: it.sku_id,
        quantity,
        mrp_each: mrp,
        sp_each: sp,
        cashback_amount: 0,  // deprecated at item level
        delivery_amount: 0,  // deprecated at item level
        item_status_history: [{ status_code: createdStatus._id }],
      };
    });

    // 4) Delivery & cashback input (non-negative)
    const delivery_fee = Math.max(0, n(shipping_fee, 0));

    // --- Cashback availability check (DB) ---
    //   Prefer Redis cache if present; fallback to Mongo value to clamp the FE value.
    const userKey = `user:${userId}`;
    let cachedCashback = 0;
    try {
      const str = await getHash(userKey, "cashback");
      if (str != null) cachedCashback = n(str, 0);
    } catch (_) {}

    let dbCashbackDoc = null;
    if (!cachedCashback) {
      dbCashbackDoc = await Cashback.findOne({ user_id: userId })
        .session(session)
        .lean();
    }
    const availableCashback = Math.max(0, cachedCashback || dbCashbackDoc?.amount || 0);

    // Clamp requested cashback:
    //  - cannot exceed available balance
    //  - cannot exceed biggest eligible line
    //  - cannot exceed subtotal
    let order_cashback_num = Math.max(0, n(order_cashback, 0));
    order_cashback_num = Math.min(
      order_cashback_num,
      availableCashback,
      biggestEligibleLine,
      item_subtotal
    );

    // 5) Compute grand total
    const computed_total = Math.max(0, item_subtotal + delivery_fee - order_cashback_num);

    // 6) Optional guard against FE total mismatch
    if (total_amount != null && Math.abs(n(total_amount) - computed_total) > 0.01) {
      throw new Error("Total mismatch. Please refresh and try again.");
    }

    // 7) Create Order
    const [order] = await Order.create(
      [
        {
          user_id: userId,
          shipping_address_id,
          item_subtotal,
          delivery_fee,
          order_cashback: order_cashback_num,
          total_amount: computed_total,
        },
      ],
      { session }
    );

    // 8) Create OrderItems with the order_id
    const docsWithOrderId = orderItemDocs.map(d => ({ ...d, order_id: order._id }));
    await OrderItem.insertMany(docsWithOrderId, { session });

    // 9) Update stock per SKU (guarding remaining >= qty)
    for (const it of items) {
      const qty = Math.max(1, Math.floor(n(it.quantity, 1)));
      const upd = await ProductSku.updateOne(
        {
          _id: it.sku_id,
          $expr: { $gte: [{ $subtract: ["$initial_stock", "$sold_stock"] }, qty] },
        },
        { $inc: { sold_stock: qty } },
        { session }
      );
      if (upd.modifiedCount !== 1) {
        throw new Error(`Insufficient stock for SKU ${it.sku_id}`);
      }
    }

    // 10) If every SKU for a product is sold-out, mark product.status = 0
    const productIds = await ProductSku
      .distinct("product_id", { _id: { $in: skuIds } })
      .session(session);

    if (productIds.length) {
      const perProductStock = await ProductSku.aggregate([
        { $match: { product_id: { $in: productIds } } },
        { $project: { product_id: 1, remaining: { $subtract: ["$initial_stock", "$sold_stock"] } } },
        { $group: { _id: "$product_id", anyInStock: { $max: { $cond: [{ $gt: ["$remaining", 0] }, 1, 0] } } } },
      ]).session(session);

      const allOut = perProductStock.filter(p => p.anyInStock === 0).map(p => p._id);
      if (allOut.length) {
        await Product.updateMany({ _id: { $in: allOut } }, { $set: { status: 0 } }, { session });
      }
    }

    // 11) Deduct applied cashback from Mongo + Redis
    if (order_cashback_num > 0) {
      // Mongo (transactional & authoritative)
      await Cashback.updateOne(
        { user_id: userId },
        {
          $inc: { amount: -order_cashback_num },
          $set: { last_updated: new Date() },
        },
        { upsert: true, session }
      );

      // Redis (best effort)
      try {
        // Recalculate new balance using whichever source we had
        const before = availableCashback;
        const newBalance = Math.max(0, before - order_cashback_num);
        await setHash(userKey, "cashback", String(newBalance), EXPIRY_SEC);
      } catch (e) {
        console.warn("Redis cashback sync failed:", e?.message || e);
      }
    }

    // 12) Clear cart cache for this user (best effort)
    try { await delHash(userKey, "cart"); } catch (_) {}

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      ok: true,
      order: {
        _id: order._id,
        createdAt: order.createdAt,
        shipping_address_id: order.shipping_address_id,
        item_subtotal: order.item_subtotal,
        delivery_fee: order.delivery_fee,
        order_cashback: order.order_cashback, // positive number (e.g., 50)
        total_amount: order.total_amount,     // item_subtotal + delivery_fee - order_cashback
      },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("createOrder error:", err);
    return res.status(400).json({ error: err.message || "Server error" });
  }
};

const getUserOrders = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
    if (orders.length === 0) return res.json({ ok: true, orders: [] });

    const orderIds = orders.map((o) => o._id);
    const items = await OrderItem.find({ order_id: { $in: orderIds } }).lean();

    const byOrder = new Map(orderIds.map((id) => [String(id), []]));
    for (const it of items) {
      byOrder.get(String(it.order_id))?.push({
        _id: it._id,
        sku_id: it.sku_id,
        quantity: it.quantity,
        mrp_each: it.mrp_each,
        sp_each: it.sp_each,
        // deprecated fields left out on purpose (they’re always 0 now)
        item_status_history: it.item_status_history || [],
        createdAt: it.createdAt,
      });
    }

    const payload = orders.map((o) => ({
      _id: o._id,
      createdAt: o.createdAt,
      shipping_address_id: o.shipping_address_id,

      // 🔶 order-level monetarys
      item_subtotal: o.item_subtotal,
      delivery_fee: o.delivery_fee,
      order_cashback: o.order_cashback,
      total_amount: o.total_amount,

      items: byOrder.get(String(o._id)) || [],
    }));

    return res.json({ ok: true, orders: payload });
  } catch (err) {
    console.error("getUserOrders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getSellerOrderItems = async (req, res) => {
  const sellerId = req.user?.userId;
  if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const skip = parseInt(req.query.skip || "0", 10);

  try {
    const objectId = new mongoose.Types.ObjectId(sellerId);

    const pipeline = [
      {
        $lookup: {
          from: "productskus",
          localField: "sku_id",
          foreignField: "_id",
          as: "sku",
        },
      },
      { $unwind: "$sku" },

      {
        $lookup: {
          from: "products",
          localField: "sku.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      { $match: { "product.userId": objectId } },

      // 🔎 bring in the order to get its createdAt
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },

      {
        $lookup: {
          from: "brands",
          localField: "product.brandId",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "orderstatuses",
          localField: "item_status_history.status_code",
          foreignField: "_id",
          as: "statusDocs",
        },
      },

      // resolve history (unchanged)
      {
        $addFields: {
          resolved_status_history: {
            $map: {
              input: { $ifNull: ["$item_status_history", []] },
              as: "ish",
              in: {
                note: "$$ish.note",
                at: "$$ish.at",
                status: {
                  $let: {
                    vars: {
                      match: {
                        $first: {
                          $filter: {
                            input: "$statusDocs",
                            as: "sd",
                            cond: { $eq: ["$$sd._id", "$$ish.status_code"] },
                          },
                        },
                      },
                    },
                    in: {
                      code: "$$match._id",
                      status: "$$match.status",
                      status_desc: "$$match.status_desc",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // last status entry (unchanged)
      {
        $addFields: {
          last_status_entry: {
            $reduce: {
              input: { $ifNull: ["$resolved_status_history", []] },
              initialValue: null,
              in: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$$value", null] },
                      { $gt: ["$$this.at", "$$value.at"] },
                    ],
                  },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },
        },
      },

      // variants resolution (unchanged)
      {
        $lookup: {
          from: "variants",
          let: { catId: "$product.category_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
            { $project: { _id: 1, name: 1, values: 1 } },
          ],
          as: "variants",
        },
      },
      {
        $addFields: {
          variant_pairs: {
            $objectToArray: { $ifNull: ["$sku.variant_values", {}] },
          },
        },
      },
      {
        $addFields: {
          resolved_variant_entries: {
            $map: {
              input: "$variant_pairs",
              as: "vp",
              in: {
                $let: {
                  vars: {
                    looksLikeId: {
                      $regexMatch: {
                        input: "$$vp.k",
                        regex: /^[a-fA-F0-9]{24}$/,
                      },
                    },
                    byId: {
                      $first: {
                        $filter: {
                          input: "$variants",
                          as: "vr",
                          cond: {
                            $eq: ["$$vr._id", { $toObjectId: "$$vp.k" }],
                          },
                        },
                      },
                    },
                    byName: {
                      $first: {
                        $filter: {
                          input: "$variants",
                          as: "vr",
                          cond: { $eq: ["$$vr.name", "$$vp.k"] },
                        },
                      },
                    },
                  },
                  in: {
                    k: {
                      $ifNull: [
                        { $cond: ["$$looksLikeId", "$$byId.name", null] },
                        "$$byName.name",
                        "$$vp.k",
                      ],
                    },
                    v: "$$vp.v",
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          variant_name_values: { $arrayToObject: "$resolved_variant_entries" },
        },
      },

      // 👉 sort by ORDER time so $first = latest order per SKU
      { $sort: { "order.createdAt": -1, createdAt: -1 } },

      {
        $group: {
          _id: "$sku._id",

          productId: { $first: "$product._id" },
          productName: { $first: "$product.name" },
          brandId: { $first: "$product.brandId" },
          brand: { $first: "$brand" },
          variantValues: { $first: "$variant_name_values" },
          thumbnailImg: { $first: "$sku.thumbnail_img" },

          seller_mrp: { $first: "$sku.seller_mrp" },
          seller_sp: { $first: "$sku.seller_sp" },

          totalSold: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$sp_each", "$quantity"] } },

          // 👉 keep the latest order time per SKU
          lastOrderCreatedAt: { $max: "$order.createdAt" },

          latestResolvedStatusHistory: { $first: "$resolved_status_history" },
          latestLastStatusEntry: { $first: "$last_status_entry" },
        },
      },

      // 👉 final ordering: newest order first (status changes do NOT affect this)
      { $sort: { lastOrderCreatedAt: -1, totalSold: -1 } },

      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          _id: 0,
          skuId: "$_id",
          productId: 1,
          productName: 1,
          brandId: 1,
          brand: { _id: "$brand._id", name: "$brand.name" },
          variantValues: 1,
          thumbnailImg: 1,

          sellerPrice: { seller_mrp: "$seller_mrp", seller_sp: "$seller_sp" },

          totalSold: 1,
          totalRevenue: 1,

          // 👉 expose the order time we sort by
          lastOrderCreatedAt: 1,

          resolvedStatusHistory: "$latestResolvedStatusHistory",
          lastStatus: {
            code: "$latestLastStatusEntry.status.code",
            status: "$latestLastStatusEntry.status.status",
            status_desc: "$latestLastStatusEntry.status.status_desc",
            at: "$latestLastStatusEntry.at",
          },
        },
      },
    ];

    const items = await OrderItem.aggregate(pipeline).exec();
    return res.json({ items, page: { skip, limit } });
  } catch (err) {
    console.error("getSellerOrderItems error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAdminOrders = async (req, res) => {
  // Optional: gatekeep with your auth middleware (only admin/super-admin)
  const isAdmin = req.user?.is_admin || req.user?.is_super_admin;
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  // pagination
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const skip = parseInt(req.query.skip || "0", 10);

  // filters (all optional)
  const { q, status, sellerId, from, to } = req.query;
  // q: search by user phone/email/name or order _id
  // status: match item-level status code string (ObjectId hex) or status name
  // sellerId: restrict to orders containing items of this seller's products
  // from/to: ISO dates (createdAt)

  try {
    const and = [];

    // date range
    if (from || to) {
      const createdAt = {};
      if (from) createdAt.$gte = new Date(from);
      if (to) createdAt.$lte = new Date(to);
      and.push({ createdAt });
    }

    // text-ish search on user or order id
    if (q) {
      const maybeId = /^[a-fA-F0-9]{24}$/.test(q)
        ? new mongoose.Types.ObjectId(q)
        : null;
      and.push({
        $or: [
          maybeId ? { _id: maybeId } : { _id: null }, // cheap path if q is hex
          { "user.full_name": { $regex: q, $options: "i" } },
          { "user.email": { $regex: q, $options: "i" } },
          { "user.phone_number": { $regex: q, $options: "i" } },
        ],
      });
    }

    // base pipeline from Order, enrich user + address first (so "q" can hit them)
    const pipeline = [
      // These first lookups must run before applying 'q' filter (they provide 'user.*' fields)
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "useraddresses",
          localField: "shipping_address_id",
          foreignField: "_id",
          as: "shipping_address",
        },
      },
      { $unwind: "$shipping_address" },

      // Resolve district / upazila names for the shipping address
      {
        $lookup: {
          from: "districts",
          localField: "shipping_address.district_id",
          foreignField: "_id",
          as: "district",
        },
      },
      { $unwind: { path: "$district", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "upazilas",
          localField: "shipping_address.upazila_id",
          foreignField: "_id",
          as: "upazila",
        },
      },
      { $unwind: { path: "$upazila", preserveNullAndEmptyArrays: true } },

      // Bring items with nested lookups & computations inside a sub-pipeline
      {
        $lookup: {
          from: "orderitems",
          let: { oid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },

            // status dictionary
            {
              $lookup: {
                from: "orderstatuses",
                localField: "item_status_history.status_code",
                foreignField: "_id",
                as: "statusDocs",
              },
            },

            // resolve status history (same logic you use)
            {
              $addFields: {
                resolved_status_history: {
                  $map: {
                    input: { $ifNull: ["$item_status_history", []] },
                    as: "ish",
                    in: {
                      note: "$$ish.note",
                      at: "$$ish.at",
                      status: {
                        $let: {
                          vars: {
                            match: {
                              $first: {
                                $filter: {
                                  input: "$statusDocs",
                                  as: "sd",
                                  cond: {
                                    $eq: ["$$sd._id", "$$ish.status_code"],
                                  },
                                },
                              },
                            },
                          },
                          in: {
                            code: "$$match._id",
                            status: "$$match.status",
                            status_desc: "$$match.status_desc",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

            // last status entry per item
            {
              $addFields: {
                last_status_entry: {
                  $reduce: {
                    input: { $ifNull: ["$resolved_status_history", []] },
                    initialValue: null,
                    in: {
                      $cond: [
                        {
                          $or: [
                            { $eq: ["$$value", null] },
                            { $gt: ["$$this.at", "$$value.at"] },
                          ],
                        },
                        "$$this",
                        "$$value",
                      ],
                    },
                  },
                },
              },
            },

            // sku -> product -> brand -> variants
            {
              $lookup: {
                from: "productskus",
                localField: "sku_id",
                foreignField: "_id",
                as: "sku",
              },
            },
            { $unwind: "$sku" },

            {
              $lookup: {
                from: "products",
                localField: "sku.product_id",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },

            {
              $lookup: {
                from: "brands",
                localField: "product.brandId",
                foreignField: "_id",
                as: "brand",
              },
            },
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

            {
              $lookup: {
                from: "variants",
                let: { catId: "$product.category_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
                  { $project: { _id: 1, name: 1, values: 1 } },
                ],
                as: "variants",
              },
            },
            {
              $addFields: {
                variant_pairs: {
                  $objectToArray: { $ifNull: ["$sku.variant_values", {}] },
                },
              },
            },
            {
              $addFields: {
                resolved_variant_entries: {
                  $map: {
                    input: "$variant_pairs",
                    as: "vp",
                    in: {
                      $let: {
                        vars: {
                          looksLikeId: {
                            $regexMatch: {
                              input: "$$vp.k",
                              regex: /^[a-fA-F0-9]{24}$/,
                            },
                          },
                          byId: {
                            $first: {
                              $filter: {
                                input: "$variants",
                                as: "vr",
                                cond: {
                                  $eq: ["$$vr._id", { $toObjectId: "$$vp.k" }],
                                },
                              },
                            },
                          },
                          byName: {
                            $first: {
                              $filter: {
                                input: "$variants",
                                as: "vr",
                                cond: { $eq: ["$$vr.name", "$$vp.k"] },
                              },
                            },
                          },
                        },
                        in: {
                          k: {
                            $ifNull: [
                              { $cond: ["$$looksLikeId", "$$byId.name", null] },
                              "$$byName.name",
                              "$$vp.k",
                            ],
                          },
                          v: "$$vp.v",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $addFields: {
                variant_name_values: {
                  $arrayToObject: "$resolved_variant_entries",
                },
              },
            },

            // project item view (ADD seller prices under sku)
            {
              $project: {
                _id: 1,
                sku_id: 1,
                quantity: 1,
                mrp_each: 1,   // captured at order time
                sp_each: 1,    // captured at order time
                cashback_amount: 1,
                delivery_amount: 1,

                product: {
                  _id: "$product._id",
                  name: "$product.name",
                  brand: { _id: "$brand._id", name: "$brand.name" },
                },
                sku: {
                  _id: "$sku._id",
                  thumbnail_img: "$sku.thumbnail_img",

                  // 👇 add these
                  seller_mrp: "$sku.seller_mrp",
                  seller_sp: "$sku.seller_sp",
                },
                variantValues: "$variant_name_values",
                resolvedStatusHistory: "$resolved_status_history",
                lastStatus: {
                  code: "$last_status_entry.status.code",
                  status: "$last_status_entry.status.status",
                  status_desc: "$last_status_entry.status.status_desc",
                  at: "$last_status_entry.at",
                },
              },
            },


            // optional: filter by sellerId at the item level
            ...(sellerId
              ? [
                  {
                    $match: {
                      "product._id": { $exists: true },
                    },
                  },
                  {
                    $lookup: {
                      from: "products",
                      localField: "sku.product_id",
                      foreignField: "_id",
                      as: "_prod_for_seller",
                    },
                  },
                  { $unwind: "$_prod_for_seller" },
                  {
                    $match: {
                      "_prod_for_seller.userId": new mongoose.Types.ObjectId(
                        sellerId
                      ),
                    },
                  },
                  { $project: { _prod_for_seller: 0 } },
                ]
              : []),
          ],
          as: "items",
        },
      },

      // rollups at the order level (based on items array)
      {
        $addFields: {

          item_quantity_total: { $sum: "$items.quantity" },
          delivery_total: {
            $ifNull: ["$delivery_fee", {
              $sum: {
                $map: { input: "$items", as: "it", in: { $ifNull: ["$$it.delivery_amount", 0] } }
              }
            }]
          },
          cashback_total: {
            $ifNull: ["$order_cashback", {
              $sum: {
                $map: { input: "$items", as: "it", in: { $ifNull: ["$$it.cashback_amount", 0] } }
              }
            }]
          },
          item_subtotal: {
            $ifNull: ["$item_subtotal", {
              $sum: { $map: { input: "$items", as: "it", in: { $multiply: ["$$it.sp_each", "$$it.quantity"] } } }
            }]
          },


          // latest status across items (by time)
          last_item_status_entry: {
            $reduce: {
              input: {
                $filter: {
                  input: {
                    $map: {
                      input: "$items",
                      as: "it",
                      in: "$$it.lastStatus",
                    },
                  },
                  as: "lse",
                  cond: { $ne: ["$$lse", null] },
                },
              },
              initialValue: null,
              in: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$$value", null] },
                      { $gt: ["$$this.at", "$$value.at"] },
                    ],
                  },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },

          // counts of item statuses
          status_counts: {
            $arrayToObject: {
              $map: {
                input: {
                  $setUnion: [
                    {
                      $map: {
                        input: "$items",
                        as: "it",
                        in: "$$it.lastStatus.status",
                      },
                    },
                    [],
                  ],
                },
                as: "st",
                in: {
                  k: { $ifNull: ["$$st", "UNKNOWN"] },
                  v: {
                    $size: {
                      $filter: {
                        input: "$items",
                        as: "it",
                        cond: { $eq: ["$$it.lastStatus.status", "$$st"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // filter by 'status' AFTER we computed item statuses
      ...(status
        ? [
            {
              $match: {
                $or: [
                  // by status name (e.g. DELIVERED)
                  { "items.lastStatus.status": status },
                  // by status ObjectId hex
                  /^[a-fA-F0-9]{24}$/.test(status)
                    ? {
                        "items.lastStatus.code": new mongoose.Types.ObjectId(
                          status
                        ),
                      }
                    : { _id: null },
                ],
              },
            },
          ]
        : []),

      // apply top-level AND filters (q, dates)
      ...(and.length ? [{ $match: { $and: and } }] : []),

      // sort newest orders first
      { $sort: { createdAt: -1, _id: -1 } },

      // pagination
      { $skip: skip },
      { $limit: limit },

      // final shape
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,

          // order monetarys
          // total_amount: 1, // from Order (authoritative if you store it as final)
          // item_subtotal: 1,
          // delivery_total: 1,
          // cashback_total: 1,
          item_quantity_total: 1,
          total_amount: 1,
          item_subtotal: 1,
          delivery_total: 1,  
          cashback_total: 1, 

          // user
          user: {
            _id: "$user._id",
            full_name: "$user.full_name",
            email: "$user.email",
            phone_number: "$user.phone_number",
            is_seller: "$user.is_seller",
          },

          // shipping address (human-friendly)
          shippingAddress: {
            _id: "$shipping_address._id",
            label: "$shipping_address.label",
            full_name: "$shipping_address.full_name",
            phone: "$shipping_address.phone",
            address: "$shipping_address.address",
            postcode: "$shipping_address.postcode",
            landmark: "$shipping_address.landmark",
            district: { _id: "$district._id", name: "$district.name" },
            upazila: { _id: "$upazila._id", name: "$upazila.name" },
          },

          // items (each with product/sku/brand/variants + status history)
          items: 1,

          // order-level status view
          lastStatus: "$last_item_status_entry",
          statusCounts: "$status_counts",
        },
      },
    ];

    const orders = await Order.aggregate(pipeline).exec();
    return res.json({ orders, page: { skip, limit } });
  } catch (err) {
    console.error("getAdminOrders error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// const getOrderDetails = async (req, res) => {
//   const userId = req.user?.userId; // authenticated customer
//   const isAdmin = req.user?.is_admin || req.user?.is_super_admin; // admins can view anything

//   const orderId = req.params.orderId; // param route
//   if (!orderId || !/^[a-fA-F0-9]{24}$/.test(orderId)) {
//     return res
//       .status(400)
//       .json({ error: "Valid orderId (ObjectId) required in URL params" });
//   }

//   try {
//     const oid = new mongoose.Types.ObjectId(orderId);

//     // 0) Ownership check (fast path, no heavy $lookups)
//     const ownerDoc = await Order.findById(oid).select("_id user_id").lean();
//     if (!ownerDoc) return res.status(404).json({ error: "Order not found" });
//     if (!isAdmin && String(ownerDoc.user_id) !== String(userId)) {
//       return res.status(403).json({ error: "Forbidden" });
//     }

//     // 1) Optional cache (safe after ownership check)
//     const cacheKey = `order:${orderId}`;
//     try {
//       const cached = await getHash(cacheKey, "payload");
//       if (cached) {
//         const parsed = JSON.parse(cached);
//         if (
//           isAdmin ||
//           String(parsed?.user?._id) === String(ownerDoc.user_id)
//         ) {
//           return res.json({ ok: true, order: parsed, cached: true });
//         }
//       }
//     } catch {}

//     // 2) Full aggregation
//     const pipeline = [
//       { $match: { _id: oid } },

//       // user + shipping address
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $lookup: {
//           from: "useraddresses",
//           localField: "shipping_address_id",
//           foreignField: "_id",
//           as: "shipping_address",
//         },
//       },
//       { $unwind: { path: "$shipping_address", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "districts",
//           localField: "shipping_address.district_id",
//           foreignField: "_id",
//           as: "district",
//         },
//       },
//       { $unwind: { path: "$district", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "upazilas",
//           localField: "shipping_address.upazila_id",
//           foreignField: "_id",
//           as: "upazila",
//         },
//       },
//       { $unwind: { path: "$upazila", preserveNullAndEmptyArrays: true } },

//       // items + status resolve + sku/product/brand/variants
//       {
//         $lookup: {
//           from: "orderitems",
//           let: { oid: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },

//             {
//               $lookup: {
//                 from: "orderstatuses",
//                 localField: "item_status_history.status_code",
//                 foreignField: "_id",
//                 as: "statusDocs",
//               },
//             },
//             {
//               $addFields: {
//                 resolved_status_history: {
//                   $map: {
//                     input: { $ifNull: ["$item_status_history", []] },
//                     as: "ish",
//                     in: {
//                       note: "$$ish.note",
//                       at: "$$ish.at",
//                       status: {
//                         $let: {
//                           vars: {
//                             match: {
//                               $first: {
//                                 $filter: {
//                                   input: "$statusDocs",
//                                   as: "sd",
//                                   cond: { $eq: ["$$sd._id", "$$ish.status_code"] },
//                                 },
//                               },
//                             },
//                           },
//                           in: {
//                             code: "$$match._id",
//                             status: "$$match.status",
//                             status_desc: "$$match.status_desc",
//                           },
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             {
//               $addFields: {
//                 last_status_entry: {
//                   $reduce: {
//                     input: { $ifNull: ["$resolved_status_history", []] },
//                     initialValue: null,
//                     in: {
//                       $cond: [
//                         {
//                           $or: [
//                             { $eq: ["$$value", null] },
//                             { $gt: ["$$this.at", "$$value.at"] },
//                           ],
//                         },
//                         "$$this",
//                         "$$value",
//                       ],
//                     },
//                   },
//                 },
//               },
//             },

//             { $lookup: { from: "productskus", localField: "sku_id", foreignField: "_id", as: "sku" } },
//             { $unwind: "$sku" },
//             { $lookup: { from: "products", localField: "sku.product_id", foreignField: "_id", as: "product" } },
//             { $unwind: "$product" },
//             { $lookup: { from: "brands", localField: "product.brandId", foreignField: "_id", as: "brand" } },
//             { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

//             {
//               $lookup: {
//                 from: "variants",
//                 let: { catId: "$product.category_id" },
//                 pipeline: [
//                   { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
//                   { $project: { _id: 1, name: 1, values: 1 } },
//                 ],
//                 as: "variants",
//               },
//             },
//             { $addFields: { variant_pairs: { $objectToArray: { $ifNull: ["$sku.variant_values", {}] } } } },
//             {
//               $addFields: {
//                 resolved_variant_entries: {
//                   $map: {
//                     input: "$variant_pairs",
//                     as: "vp",
//                     in: {
//                       $let: {
//                         vars: {
//                           looksLikeId: {
//                             $regexMatch: {
//                               input: "$$vp.k",
//                               regex: /^[a-fA-F0-9]{24}$/,
//                             },
//                           },
//                           byId: {
//                             $first: {
//                               $filter: {
//                                 input: "$variants",
//                                 as: "vr",
//                                 cond: {
//                                   $eq: ["$$vr._id", { $toObjectId: "$$vp.k" }],
//                                 },
//                               },
//                             },
//                           },
//                           byName: {
//                             $first: {
//                               $filter: {
//                                 input: "$variants",
//                                 as: "vr",
//                                 cond: { $eq: ["$$vr.name", "$$vp.k"] },
//                               },
//                             },
//                           },
//                         },
//                         in: {
//                           k: {
//                             $ifNull: [
//                               { $cond: ["$$looksLikeId", "$$byId.name", null] },
//                               "$$byName.name",
//                               "$$vp.k",
//                             ],
//                           },
//                           v: "$$vp.v",
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//             { $addFields: { variant_name_values: { $arrayToObject: "$resolved_variant_entries" } } },

//             {
//               $project: {
//                 _id: 1,
//                 sku_id: 1,
//                 quantity: 1,
//                 mrp_each: 1,
//                 sp_each: 1,
//                 cashback_amount: 1,
//                 delivery_amount: 1,
//                 createdAt: 1,
//                 product: {
//                   _id: "$product._id",
//                   name: "$product.name",
//                   brand: { _id: "$brand._id", name: "$brand.name" },
//                 },
//                 sku: { _id: "$sku._id", thumbnail_img: "$sku.thumbnail_img" },
//                 variantValues: "$variant_name_values",
//                 resolvedStatusHistory: "$resolved_status_history",
//                 lastStatus: {
//                   code: "$last_status_entry.status.code",
//                   status: "$last_status_entry.status.status",
//                   status_desc: "$last_status_entry.status.status_desc",
//                   at: "$last_status_entry.at",
//                 },
//               },
//             },
//           ],
//           as: "items",
//         },
//       },

//       // order-level rollups + payment_status
//       {
//         $addFields: {
//           item_subtotal: {
//             $sum: {
//               $map: {
//                 input: "$items",
//                 as: "it",
//                 in: { $multiply: ["$$it.sp_each", "$$it.quantity"] },
//               },
//             },
//           },
//           item_quantity_total: { $sum: "$items.quantity" },
//           delivery_total: { $sum: "$items.delivery_amount" },
//           cashback_total: { $sum: "$items.cashback_amount" },
//           last_item_status_entry: {
//             $reduce: {
//               input: {
//                 $filter: {
//                   input: {
//                     $map: { input: "$items", as: "it", in: "$$it.lastStatus" },
//                   },
//                   as: "lse",
//                   cond: { $ne: ["$$lse", null] },
//                 },
//               },
//               initialValue: null,
//               in: {
//                 $cond: [
//                   { $or: [{ $eq: ["$$value", null] }, { $gt: ["$$this.at", "$$value.at"] }] },
//                   "$$this",
//                   "$$value",
//                 ],
//               },
//             },
//           },
//           payment_status: {
//             $cond: [
//               {
//                 $gt: [
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$items",
//                         as: "it",
//                         cond: { $eq: ["$$it.lastStatus.status", "PAID"] },
//                       },
//                     },
//                   },
//                   0,
//                 ],
//               },
//               "PAID",
//               "UNPAID",
//             ],
//           },
//         },
//       },

//       // final shape
//       {
//         $project: {
//           _id: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           total_amount: 1,
//           item_subtotal: 1,
//           delivery_total: 1,
//           cashback_total: 1,
//           item_quantity_total: 1,
//           payment_status: 1,
//           user: {
//             _id: "$user._id",
//             full_name: "$user.full_name",
//             email: "$user.email",
//             phone_number: "$user.phone_number",
//           },
//           shippingAddress: {
//             _id: "$shipping_address._id",
//             label: "$shipping_address.label",
//             full_name: "$shipping_address.full_name",
//             phone: "$shipping_address.phone",
//             address: "$shipping_address.address",
//             postcode: "$shipping_address.postcode",
//             landmark: "$shipping_address.landmark",
//             district: { _id: "$district._id", name: "$district.name" },
//             upazila: { _id: "$upazila._id", name: "$upazila.name" },
//           },
//           items: 1,
//           lastStatus: "$last_item_status_entry",
//         },
//       },
//     ];

//     const docs = await Order.aggregate(pipeline).exec();
//     const order = docs?.[0];
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     // 3) Cache ~10 min
//     try {
//       await setHash(cacheKey, "payload", JSON.stringify(order), 600);
//     } catch {}

//     return res.json({ ok: true, order });
//   } catch (err) {
//     console.error("getOrderDetails error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };
// controllers/orderController.js
// controllers/orderController.js
const getOrderDetails = async (req, res) => {
  const userId = req.user?.userId;
  const isAdmin = req.user?.is_admin || req.user?.is_super_admin;

  const orderId = req.params.orderId;
  if (!orderId || !/^[a-fA-F0-9]{24}$/.test(orderId)) {
    return res
      .status(400)
      .json({ error: "Valid orderId (ObjectId) required in URL params" });
  }

  try {
    const oid = new mongoose.Types.ObjectId(orderId);

    // 0) ownership check
    const ownerDoc = await Order.findById(oid).select("_id user_id").lean();
    if (!ownerDoc) return res.status(404).json({ error: "Order not found" });
    if (!isAdmin && String(ownerDoc.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 1) cache (safe after ownership check)
    const cacheKey = `order:${orderId}`;
    try {
      const cached = await getHash(cacheKey, "payload");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isAdmin || String(parsed?.user?._id) === String(ownerDoc.user_id)) {
          return res.json({ ok: true, order: parsed, cached: true });
        }
      }
    } catch {}

    // 2) full aggregation
    const pipeline = [
      { $match: { _id: oid } },

      // user + address
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $lookup: { from: "useraddresses", localField: "shipping_address_id", foreignField: "_id", as: "shipping_address" } },
      { $unwind: { path: "$shipping_address", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "districts", localField: "shipping_address.district_id", foreignField: "_id", as: "district" } },
      { $unwind: { path: "$district", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "upazilas", localField: "shipping_address.upazila_id", foreignField: "_id", as: "upazila" } },
      { $unwind: { path: "$upazila", preserveNullAndEmptyArrays: true } },

      // items + status resolution + sku/product/brand/variants
      {
        $lookup: {
          from: "orderitems",
          let: { oid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },

            { // statuses dictionary
              $lookup: {
                from: "orderstatuses",
                localField: "item_status_history.status_code",
                foreignField: "_id",
                as: "statusDocs",
              },
            },
            { // resolved history
              $addFields: {
                resolved_status_history: {
                  $map: {
                    input: { $ifNull: ["$item_status_history", []] },
                    as: "ish",
                    in: {
                      note: "$$ish.note",
                      at: "$$ish.at",
                      status: {
                        $let: {
                          vars: {
                            match: {
                              $first: {
                                $filter: {
                                  input: "$statusDocs",
                                  as: "sd",
                                  cond: { $eq: ["$$sd._id", "$$ish.status_code"] },
                                },
                              },
                            },
                          },
                          in: {
                            code: "$$match._id",
                            status: "$$match.status",
                            status_desc: "$$match.status_desc",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            { // last history point per item
              $addFields: {
                last_status_entry: {
                  $reduce: {
                    input: { $ifNull: ["$resolved_status_history", []] },
                    initialValue: null,
                    in: {
                      $cond: [
                        { $or: [{ $eq: ["$$value", null] }, { $gt: ["$$this.at", "$$value.at"] }] },
                        "$$this",
                        "$$value",
                      ],
                    },
                  },
                },
              },
            },

            { $lookup: { from: "productskus", localField: "sku_id", foreignField: "_id", as: "sku" } },
            { $unwind: "$sku" },
            { $lookup: { from: "products", localField: "sku.product_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $lookup: { from: "brands", localField: "product.brandId", foreignField: "_id", as: "brand" } },
            { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

            // variants mapping id/name to name
            {
              $lookup: {
                from: "variants",
                let: { catId: "$product.category_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
                  { $project: { _id: 1, name: 1, values: 1 } },
                ],
                as: "variants",
              },
            },
            { $addFields: { variant_pairs: { $objectToArray: { $ifNull: ["$sku.variant_values", {}] } } } },
            {
              $addFields: {
                resolved_variant_entries: {
                  $map: {
                    input: "$variant_pairs",
                    as: "vp",
                    in: {
                      $let: {
                        vars: {
                          looksLikeId: { $regexMatch: { input: "$$vp.k", regex: /^[a-fA-F0-9]{24}$/ } },
                          byId: {
                            $first: {
                              $filter: {
                                input: "$variants",
                                as: "vr",
                                cond: { $eq: ["$$vr._id", { $toObjectId: "$$vp.k" }] },
                              },
                            },
                          },
                          byName: {
                            $first: {
                              $filter: {
                                input: "$variants",
                                as: "vr",
                                cond: { $eq: ["$$vr.name", "$$vp.k"] },
                              },
                            },
                          },
                        },
                        in: {
                          k: { $ifNull: [{ $cond: ["$$looksLikeId", "$$byId.name", null] }, "$$byName.name", "$$vp.k"] },
                          v: "$$vp.v",
                        },
                      },
                    },
                  },
                },
              },
            },
            { $addFields: { variant_name_values: { $arrayToObject: "$resolved_variant_entries" } } },

            { // final item projection
              $project: {
                _id: 1,
                sku_id: 1,
                quantity: 1,
                mrp_each: 1,
                sp_each: 1,
                cashback_amount: 1,
                delivery_amount: 1,
                createdAt: 1,
                product: { _id: "$product._id", name: "$product.name", brand: { _id: "$brand._id", name: "$brand.name" } },
                sku: { _id: "$sku._id", thumbnail_img: "$sku.thumbnail_img" },
                variantValues: "$variant_name_values",
                resolvedStatusHistory: "$resolved_status_history",
                lastStatus: {
                  code: "$last_status_entry.status.code",
                  status: "$last_status_entry.status.status",
                  status_desc: "$last_status_entry.status.status_desc",
                  at: "$last_status_entry.at",
                },
              },
            },
          ],
          as: "items",
        },
      },

      // order-level rollups + payment_status (ANY PAID anywhere)
      {
        $addFields: {
          // inside $addFields of both pipelines
          delivery_total: {
            $ifNull: ["$delivery_fee", {
              $sum: {
                $map: { input: "$items", as: "it", in: { $ifNull: ["$$it.delivery_amount", 0] } }
              }
            }]
          },
          cashback_total: {
            $ifNull: ["$order_cashback", {
              $sum: {
                $map: { input: "$items", as: "it", in: { $ifNull: ["$$it.cashback_amount", 0] } }
              }
            }]
          },
          item_subtotal: {
            $ifNull: ["$item_subtotal", {
              $sum: { $map: { input: "$items", as: "it", in: { $multiply: ["$$it.sp_each", "$$it.quantity"] } } }
            }]
          },

          last_item_status_entry: {
            $reduce: {
              input: {
                $filter: {
                  input: { $map: { input: "$items", as: "it", in: "$$it.lastStatus" } },
                  as: "lse",
                  cond: { $ne: ["$$lse", null] },
                },
              },
              initialValue: null,
              in: {
                $cond: [
                  { $or: [{ $eq: ["$$value", null] }, { $gt: ["$$this.at", "$$value.at"] }] },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },

          // PAID if ANY history entry across ANY item == "PAID"
          payment_status: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: {
                          $reduce: {
                            input: "$items",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this.resolvedStatusHistory"] },
                          },
                        },
                        as: "h",
                        cond: { $eq: ["$$h.status.status", "PAID"] },
                      },
                    },
                  },
                  0,
                ],
              },
              "PAID",
              "UNPAID",
            ],
          },
        },
      },

      // final shape
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          total_amount: 1,
          item_subtotal: 1,
          delivery_total: 1,  
          cashback_total: 1, 
          payment_status: 1,
          user: { _id: "$user._id", full_name: "$user.full_name", email: "$user.email", phone_number: "$user.phone_number" },
          shippingAddress: {
            _id: "$shipping_address._id",
            label: "$shipping_address.label",
            full_name: "$shipping_address.full_name",
            phone: "$shipping_address.phone",
            address: "$shipping_address.address",
            postcode: "$shipping_address.postcode",
            landmark: "$shipping_address.landmark",
            district: { _id: "$district._id", name: "$district.name" },
            upazila: { _id: "$upazila._id", name: "$upazila.name" },
          },
          items: 1,
          lastStatus: "$last_item_status_entry",
        },
      },
    ];

    const docs = await Order.aggregate(pipeline).exec();
    const order = docs?.[0];
    if (!order) return res.status(404).json({ error: "Order not found" });

    try { await setHash(cacheKey, "payload", JSON.stringify(order), 600); } catch {}

    return res.json({ ok: true, order });
  } catch (err) {
    console.error("getOrderDetails error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getOrderStatuses,
  createOrder,
  getUserOrders,
  getSellerOrderItems,
  getAdminOrders,
  getOrderDetails
};

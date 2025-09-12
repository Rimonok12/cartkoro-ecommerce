// controllers/orderController.js
const mongoose = require("mongoose");
const { Order, OrderItem, OrderStatus } = require("../models/orderModels.js");
const { Cashback, User, UserAddress } = require("../models/userModels");

const { Product, ProductSku } = require("../models/productModels");

const { setHash, getHash, delHash } = require("../config/redisClient");

// const createOrder = async (req, res) => {
//   const userId = req.user?.userId;
//   if (!userId) return res.status(401).json({ error: "Unauthorized" });

//   const { shipping_address_id, total_amount, items = [] } = req.body || {};
//   if (!shipping_address_id)
//     return res.status(400).json({ error: "shipping_address_id required" });
//   if (!Array.isArray(items) || items.length === 0)
//     return res.status(400).json({ error: "items required" });

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const createdStatus = await OrderStatus.findOne({ status: "CREATED" })
//       .session(session)
//       .lean();
//     if (!createdStatus?._id) throw new Error('OrderStatus "CREATED" not found');

//     const skuIds = items.map((it) => it.sku_id);
//     const skus = await ProductSku.find({ _id: { $in: skuIds } })
//       .select("_id MRP SP")
//       .session(session)
//       .lean();
//     const skuMap = new Map(skus.map((s) => [String(s._id), s]));

//     const [order] = await Order.create(
//       [
//         {
//           user_id: userId,
//           shipping_address_id,
//           total_amount: Number(total_amount) || 0,
//         },
//       ],
//       { session }
//     );

//     const docs = items.map((it) => {
//       const s = skuMap.get(String(it.sku_id));
//       if (!s) throw new Error(`SKU not found: ${it.sku_id}`);
//       const mrp = Number(s.MRP) || 0;
//       let sp = Number(s.SP) || 0;
//       if (sp > mrp) sp = mrp;

//       return {
//         order_id: order._id,
//         sku_id: it.sku_id,
//         quantity: Number(it.quantity) || 1,
//         mrp_each: mrp,
//         sp_each: sp,
//         cashback_amount: Number(it.cashback_amount) || 0,
//         delivery_amount: Number(it.delivery_amount) || 0,
//         item_status_history: [{ status_code: createdStatus._id }],
//       };
//     });

//     await OrderItem.insertMany(docs, { session });

//     // stock decrement
//     for (const it of items) {
//       const qty = Number(it.quantity) || 1;
//       const upd = await ProductSku.updateOne(
//         {
//           _id: it.sku_id,
//           $expr: {
//             $gte: [{ $subtract: ["$initial_stock", "$sold_stock"] }, qty],
//           },
//         },
//         { $inc: { sold_stock: qty } },
//         { session }
//       );
//       if (upd.modifiedCount !== 1)
//         throw new Error(`Insufficient stock for SKU ${it.sku_id}`);
//     }

//     // (Optional) cashback updates ...
//     await session.commitTransaction();
//     session.endSession();

//     try {
//       await delHash(`user:${userId}`, "cart");
//     } catch {}

//     return res.status(201).json({
//       ok: true,
//       order: {
//         _id: order._id,
//         total_amount: order.total_amount,
//         shipping_address_id: order.shipping_address_id,
//         createdAt: order.createdAt,
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction().catch(() => {});
//     session.endSession();
//     console.error("createOrder error:", err);
//     return res.status(400).json({ error: err.message || "Server error" });
//   }
// };
const createOrder = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { shipping_address_id, total_amount, items = [] } = req.body || {};
  if (!shipping_address_id)
    return res.status(400).json({ error: "shipping_address_id required" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items required" });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Resolve CREATED status
    const createdStatus = await OrderStatus.findOne({ status: "CREATED" })
      .session(session)
      .lean();
    if (!createdStatus?._id) throw new Error('OrderStatus "CREATED" not found');

    // 2) Load SKUs referenced by the order
    const skuIds = items.map((it) => it.sku_id);
    const skus = await ProductSku.find({ _id: { $in: skuIds } })
      .select("_id MRP SP initial_stock sold_stock product_id status")
      .session(session)
      .lean();
    const skuMap = new Map(skus.map((s) => [String(s._id), s]));

    // 3) Create Order
    const [order] = await Order.create(
      [
        {
          user_id: userId,
          shipping_address_id,
          total_amount: Number(total_amount) || 0,
        },
      ],
      { session }
    );

    // 4) Create OrderItems (validating prices from SKUs)
    const docs = items.map((it) => {
      const s = skuMap.get(String(it.sku_id));
      if (!s) throw new Error(`SKU not found: ${it.sku_id}`);
      const mrp = Number(s.MRP) || 0;
      let sp = Number(s.SP) || 0;
      if (sp > mrp) sp = mrp;

      return {
        order_id: order._id,
        sku_id: it.sku_id,
        quantity: Number(it.quantity) || 1,
        mrp_each: mrp,
        sp_each: sp,
        cashback_amount: Number(it.cashback_amount) || 0,
        delivery_amount: Number(it.delivery_amount) || 0,
        item_status_history: [{ status_code: createdStatus._id }],
      };
    });

    await OrderItem.insertMany(docs, { session });

    // 5) Decrement stock with an atomic guard (available >= qty)
    for (const it of items) {
      const qty = Number(it.quantity) || 1;
      const upd = await ProductSku.updateOne(
        {
          _id: it.sku_id,
          $expr: {
            $gte: [{ $subtract: ["$initial_stock", "$sold_stock"] }, qty],
          },
        },
        { $inc: { sold_stock: qty } },
        { session }
      );
      if (upd.modifiedCount !== 1)
        throw new Error(`Insufficient stock for SKU ${it.sku_id}`);
    }

    // 6) Mark SKUs that are now out of stock -> status = 0
    await ProductSku.updateMany(
      {
        _id: { $in: skuIds },
        $expr: { $gte: ["$sold_stock", "$initial_stock"] },
      },
      { $set: { status: 0 } },
      { session }
    );

    // 7) For affected products, set product.status=0 if ALL of its SKUs are out of stock
    //    (i.e., no variant has remaining stock > 0)
    const productIds = await ProductSku.distinct("product_id", {
      _id: { $in: skuIds },
    }).session(session);

    if (productIds.length) {
      const perProductStock = await ProductSku.aggregate([
        { $match: { product_id: { $in: productIds } } },
        {
          $project: {
            product_id: 1,
            remaining: { $subtract: ["$initial_stock", "$sold_stock"] },
            // If you have permanently disabled variants you want to ignore in availability,
            // uncomment the line below and add it to $match:
            // status: 1
          },
        },
        {
          $group: {
            _id: "$product_id",
            anyInStock: {
              $max: { $cond: [{ $gt: ["$remaining", 0] }, 1, 0] },
            },
          },
        },
      ]).session(session);

      // Only set to 0 when no variants have stock; do NOT set to 1 here.
      const productsAllOut = perProductStock
        .filter((p) => p.anyInStock === 0)
        .map((p) => p._id);

      if (productsAllOut.length) {
        await Product.updateMany(
          { _id: { $in: productsAllOut } },
          { $set: { status: 0 } },
          { session }
        );
      }
    }

    // (Optional) cashback updates...

    await session.commitTransaction();
    session.endSession();

    // 8) best-effort cart invalidation (outside transaction)
    try {
      await delHash(`user:${userId}`, "cart");
    } catch {}

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
    console.error("createOrder error:", err);
    return res.status(400).json({ error: err.message || "Server error" });
  }
};

const getUserOrders = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

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
        item_status_history: it.item_status_history || [], // contains status_code ObjectIds
      });
    }

    const payload = orders.map((o) => ({
      _id: o._id,
      total_amount: o.total_amount,
      shipping_address_id: o.shipping_address_id,
      createdAt: o.createdAt,
      items: itemsByOrder.get(String(o._id)) || [],
    }));

    return res.json({ ok: true, orders: payload });
  } catch (err) {
    console.error("getUserOrders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /order/getSellerOrderItems?limit=20&skip=0
// const getSellerOrderItems = async (req, res) => {
//   const sellerId = req.user?.userId;
//   if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

//   const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
//   const skip = parseInt(req.query.skip || "0", 10);

//   try {
//     const objectId = new mongoose.Types.ObjectId(sellerId);

//     const pipeline = [
//       // SKU join
//       {
//         $lookup: {
//           from: "productskus",
//           localField: "sku_id",
//           foreignField: "_id",
//           as: "sku",
//         },
//       },
//       { $unwind: "$sku" },

//       // Product (ownership + name/brand/category)
//       {
//         $lookup: {
//           from: "products",
//           localField: "sku.product_id",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       { $unwind: "$product" },

//       // Only seller's items
//       { $match: { "product.userId": objectId } },

//       // Brand (optional if brand name is denormalized on product)
//       {
//         $lookup: {
//           from: "brands",
//           localField: "product.brandId",
//           foreignField: "_id",
//           as: "brand",
//         },
//       },
//       { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

//       // Status codes join to resolve item_status_history
//       {
//         $lookup: {
//           from: "orderstatuses",
//           localField: "item_status_history.status_code",
//           foreignField: "_id",
//           as: "statusDocs",
//         },
//       },

//       // Resolve status history for THIS order item
//       {
//         $addFields: {
//           resolved_status_history: {
//             $map: {
//               input: { $ifNull: ["$item_status_history", []] },
//               as: "ish",
//               in: {
//                 note: "$$ish.note",
//                 at: "$$ish.at",
//                 status: {
//                   $let: {
//                     vars: {
//                       match: {
//                         $first: {
//                           $filter: {
//                             input: "$statusDocs",
//                             as: "sd",
//                             cond: { $eq: ["$$sd._id", "$$ish.status_code"] },
//                           },
//                         },
//                       },
//                     },
//                     in: {
//                       code: "$$match._id",
//                       status: "$$match.status",
//                       status_desc: "$$match.status_desc",
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },

//       // Compute the latest status entry within this item's history
//       {
//         $addFields: {
//           last_status_entry: {
//             $reduce: {
//               input: { $ifNull: ["$resolved_status_history", []] },
//               initialValue: null,
//               in: {
//                 $cond: [
//                   {
//                     $or: [
//                       { $eq: ["$$value", null] },
//                       { $gt: ["$$this.at", "$$value.at"] },
//                     ],
//                   },
//                   "$$this",
//                   "$$value",
//                 ],
//               },
//             },
//           },
//         },
//       },

//       // 🔎 Load Variant definitions for this product's category
//       {
//         $lookup: {
//           from: "variants",
//           let: { catId: "$product.category_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$category_id", "$$catId"] } } },
//             { $project: { _id: 1, name: 1, values: 1 } },
//           ],
//           as: "variants",
//         },
//       },

//       // 🧩 Resolve sku.variant_values keys -> variant names (handles IDs or names)
//       {
//         $addFields: {
//           variant_pairs: {
//             $objectToArray: { $ifNull: ["$sku.variant_values", {}] },
//           },
//         },
//       },
//       {
//         $addFields: {
//           resolved_variant_entries: {
//             $map: {
//               input: "$variant_pairs",
//               as: "vp",
//               in: {
//                 $let: {
//                   vars: {
//                     looksLikeId: {
//                       $regexMatch: {
//                         input: "$$vp.k",
//                         // 24 hex chars → looks like ObjectId
//                         regex: /^[a-fA-F0-9]{24}$/,
//                       },
//                     },
//                     byId: {
//                       $first: {
//                         $filter: {
//                           input: "$variants",
//                           as: "vr",
//                           cond: {
//                             $eq: ["$$vr._id", { $toObjectId: "$$vp.k" }],
//                           },
//                         },
//                       },
//                     },
//                     byName: {
//                       $first: {
//                         $filter: {
//                           input: "$variants",
//                           as: "vr",
//                           cond: { $eq: ["$$vr.name", "$$vp.k"] },
//                         },
//                       },
//                     },
//                   },
//                   in: {
//                     k: {
//                       $ifNull: [
//                         { $cond: ["$$looksLikeId", "$$byId.name", null] },
//                         "$$byName.name",
//                         "$$vp.k", // fallback
//                       ],
//                     },
//                     v: "$$vp.v", // value is kept as-is (already a string per schema)
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           variant_name_values: { $arrayToObject: "$resolved_variant_entries" },
//         },
//       },

//       // Sort items so $first in the group is the latest per SKU
//       { $sort: { createdAt: -1 } },

//       // Group by SKU (roll-up per item)
//       {
//         $group: {
//           _id: "$sku._id",

//           // product & sku meta
//           productId: { $first: "$product._id" },
//           productName: { $first: "$product.name" },
//           brandId: { $first: "$product.brandId" },
//           brand: { $first: "$brand" },
//           variantValues: { $first: "$variant_name_values" },
//           thumbnailImg: { $first: "$sku.thumbnail_img" },

//           // aggregates
//           totalSold: { $sum: "$quantity" },
//           totalRevenue: { $sum: { $multiply: ["$sp_each", "$quantity"] } },
//           lastItemCreatedAt: { $max: "$createdAt" },

//           // latest order's status info (for this SKU)
//           latestResolvedStatusHistory: { $first: "$resolved_status_history" },
//           latestLastStatusEntry: { $first: "$last_status_entry" },
//         },
//       },

//       // Sort by most sold and recency
//       { $sort: { totalSold: -1, lastItemCreatedAt: -1 } },

//       // Pagination
//       { $skip: skip },
//       { $limit: limit },

//       // Final shape
//       {
//         $project: {
//           _id: 0,
//           skuId: "$_id",
//           productId: 1,
//           productName: 1,
//           brandId: 1,
//           brand: { _id: "$brand._id", name: "$brand.name" },
//           variantValues: 1, // ✅ keys are NAMES now
//           thumbnailImg: 1,
//           totalSold: 1,
//           totalRevenue: 1,
//           lastItemCreatedAt: 1,

//           // status history (latest order item for this SKU)
//           resolvedStatusHistory: "$latestResolvedStatusHistory",
//           lastStatus: {
//             code: "$latestLastStatusEntry.status.code",
//             status: "$latestLastStatusEntry.status.status",
//             status_desc: "$latestLastStatusEntry.status.status_desc",
//             at: "$latestLastStatusEntry.at",
//           },
//         },
//       },
//     ];

//     const items = await OrderItem.aggregate(pipeline).exec();
//     return res.json({ items, page: { skip, limit } });
//   } catch (err) {
//     console.error("getSellerOrderItems error:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };
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

            // project item view
            {
              $project: {
                _id: 1,
                sku_id: 1,
                quantity: 1,
                mrp_each: 1,
                sp_each: 1,
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
          item_subtotal: {
            $sum: {
              $map: {
                input: "$items",
                as: "it",
                in: { $multiply: ["$$it.sp_each", "$$it.quantity"] },
              },
            },
          },
          item_quantity_total: { $sum: "$items.quantity" },
          delivery_total: { $sum: "$items.delivery_amount" },
          cashback_total: { $sum: "$items.cashback_amount" },

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
          total_amount: 1, // from Order (authoritative if you store it as final)
          item_subtotal: 1,
          delivery_total: 1,
          cashback_total: 1,
          item_quantity_total: 1,

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

module.exports = {
  createOrder,
  getUserOrders,
  getSellerOrderItems,
  getAdminOrders,
};

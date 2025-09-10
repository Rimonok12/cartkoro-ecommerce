// controllers/orderController.js
const mongoose = require("mongoose");
const { Order, OrderItem, OrderStatus } = require("../models/orderModels.js");
const { Cashback } = require("../models/userModels");

const { ProductSku } = require("../models/productModels");

const { setHash, getHash, delHash } = require("../config/redisClient");

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
    const createdStatus = await OrderStatus.findOne({ status: "CREATED" })
      .session(session)
      .lean();
    if (!createdStatus?._id) throw new Error('OrderStatus "CREATED" not found');

    const skuIds = items.map((it) => it.sku_id);
    const skus = await ProductSku.find({ _id: { $in: skuIds } })
      .select("_id MRP SP")
      .session(session)
      .lean();
    const skuMap = new Map(skus.map((s) => [String(s._id), s]));

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

    // stock decrement
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

    // (Optional) cashback updates ...
    await session.commitTransaction();
    session.endSession();

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

module.exports = {
  createOrder,
  getUserOrders,
  getSellerOrderItems,
};

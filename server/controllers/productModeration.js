// controllers/productModeration.js
const {
  Category,
  Brand,
  Product,
  Variant,
  ProductSku,
  CategoryMargin,
} = require("../models/productModels");
const mongoose = require("mongoose");

// POST /products/pending
// Body: { page?: 1, limit?: 20, search?: "" }
// Lists all pending products (status: -2) for the logged-in user
const pendingProductsList = async (req, res) => {
  try {
    const sellerId = req.body?.sellerId;

    const page = Math.max(parseInt(req.body?.page ?? 1, 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.body?.limit ?? 20, 10), 1),
      100
    );
    const search = (req.body?.search ?? "").trim();

    const filter = { status: -2, userId: sellerId };
    if (search) filter.name = { $regex: search, $options: "i" };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select(
          "_id name category_id brandId description status createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    console.error("pendingProductsList Error", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch pending products." });
  }
};

// POST /products/approve
// Body: { ids: ["64f...","64a..."] }
// Approves (status: 1) only the caller's pending (-2) products
const approvedProducts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sellerId = req.body?.sellerId;

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Provide a non-empty array of product ids." });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid product ids provided." });
    }

    // Only approve products owned by this user that are pending
    const match = { _id: { $in: validIds }, status: -2, userId: sellerId };

    const { matchedCount, modifiedCount } = await Product.updateMany(
      match,
      { $set: { status: 1 } },
      { session }
    );

    // (Optional) If SKU visibility is gated, also activate their SKUs:
    // await ProductSku.updateMany(
    //   { product_id: { $in: validIds } },
    //   { $set: { status: 1 } },
    //   { session }
    // );

    await session.commitTransaction();
    session.endSession();

    if (matchedCount === 0) {
      return res.status(400).json({
        requestedIds: ids.length,
        validIds: validIds.length,
        matched: 0,
        approved: 0,
        message:
          "No pending products found for your account with the given ids.",
      });
    }

    return res.json({
      requestedIds: ids.length,
      validIds: validIds.length,
      matched: matchedCount,
      approved: modifiedCount,
      message: `Approved ${modifiedCount} product(s).`,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("approvedProducts Error", err);
    return res.status(500).json({ message: "Failed to approve products." });
  }
};

// const upsertCategoryMargin = async (req, res) => {
//   try {
//     const { categoryId, spPercent, mrpPercent } = req.body;

//     if (!categoryId) {
//       return res.status(400).json({ message: "categoryId is required" });
//     }

//     const cat = await Category.findById(categoryId).lean();
//     if (!cat) return res.status(404).json({ message: "Category not found" });

//     const update = {
//       ...(typeof spPercent === "number" ? { sp_percent: spPercent } : {}),
//       ...(typeof mrpPercent === "number" ? { mrp_percent: mrpPercent } : {}),
//     };

//     const margin = await CategoryMargin.findOneAndUpdate(
//       { category_id: categoryId },
//       { $set: update },
//       { new: true, upsert: true, runValidators: true }
//     ).lean();

//     return res.status(200).json({ message: "Margin upserted", data: margin });
//   } catch (err) {
//     console.error("upsertCategoryMargin error:", err);
//     return res
//       .status(500)
//       .json({ message: "Internal error", error: err.message });
//   }
// };
const upsertCategoryMargin = async (req, res) => {
  try {
    const { categoryId, spPercent, mrpPercent, priceMin, priceMax, isActive } =
      req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const cat = await Category.findById(categoryId).lean();
    if (!cat) return res.status(404).json({ message: "Category not found" });

    // Build $set only with provided fields
    const set = {};
    if (typeof spPercent === "number") set.sp_percent = spPercent;
    if (typeof mrpPercent === "number") set.mrp_percent = mrpPercent;
    if (typeof isActive === "boolean") set.is_active = isActive;

    // Handle optional price band
    const hasMin = typeof priceMin !== "undefined";
    const hasMax = typeof priceMax !== "undefined";

    if (hasMin || hasMax) {
      const min = hasMin ? Math.max(0, Number(priceMin)) : undefined;
      const max = hasMax ? Math.max(0, Number(priceMax)) : undefined;

      if (hasMin && Number.isNaN(min)) {
        return res.status(400).json({ message: "priceMin must be a number" });
      }
      if (hasMax && Number.isNaN(max)) {
        return res.status(400).json({ message: "priceMax must be a number" });
      }
      if (hasMin && hasMax && max < min) {
        return res
          .status(400)
          .json({ message: "priceMax cannot be less than priceMin" });
      }

      if (hasMin) set.price_min = min;
      if (hasMax) set.price_max = max;
    }

    const update = {
      $set: set,
      // Defaults only when inserting a new doc
      $setOnInsert: {
        price_min: 0,
        price_max: 500000,
        is_active: true,
      },
    };

    const margin = await CategoryMargin.findOneAndUpdate(
      { category_id: categoryId },
      update,
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return res.status(200).json({ message: "Margin upserted", data: margin });
  } catch (err) {
    console.error("upsertCategoryMargin error:", err);
    return res
      .status(500)
      .json({ message: "Internal error", error: err.message });
  }
};

module.exports = {
  pendingProductsList,
  approvedProducts,
  upsertCategoryMargin,
};

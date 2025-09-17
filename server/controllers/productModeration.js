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

    const hasMin = typeof priceMin !== "undefined";
    const hasMax = typeof priceMax !== "undefined";
    if (hasMin || hasMax) {
      const min = hasMin ? Math.max(0, Number(priceMin)) : undefined;
      const max = hasMax ? Math.max(0, Number(priceMax)) : undefined;

      if (hasMin && Number.isNaN(min))
        return res.status(400).json({ message: "priceMin must be a number" });
      if (hasMax && Number.isNaN(max))
        return res.status(400).json({ message: "priceMax must be a number" });
      if (hasMin && hasMax && max < min)
        return res
          .status(400)
          .json({ message: "priceMax cannot be less than priceMin" });

      if (hasMin) set.price_min = min;
      if (hasMax) set.price_max = max;
    }

    const update = {};
    if (Object.keys(set).length) update.$set = set;

    const margin = await CategoryMargin.findOneAndUpdate(
      { category_id: categoryId },
      update,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true, // 👈 let schema defaults fill price_min/max/is_active on insert
        context: "query", // good practice for min/max validators on update
      }
    ).lean();

    return res.status(200).json({ message: "Margin upserted", data: margin });
  } catch (err) {
    console.error("upsertCategoryMargin error:", err);
    return res
      .status(500)
      .json({ message: "Internal error", error: err.message });
  }
};


const listCategoryMargins = async (req, res) => {
  try {
    const isActive = req.query.isActive ?? "";
    const q = (req.query.q || "").trim().toLowerCase();
    const sortBy = req.query.sortBy || "category_name";
    const order = req.query.order === "asc" ? "asc" : "desc";
    const dir = order === "asc" ? 1 : -1;

    // 1) fetch all categories (only what we need)
    const cats = await Category.find({}, { _id: 1, name: 1, level: 1 }).lean();

    // maps
    const byId = new Map(cats.map(c => [String(c._id), c]));
    const childrenMap = new Map(cats.map(c => [String(c._id), []]));
    for (const c of cats) {
      const parentId = String(c.level);
      const selfId = String(c._id);
      if (parentId !== selfId) {
        (childrenMap.get(parentId) || []).push(c);
      }
    }
    const roots = cats.filter(c => String(c.level) === String(c._id));

    // 2) fetch all margins and index by category_id
    const marginFilter = {};
    if (isActive === "true" || isActive === "false") {
      marginFilter.is_active = isActive === "true";
    }
    const margins = await CategoryMargin.find(marginFilter).lean();
    const marginByCatId = new Map(margins.map(m => [String(m.category_id), m]));

    // 3) build result: one object per PARENT (root cat)
    const nodes = roots.map(root => {
      const rootMargin = marginByCatId.get(String(root._id)) || null;

      // children rows
      let childRows = (childrenMap.get(String(root._id)) || []).map(ch => {
        const m = marginByCatId.get(String(ch._id)) || null;
        return {
          category_id: ch._id,
          category_name: ch.name,
          parent_id: root._id,
          parent_name: root.name,
          // flatten margin fields (null-safe)
          margin_id: m?._id || null,
          sp_percent: m?.sp_percent ?? null,
          mrp_percent: m?.mrp_percent ?? null,
          price_min: m?.price_min ?? null,
          price_max: m?.price_max ?? null,
          is_active: m?.is_active ?? null,
          createdAt: m?.createdAt ?? null,
          updatedAt: m?.updatedAt ?? null,
        };
      });

      // optional search (matches parent or any child)
      if (q) {
        const matchParent = root.name.toLowerCase().includes(q);
        childRows = childRows.filter(r =>
          matchParent ||
          (r.category_name || "").toLowerCase().includes(q)
        );
        if (!matchParent && childRows.length === 0) {
          // if search doesn’t hit parent or any child, drop this parent; handled below by filtering
        }
      }

      // optional sort children by a margin field or by name
      const val = (r, key) => {
        switch (key) {
          case "sp_percent":  return r.sp_percent ?? -Infinity;
          case "mrp_percent": return r.mrp_percent ?? -Infinity;
          case "price_min":   return r.price_min ?? -Infinity;
          case "price_max":   return r.price_max ?? -Infinity;
          case "category_name": default:
            return (r.category_name || "").toLowerCase();
        }
      };
      childRows.sort((a, b) => {
        const av = val(a, sortBy);
        const bv = val(b, sortBy);
        if (typeof av === "string" && typeof bv === "string") {
          return av.localeCompare(bv) * dir;
        }
        return (av - bv) * dir;
      });

      return {
        parent_id: root._id,
        parent_name: root.name,
        // include parent’s own margin (if set)
        parent_margin: rootMargin
          ? {
              margin_id: rootMargin._id,
              sp_percent: rootMargin.sp_percent ?? null,
              mrp_percent: rootMargin.mrp_percent ?? null,
              price_min: rootMargin.price_min ?? null,
              price_max: rootMargin.price_max ?? null,
              is_active: rootMargin.is_active ?? null,
              createdAt: rootMargin.createdAt ?? null,
              updatedAt: rootMargin.updatedAt ?? null,
            }
          : null,
        children: childRows,
      };
    });

    // filter out parents with no matching children when q is provided
    const data = q ? nodes.filter(n => n.children.length > 0 || n.parent_name.toLowerCase().includes(q)) : nodes;

    // sort parents alphabetically
    data.sort((a, b) => a.parent_name.localeCompare(b.parent_name));

    return res.json({
      message: "OK",
      data,
      totalParents: data.length,
      filters: { isActive, q, sortBy, order },
    });
  } catch (err) {
    console.error("listCategoryMarginsTree error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

module.exports = {
  pendingProductsList,
  approvedProducts,
  upsertCategoryMargin,
  listCategoryMargins
};

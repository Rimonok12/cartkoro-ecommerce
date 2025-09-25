// server/scripts/indexer.js

// terminal 1: node server
// terminal 2: ./meilisearch --master-key "4f39a098a1205b949354258089e3a982"
// terminal 3: npm run index:seed

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "env.production") });

const mongoose = require("mongoose");
const meili = require("../config/meili");
const fetch = require("cross-fetch");
const { Category, Brand, Product, ProductSku } = require("../models/productModels");

const {
  MEILI_INDEX = "products_prod", // choose dev/prod via env
  MONGO_URI,
  MEILI_HOST,
  MEILI_MASTER_KEY,
} = process.env;

if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }
if (!MEILI_HOST || !MEILI_MASTER_KEY) { console.error("Missing MEILI_HOST/MEILI_MASTER_KEY"); process.exit(1); }

async function connectMongo() {
  await mongoose.connect(MONGO_URI, { autoIndex: false });
  console.log("MongoDB connected (indexer)");
}

/* ---------- Task helpers (HTTP polling) ---------- */
async function waitForTaskHttp(taskUid, { timeoutMs = 120000, intervalMs = 800 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${MEILI_HOST.replace(/\/$/, "")}/tasks/${taskUid}`, {
      headers: {
        Authorization: `Bearer ${MEILI_MASTER_KEY}`,
        "X-Meili-API-Key": MEILI_MASTER_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`GET /tasks/${taskUid} failed: ${res.status}`);
    const task = await res.json();
    if (task.status === "succeeded" || task.status === "failed") return task;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Task ${taskUid} did not finish within ${timeoutMs}ms`);
}
async function waitForUpdateIdHttp(indexName, updateId, { timeoutMs = 120000, intervalMs = 800 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${MEILI_HOST.replace(/\/$/, "")}/indexes/${indexName}/updates/${updateId}`, {
      headers: {
        Authorization: `Bearer ${MEILI_MASTER_KEY}`,
        "X-Meili-API-Key": MEILI_MASTER_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`GET /indexes/${indexName}/updates/${updateId} failed: ${res.status}`);
    const upd = await res.json();
    if (upd.status === "processed" || upd.status === "failed") return upd;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Update ${updateId} did not finish within ${timeoutMs}ms`);
}
async function waitForEnqueued(enqueued) {
  if (!enqueued) return;
  if (typeof enqueued.taskUid  === "number") return waitForTaskHttp(enqueued.taskUid);
  if (typeof enqueued.uid      === "number") return waitForTaskHttp(enqueued.uid);
  if (typeof enqueued.updateId === "number") return waitForUpdateIdHttp(MEILI_INDEX, enqueued.updateId);
}

/* ---------- Helpers ---------- */
function entriesFromMaybeMap(maybeMap) {
  if (!maybeMap) return [];
  if (maybeMap instanceof Map) return Array.from(maybeMap.entries());
  if (typeof maybeMap === "object") return Object.entries(maybeMap);
  return [];
}
function extractColorFromDetails(details) {
  const arr = Array.isArray(details) ? details : [];
  const keys = ["color", "colour", "brand color"];
  const hit = arr.find(d => keys.includes(String(d?.key || "").toLowerCase()));
  return hit?.value ? [String(hit.value)] : [];
}
function sizeFromVariantValues(vv) {
  for (const [k, v] of entriesFromMaybeMap(vv)) {
    if (String(k).toLowerCase().includes("size") && v) return String(v);
  }
  return null;
}
function inStock(s) {
  return (s.initial_stock || 0) - (s.sold_stock || 0) > 0;
}

/* ---------- Index settings ---------- */
async function upsertSettings() {
  const task = await meili.index(MEILI_INDEX).updateSettings({
    // we now index one doc per SKU, but search remains on product metadata
    searchableAttributes: ["title", "brand", "description", "categories", "colors"],

    // filters still work at SKU level
    filterableAttributes: ["brand", "categories", "colors", "size", "price", "inStock"],

    sortableAttributes: ["price", "updatedAt", "createdAt"],

    typoTolerance: {
      enabled: true,
      disableOnAttributes: [],
      disableOnWords: [],
      minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 }
    },

    // handy synonyms
    synonyms: { tee: ["t-shirt", "tshirt"], sneakers: ["shoes"] },
  });
  await waitForEnqueued(task);
}

/* ---------- Main: ONE DOCUMENT PER ACTIVE SKU (id = sku._id) ---------- */
async function main() {
  await connectMongo();

  try {
    // primaryKey remains "id" but it stores SKU id now
    const createRes = await meili.createIndex(MEILI_INDEX, { primaryKey: "id" });
    await waitForEnqueued(createRes);
  } catch (_) {}

  await upsertSettings();

  // Clear to avoid stale product-level docs
  try {
    const clear = await meili.index(MEILI_INDEX).deleteAllDocuments();
    await waitForEnqueued(clear);
  } catch (_) {}

  // Preload lookups
  const distinctBrandIds = await Product.distinct("brandId");
  const distinctCategoryIds = await Product.distinct("category_id");

  const brands = await Brand.find(
    { _id: { $in: distinctBrandIds } }, { name: 1 }
  ).lean();
  const brandMap = new Map(brands.map(b => [String(b._id), b.name]));

  const cats = await Category.find(
    { _id: { $in: distinctCategoryIds } }, { name: 1 }
  ).lean();
  const categoryMap = new Map(cats.map(c => [String(c._id), c.name]));

  // Index every ACTIVE SKU as its own document
  const cursor = Product.find({}, null, { lean: true }).cursor();

  const BATCH = 800;
  let batch = [];
  let count = 0;

  for await (const p of cursor) {
    // fetch ACTIVE skus only
    const skus = await ProductSku.find(
      { product_id: p._id, status: 1 }, // 👈 active only
      null,
      { lean: true }
    );

    if (!skus.length) continue;

    const base = {
      productId: String(p._id),                                  // helpful to group later
      title: p.name,
      description: p.description || "",
      brand: p.brandId ? (brandMap.get(String(p.brandId)) || "") : "",
      categories: p.category_id ? [categoryMap.get(String(p.category_id))].filter(Boolean) : [],
      colors: extractColorFromDetails(p.details),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    for (const s of skus) {
      // choose a price for THIS sku
      const price = [s.SP, s.MRP, s.seller_sp].find(v => typeof v === "number" && v >= 0) ?? null;

      const doc = {
        id: String(s._id),                // 👈 SKU id is the document id
        ...base,
        skuId: String(s._id),             // duplicate for convenience
        thumbnail: s.thumbnail_img || null,
        size: sizeFromVariantValues(s.variant_values), // single size for this SKU
        price,
        inStock: inStock(s),
      };

      // optional: skip SKUs with no price/thumbnail if you want only purchasable suggestions
      // if (doc.price == null || !doc.thumbnail) continue;

      batch.push(doc);
      if (batch.length >= BATCH) {
        const task = await meili.index(MEILI_INDEX).addDocuments(batch);
        await waitForEnqueued(task);
        count += batch.length;
        console.log(`Indexed ${count}…`);
        batch = [];
      }
    }
  }

  if (batch.length) {
    const task = await meili.index(MEILI_INDEX).addDocuments(batch);
    await waitForEnqueued(task);
    count += batch.length;
  }

  console.log(`✅ Indexed ${count} SKU-docs into ${MEILI_INDEX}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

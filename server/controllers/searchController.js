// server/controllers/searchController.js
const meili = require("../config/meili");
const path = require("path");
const { spawn } = require("child_process");

const meiliIndex = () => meili.index(process.env.MEILI_INDEX);


const healthCheck = async (_req, res) => {
  try {
    const h = await meili.health();
    res.json({ ok: true, meili: h });
  } catch (err) {
    console.error("healthCheck error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};


const seedMeili = async (req, res) => {
  try {
    const envChoice = (req.query.env || "dev").toLowerCase();
    const ENV_FILE =
      envChoice === "prod" ? "env.production" : ".env";

    const serverRoot = path.resolve(__dirname, "..");          // .../server
    const scriptPath = path.join(serverRoot, "scripts", "indexer.js");

    // Run: node -r dotenv/config scripts/indexer.js
    const child = spawn(
      process.execPath,
      ["-r", "dotenv/config", scriptPath],
      {
        cwd: serverRoot,
        env: { ...process.env, ENV_FILE },  // pass selector down
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    res.write(`Seeding started (env=${envChoice}, ENV_FILE=${ENV_FILE})...\n\n`);

    child.stdout.on("data", (d) => res.write(d.toString()));
    child.stderr.on("data", (d) => res.write(d.toString()));

    child.on("close", (code) => {
      res.write(`\n---\nSeeder exited with code ${code}\n`);
      res.end();
    });
  } catch (err) {
    console.error("seedMeili error:", err);
    res.status(err.status || 500).send(err.message || "Seeding failed");
  }
};


const searchProducts = async (req, res) => {
  try {
    const {
      q = "",
      page = "1",
      hitsPerPage = "12",
      brand,
      category,
      color,
      size,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const filters = [];
    if (brand)    filters.push(`brand = "${String(brand)}"`);
    if (category) filters.push(`categories = "${String(category)}"`);
    if (color)    filters.push(`colors = "${String(color)}"`);
    if (size)     filters.push(`size = "${String(size)}"`);         // 👈 single-size per SKU now
    if (minPrice) filters.push(`price >= ${Number(minPrice)}`);
    if (maxPrice) filters.push(`price <= ${Number(maxPrice)}`);

    const result = await meiliIndex().search(String(q), {
      filter: filters.length ? filters : undefined,
      limit: Number(hitsPerPage),
      offset: (Number(page) - 1) * Number(hitsPerPage),
      sort: sort ? [String(sort)] : undefined,
      attributesToHighlight: ["title", "description"],
      attributesToRetrieve: [
        "id",            // 👈 SKU id (doc id)
        "skuId",         // duplicate, if you prefer this on FE
        "productId",
        "title",
        "brand",
        "categories",
        "price",
        "thumbnail"
      ],
    });

    res.json({
      hits: result.hits,
      total: result.estimatedTotalHits,
      page: Number(page),
      hitsPerPage: Number(hitsPerPage),
    });
  } catch (err) {
    console.error("searchProducts error:", err);
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};


module.exports = { healthCheck, seedMeili, searchProducts };

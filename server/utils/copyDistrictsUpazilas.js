// utils/copyDistrictsUpazilas.js
const { MongoClient } = require("mongodb");

async function copyDistrictsAndUpazilas() {
  const URI = process.env.MONGO_URI; // points to your cluster
  const SOURCE_DB = "test";
  const TARGET_DB = "ecommerce_prod";

  if (!URI) throw new Error("❌ MONGO_URI is required in .env");

  const client = new MongoClient(URI);
  await client.connect();

  const src = client.db(SOURCE_DB);
  const dst = client.db(TARGET_DB);

  const srcDistricts = src.collection("districts");
  const srcUpazilas = src.collection("upazilas");
  const dstDistricts = dst.collection("districts");
  const dstUpazilas = dst.collection("upazilas");

  try {
    console.log(`🔗 Copying from '${SOURCE_DB}' ➜ '${TARGET_DB}'`);

    // --- Copy districts
    const districts = await srcDistricts.find({}).toArray();
    console.log(`📦 Found ${districts.length} districts`);

    // strip _id so MongoDB generates new ones
    const districtsNoId = districts.map(({ _id, ...rest }) => rest);
    const insertRes = await dstDistricts.insertMany(districtsNoId);

    // map oldId -> newId
    const districtIdMap = new Map();
    districts.forEach((d, i) => {
      districtIdMap.set(String(d._id), insertRes.insertedIds[i]);
    });

    // --- Copy upazilas with remapped district_id
    const upazilas = await srcUpazilas.find({}).toArray();
    console.log(`📦 Found ${upazilas.length} upazilas`);

    const upazilasNoId = upazilas.map(({ _id, ...rest }) => {
      rest.district_id = districtIdMap.get(String(rest.district_id));
      return rest;
    });

    await dstUpazilas.insertMany(upazilasNoId);
    console.log("✅ Finished copying districts & upazilas");
  } finally {
    await client.close();
  }
}

module.exports = copyDistrictsAndUpazilas;

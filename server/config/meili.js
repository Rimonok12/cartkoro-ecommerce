// server/config/meili.js
const { MeiliSearch } = require('meilisearch');
require('dotenv').config();

const { MEILI_HOST, MEILI_MASTER_KEY } = process.env;
if (!MEILI_HOST || !MEILI_MASTER_KEY) {
  throw new Error('Missing MEILI_HOST or MEILI_MASTER_KEY env.');
}

const meili = new MeiliSearch({
  host: MEILI_HOST,
  apiKey: MEILI_MASTER_KEY,
});

module.exports = meili;



// import { MeiliSearch } from 'meilisearch'
// import { MongoClient } from 'mongodb'
// import dotenv from 'dotenv'
// dotenv.config()

// const {
//   MEILI_HOST,
//   MEILI_MASTER_KEY,
//   MEILI_INDEX,
//   MONGO_URI,
//   MONGO_DB,
//   MONGO_COLLECTION
// } = process.env

// const meili = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_MASTER_KEY })

// async function main() {
//   const client = new MongoClient(MONGO_URI)
//   await client.connect()
//   const db = client.db(MONGO_DB)
//   const col = db.collection(MONGO_COLLECTION)

//   const docs = await col.find({}).toArray()
//   const payload = docs.map(d => ({
//     id: String(d._id),
//     title: d.title,
//     brand: d.brand,
//     description: d.description,
//     price: d.price,
//     categories: d.categories || [],
//     colors: d.colors || [],
//     sizes: d.sizes || [], // for S/M/L single-letter
//     inStock: !!d.inStock
//   }))

//   try { await meili.createIndex(MEILI_INDEX, { primaryKey: 'id' }) } catch {}

//   await meili.index(MEILI_INDEX).updateSettings({
//     searchableAttributes: ['title', 'brand', 'description'],
//     filterableAttributes: ['brand', 'categories', 'colors', 'sizes', 'price', 'inStock'],
//     sortableAttributes: ['price']
//   })

//   await meili.index(MEILI_INDEX).addDocuments(payload)
//   console.log('Products indexed into Meilisearch')
//   await client.close()
// }

// main().catch(console.error)

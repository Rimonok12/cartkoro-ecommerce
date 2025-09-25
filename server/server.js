const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
// Load env
dotenv.config();

const connectMongo = require("./config/mongodb");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const orderRoute = require("./routes/orderRoute");
const generalRoute = require("./routes/generalRoute");


const app = express();

const allowedOrigins = process.env.NEXT_HOST.split(",");
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(helmet());
app.use(express.json());

// Connect DB
connectMongo();

// Routes
app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/order", orderRoute);
app.use("/api/general", generalRoute);

// Health check
app.get("/", (req, res) => res.send("🚀 Portfolio API is running"));

const PORT = process.env.PORT || 8000;
const configIdentity = process.env.CONFIG_IDENTITY;

app.listen(PORT, () => {
  console.log(`config identity is ${configIdentity}`);
  console.log(`Server started on port ${PORT}`);
});


// copying from local to prod
// app.listen(PORT, async () => {
//   console.log(`config identity is ${configIdentity}`);
//   console.log(`🚀 Server started on port ${PORT}`);

//   try {
//     await copyDistrictsAndUpazilas();
//     console.log("🎉 Data copied successfully");
//   } catch (err) {
//     console.error("❌ Copy failed:", err.message);
//   }
// });




// {
//   "name": "server",
//   "version": "1.0.0",
//   "main": "index.js",
//   "scripts": {
//     "test": "echo \"Error: no test specified\" && exit 1"
//   },
//   "author": "",
//   "license": "ISC",
//   "description": "",
//   "dependencies": {
//     "axios": "^1.12.0",
//     "bcrypt": "^6.0.0",
//     "cookie-parser": "^1.4.7",
//     "cors": "^2.8.5",
//     "cross-fetch": "^4.1.0",
//     "crypto": "^1.0.1",
//     "dotenv": "^17.2.1",
//     "express": "^5.1.0",
//     "helmet": "^8.1.0",
//     "ioredis": "^5.7.0",
//     "jsonwebtoken": "^9.0.2",
//     "meilisearch": "^0.53.0",
//     "mongodb": "^6.20.0",
//     "mongoose": "^8.17.0",
//     "pg": "^8.16.3"
//   }
// }




// const bcrypt = require("bcrypt");
// const { hashToken } = require("../utils/hash");
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   verifyAccessToken,
//   verifyRefreshToken,
// } = require("../utils/jwt");
// const {
//   User,
//   CustomerOtp,
//   Reference,
//   Cart,
//   Cashback,
//   UserSession,
// } = require("../models/userModels");
// const { Order } = require("../models/orderModels.js");
// const {
//   setHash,
//   getHash,
//   getAllHash,
//   delKey,
//   hashExists,
//   raw: redis,
// } = require("../config/redisClient");

// // Send OTP
// const generateOtp = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     if (!phone || !/^\d{11}$/.test(phone)) {
//       return res.status(400).json({ error: "Invalid phone number" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

//     await CustomerOtp.findOneAndUpdate(
//       { phone },
//       { otp, expires_at: expiresAt },
//       { upsert: true, new: true }
//     );

//     // TODO: send SMS here

//     res.status(200).json({ otp: otp, message: "OTP sent successfully" });
//   } catch (err) {
//     console.error("generateOtp error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // Verify OTP and login
// const verifyOtp = async (req, res) => {
//   try {
//     const { phone, otp } = req.body;
//     console.log("phone, otp ::", phone, otp);
//     if (!phone || !otp)
//       return res.status(400).json({ error: "Phone and OTP required" });

//     const record = await CustomerOtp.findOne({ phone, otp });
//     if (!record) return res.status(400).json({ error: "Invalid OTP" });
//     if (record.expires_at < new Date())
//       return res.status(400).json({ error: "OTP expired" });

//     let user = await User.findOne({ phone_number: phone, status: 1 });
//     let isNewUser = false;

//     if (!user) {
//       user = await User.create({ phone_number: phone, status: 1 });
//       isNewUser = true;
//     } else if (!user.full_name?.trim()) {
//       isNewUser = true;
//     }

//     await CustomerOtp.deleteOne({ _id: record._id });

//     const payload = {
//       userId: user._id,
//       phone: user.phone_number,
//       is_admin: user.is_admin,
//     };
//     const accessToken = generateAccessToken(payload);
//     const refreshToken = generateRefreshToken(payload);
//     const hashedRefreshToken = hashToken(refreshToken);

//     let firstName = user.full_name
//       ? user.full_name.trim().split(/\s+/)[0].toUpperCase()
//       : "USER";
//     if (firstName.length > 10) firstName = firstName.substring(0, 10);

//     const userKey = `user:${user._id}`;
//     const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);

//     // -- Refresh Token Redis Key --
//     await redis.set(
//       `${process.env.REDIS_PREFIX}user:${user._id}:rt:${hashedRefreshToken}`,
//       user._id.toString(),
//       "EX",
//       EXPIRY_SEC
//     );

//     // -- Profile: only set if not already in Redis --
//     const profileExists = await hashExists(userKey, "profile");
//     if (!profileExists) {
//       await setHash(
//         userKey,
//         "profile",
//         { firstName, is_admin: user.is_admin },
//         EXPIRY_SEC
//       );
//     }

//     // -- Cart: move to Redis if cart not already set --
//     const cartExists = await hashExists(userKey, "cart");

//     if (!cartExists) {
//       const existingCart = await Cart.findOne({ user_id: user._id }).lean();
//       const cartItems = Array.isArray(existingCart?.items)
//         ? existingCart.items
//         : [];

//       await setHash(userKey, "cart", { items: cartItems }, EXPIRY_SEC);
//       await Cart.deleteOne({ user_id: user._id });
//     }

//     // -- Recent Address: only set if not already present --
//     const recentAddressExists = await hashExists(userKey, "recentAddress");
//     if (!recentAddressExists) {
//       const lastOrder = await Order.findOne({ user_id: user._id })
//         .sort({ createdAt: -1 })
//         .select({ shipping_address_id: 1 })
//         .lean();

//       if (!lastOrder?.shipping_address_id) {
//         await delHash(userKey, "recentAddress").catch(() => {});
//       } else {
//         const idToStore = lastOrder.shipping_address_id;
//         await setHash(
//           userKey,
//           "recentAddress",
//           { id: String(idToStore) },
//           EXPIRY_SEC
//         );
//       }
//     }

//     // -- Cashback: if new user, ensure wallet exists --
//     if (isNewUser) {
//       await Cashback.updateOne(
//         { user_id: user._id },
//         { $setOnInsert: { amount: 50 } },
//         { upsert: true }
//       );
//     }

//     const cashbackExists = await hashExists(userKey, "cashback");
//     if (!cashbackExists) {
//       const existingCashback = await Cashback.findOne({
//         user_id: user._id,
//       }).lean();
//       const cashbackAmount = Number(existingCashback?.amount) || 0;
//       await setHash(userKey, "cashback", cashbackAmount, EXPIRY_SEC);
//     }

//     // -- Set Refresh Token Cookie --
//     res.cookie("CK-REF-T", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       path: "/",
//       maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
//     });

//     // -- Response --
//     res.status(200).json({
//       accessToken,
//       userId: user._id,
//       firstName,
//       newUser: isNewUser,
//     });
//   } catch (err) {
//     console.error("verifyOtp error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // ------------------- REFRESH TOKEN -------------------
// const refresh = async (req, res) => {
//   try {
//     const rawToken = req.cookies["CK-REF-T"];
//     if (!rawToken) return res.status(401).json({ error: "No refresh token" });

//     const payload = verifyRefreshToken(rawToken);
//     const hashedToken = hashToken(rawToken);

//     const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;

//     const exists = await redis.exists(refreshTokenKey);
//     if (!exists) {
//       return res
//         .status(401)
//         .json({ error: "Invalid or expired refresh token" });
//     }
//     const updatedPayload = {
//       userId: payload.userId,
//       phone: payload.phone,
//       is_admin: payload.is_admin,
//     };
//     const newAccessToken = generateAccessToken(updatedPayload);

//     res.json({ accessToken: newAccessToken });
//   } catch (err) {
//     console.error("refreshToken error:", err);
//     res.status(403).json({ error: "Invalid or expired refresh token" });
//   }
// };

// // ------------------- LOGOUT -------------------
// const logout = async (req, res) => {
//   try {
//     const rawToken = req.cookies["CK-REF-T"];

//     // Clear cookie no matter what, to be user-friendly
//     res.clearCookie("CK-REF-T", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       path: "/",
//     });

//     if (!rawToken) {
//       return res.status(200).json({ message: "Logged out" });
//     }

//     const payload = verifyRefreshToken(rawToken);
//     if (payload?.userId) {
//       const userKey = `user:${payload.userId}`;
//       const cachedData = await getAllHash(userKey);

//       // Parse cart from Redis (Redis hash values are strings)
//       let parsedCart =
//         typeof cachedData.cart === "string"
//           ? JSON.parse(cachedData.cart)
//           : cachedData.cart;

//       // Only persist if we have a valid items array
//       if (parsedCart && Array.isArray(parsedCart.items)) {
//         const existingCart = await Cart.findOne({ user_id: payload.userId });
//         if (existingCart) {
//           existingCart.items = parsedCart.items;
//           await existingCart.save();
//         } else {
//           await Cart.create({
//             user_id: payload.userId,
//             items: parsedCart.items,
//           });
//         }
//       }

//       // clear redis
//       await delKey(`user:${payload.userId}`).catch(() => {});

//       const hashedToken = hashToken(rawToken);
//       const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;
//       await redis.del(refreshTokenKey);
//     }

//     return res.json({ message: "Logged out successfully" });
//   } catch (err) {
//     console.error("logout error:", err);
//     // Cookie was already cleared above; still return 200 to avoid trapping the user
//     return res.status(200).json({ message: "Logged out" });
//   }
// };

// // ------------------USER's REDIS DATA--------------------
// const getUserRedisData = async (req, res) => {
//   try {
//     const rawToken = req.cookies["CK-REF-T"];
//     if (!rawToken) return res.status(401).json({ error: "No refresh token" });

//     const payload = verifyRefreshToken(rawToken);

//     const userKey = `user:${payload.userId}`;
//     let cachedData = await getAllHash(userKey);

//     if (!cachedData || Object.keys(cachedData).length === 0) {
//       const hashedToken = hashToken(rawToken);
//       const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;

//       const exists = await redis.exists(refreshTokenKey);

//       if (!exists) {
//         res.clearCookie("CK-REF-T", {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "strict",
//           path: "/",
//         });
//         if (payload?.userId) {
//           const userKey = `user:${payload.userId}`;
//           const cachedData = await getAllHash(userKey);

//           // Parse cart from Redis (Redis hash values are strings)
//           let parsedCart =
//             typeof cachedData.cart === "string"
//               ? JSON.parse(cachedData.cart)
//               : cachedData.cart;

//           // Only persist if we have a valid items array
//           if (parsedCart && Array.isArray(parsedCart.items)) {
//             const existingCart = await Cart.findOne({
//               user_id: payload.userId,
//             });
//             if (existingCart) {
//               existingCart.items = parsedCart.items;
//               await existingCart.save();
//             } else {
//               await Cart.create({
//                 user_id: payload.userId,
//                 items: parsedCart.items,
//               });
//             }
//           }

//           // clear redis
//           await delKey(`user:${payload.userId}`).catch(() => {});
//           await redis.del(refreshTokenKey);
//         }
//         return res.status(401).json({ error: "No cache found for this user" });
//       }

//       // profile cache set-----
//       let user = await User.findOne({ phone_number: payload.phone, status: 1 });
//       let firstName = user.full_name
//         ? user.full_name.trim().split(/\s+/)[0].toUpperCase()
//         : "USER";
//       if (firstName.length > 10) firstName = firstName.substring(0, 10);

//       const userKey = `user:${user._id}`;
//       const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);
//       await setHash(
//         userKey,
//         "profile",
//         { firstName, is_admin: user.is_admin },
//         EXPIRY_SEC
//       );

//       // cart cache set------
//       const existingCart = await Cart.findOne({ user_id: user._id }).lean();
//       const cartItems = Array.isArray(existingCart?.items)
//         ? existingCart.items
//         : [];

//       await setHash(userKey, "cart", { items: cartItems }, EXPIRY_SEC);
//       await Cart.deleteOne({ user_id: user._id });

//       // address cache set----
//       const lastOrder = await Order.findOne({ user_id: user._id })
//         .sort({ createdAt: -1 })
//         .select({ shipping_address_id: 1 })
//         .lean();

//       if (!lastOrder?.shipping_address_id) {
//         await delHash(userKey, "recentAddress").catch(() => {});
//       }
//       const idToStore = lastOrder.shipping_address_id;
//       await setHash(
//         userKey,
//         "recentAddress",
//         { id: String(idToStore) },
//         EXPIRY_SEC
//       );

//       // cashback Cache set----
//       const existingCashback = await Cashback.findOne({
//         user_id: user._id,
//       }).lean();
//       const cashbackAmount = Number(existingCashback?.amount) || 0;
//       await setHash(userKey, "cashback", cashbackAmount, EXPIRY_SEC);

//       cachedData = await getAllHash(userKey);
//     }
//     res.status(200).json(cachedData);
//   } catch (err) {
//     console.error("getUserRedisData error::", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ------------------REGISTER--------------------
// const register = async (req, res) => {
//   try {
//     const { full_name, email, phone_number, referrerCode } = req.body;

//     const existingUser = await User.findOne({ phone_number, status: 1 });
//     if (!existingUser) {
//       return res
//         .status(400)
//         .json({ error: "User not found. Please verify OTP first." });
//     }

//     // Proper firstName
//     let firstName = (full_name || "USER").trim().split(/\s+/)[0].toUpperCase();
//     if (firstName.length > 10) firstName = firstName.substring(0, 10);

//     // Create or reuse referral code
//     const referralCode =
//       existingUser.referral_code ||
//       `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;

//     // Update core user fields
//     const updatedUser = await User.findByIdAndUpdate(
//       existingUser._id,
//       {
//         full_name: full_name || existingUser.full_name,
//         email: email || existingUser.email,
//         referral_code: referralCode,
//       },
//       { new: true }
//     );

//     // Optional: handle referral
//     if (referrerCode) {
//       const referrer = await User.findOne({
//         referral_code: referrerCode,
//         status: 1,
//       });
//       if (!referrer) {
//         return res.status(400).json({ error: "Referral Code is Incorrect" });
//       }
//       const alreadyReferred = await Reference.findOne({
//         referred_id: existingUser._id,
//       });
//       if (!alreadyReferred) {
//         await Reference.create({
//           referred_id: existingUser._id,
//           referred_by: referrer._id,
//           status: 0,
//         });
//       }
//     }

//     // 🔴 CRITICAL: Update Redis profile so UI shows new name immediately
//     const userKey = `user:${updatedUser._id}`;
//     const EXPIRY_SEC = 60 * 24 * 60 * 60;
//     await setHash(
//       userKey,
//       "profile",
//       { firstName, is_admin: !!updatedUser.is_admin },
//       EXPIRY_SEC
//     );

//     // You don’t need to touch cart/cashback here.

//     // Respond with fresh display fields
//     res.status(200).json({
//       userId: updatedUser._id,
//       referralCode,
//       firstName,
//     });
//   } catch (err) {
//     console.error("register error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // detailed data___________________________________________

// const getProfileData = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const user = await User.findOne({ _id: userId, status: 1 })
//       .select("full_name phone_number email")
//       .lean();

//     if (!user) return res.status(404).json({ error: "User not found" });

//     return res.status(200).json({
//       full_name: user.full_name,
//       phone: user.phone_number,
//       email: user.email,
//     });
//   } catch (err) {
//     console.error("getProfileData error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// const updateProfileData = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { full_name, email } = req.body || {};
//     const nameStr = String(full_name || "").trim();
//     const emailStr = String(email || "")
//       .trim()
//       .toLowerCase();

//     await User.findOneAndUpdate(
//       { _id: userId, status: 1 },
//       { $set: { full_name: nameStr, email: emailStr } },
//       { new: true, runValidators: true }
//     );

//     return res.status(200).json({
//       message: "Profile updated successfully",
//     });
//   } catch (err) {
//     console.error("updateProfileData error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// module.exports = {
//   generateOtp,
//   verifyOtp,
//   refresh,
//   logout,
//   register,
//   getUserRedisData,
//   getProfileData,
//   updateProfileData,
// };

//////////////

const bcrypt = require("bcrypt");
const { hashToken } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const {
  User,
  CustomerOtp,
  Reference,
  Cart,
  Cashback,
  UserSession,
} = require("../models/userModels");
const { Order } = require("../models/orderModels.js");
const {
  setHash,
  getHash,
  getAllHash,
  delKey,
  hashExists,
  raw: redis,
} = require("../config/redisClient");
const { toIntlBD, sendSmsViaBulkSmsBD } = require("../utils/smsUtils.js");

// ---------- helper: keep only roles that are true ----------
const pickTrueRoles = (src = {}) => {
  const roles = {};
  if (src.is_super_admin) roles.is_super_admin = true;
  if (src.is_admin) roles.is_admin = true;
  if (src.is_seller) roles.is_seller = true;
  return roles;
};

// ---------- Send OTP ----------
const generateOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await CustomerOtp.findOneAndUpdate(
      { phone },
      { otp, expires_at: expiresAt },
      { upsert: true, new: true }
    );

    // ---- Send SMS via bulksmsbd ----
    const number = toIntlBD(phone);
    const message = `${otp} is OTP to login to Cartkoro. Do not share with anyone. -from Cartkoro, Happy Shopping :)`;
    try {
      const smsResp = await sendSmsViaBulkSmsBD({
        number,
        message,
      });
    } catch (smsErr) {
      console.error(
        "Failed to send OTP SMS:",
        smsErr?.response?.data || smsErr.message
      );
      return res.status(502).json({ error: "Failed to send OTP SMS" });
    }

    res.status(200).json({ otp: otp, message: "OTP sent successfully" });
  } catch (err) {
    console.error("generateOtp error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------- Verify OTP and login ----------
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    console.log("phone, otp::", phone, otp);
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone and OTP required" });

    const record = await CustomerOtp.findOne({ phone, otp });
    if (!record) return res.status(400).json({ error: "Invalid OTP" });
    if (record.expires_at < new Date())
      return res.status(400).json({ error: "OTP expired" });

    let user = await User.findOne({ phone_number: phone, status: 1 });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone_number: phone, status: 1 });
      isNewUser = true;
    } else if (!user.full_name?.trim()) {
      isNewUser = true;
    }

    await CustomerOtp.deleteOne({ _id: record._id });

    // only include true roles
    const roles = pickTrueRoles(user);

    const payload = {
      userId: user._id,
      phone: user.phone_number,
      ...roles, // only true role claims
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const hashedRefreshToken = hashToken(refreshToken);

    let firstName = user.full_name
      ? user.full_name.trim().split(/\s+/)[0].toUpperCase()
      : "USER";
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    const userKey = `user:${user._id}`;
    const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);

    // -- Refresh Token Redis Key --
    await redis.set(
      `${process.env.REDIS_PREFIX}user:${user._id}:rt:${hashedRefreshToken}`,
      user._id.toString(),
      "EX",
      EXPIRY_SEC
    );

    // -- Profile: only set if not already in Redis --
    const profileExists = await hashExists(userKey, "profile");
    if (!profileExists) {
      await setHash(
        userKey,
        "profile",
        { firstName, ...roles }, // cache only true roles
        EXPIRY_SEC
      );
    }

    // -- Cart: move to Redis if cart not already set --
    const cartExists = await hashExists(userKey, "cart");

    if (!cartExists) {
      const existingCart = await Cart.findOne({ user_id: user._id }).lean();
      const cartItems = Array.isArray(existingCart?.items)
        ? existingCart.items
        : [];

      await setHash(userKey, "cart", { items: cartItems }, EXPIRY_SEC);
      await Cart.deleteOne({ user_id: user._id });
    }

    // -- Recent Address: only set if present --
    const recentAddressExists = await hashExists(userKey, "recentAddress");
    if (!recentAddressExists) {
      const lastOrder = await Order.findOne({ user_id: user._id })
        .sort({ createdAt: -1 })
        .select({ shipping_address_id: 1 })
        .lean();

      console.log("lastOrder::", lastOrder);
      if (lastOrder?.shipping_address_id) {
        const idToStore = lastOrder.shipping_address_id;
        await setHash(
          userKey,
          "recentAddress",
          { id: String(idToStore) },
          EXPIRY_SEC
        );
      }
      // else do nothing; we intentionally don't create this field
    }

    // -- Cashback: if new user, ensure wallet exists --
    if (isNewUser) {
      await Cashback.updateOne(
        { user_id: user._id },
        { $setOnInsert: { amount: 50 } },
        { upsert: true }
      );
    }

    const cashbackExists = await hashExists(userKey, "cashback");
    if (!cashbackExists) {
      const existingCashback = await Cashback.findOne({
        user_id: user._id,
      }).lean();
      const cashbackAmount = Number(existingCashback?.amount) || 0;
      await setHash(userKey, "cashback", cashbackAmount, EXPIRY_SEC);
    }

    // -- Set Refresh Token Cookie --
    res.cookie("CK-REF-T", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
    });

    // -- Response --
    res.status(200).json({
      accessToken,
      userId: user._id,
      firstName,
      newUser: isNewUser,
      roles, // object with only true role keys; {} if none
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------- Refresh Token ----------
const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];
    if (!rawToken) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(rawToken);
    const hashedToken = hashToken(rawToken);

    console.log("refresh payload::", payload);

    const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;

    const exists = await redis.exists(refreshTokenKey);
    if (!exists) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Re-fetch current roles (reflect any changes since login)
    const dbUser = await User.findById(payload.userId)
      .select("is_super_admin is_admin is_seller phone_number")
      .lean();
    console.log("dbUser::", dbUser);
    const roles = pickTrueRoles(dbUser || {});
    const updatedPayload = {
      userId: payload.userId,
      phone: dbUser?.phone_number || payload.phone,
      ...roles,
    };
    const newAccessToken = generateAccessToken(updatedPayload);

    console.log("newAccessToken::", newAccessToken);

    res.json({ accessToken: newAccessToken, roles });
  } catch (err) {
    console.error("refreshToken error:", err);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

// ---------- Logout ----------
const logout = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];

    // Clear cookie no matter what, to be user-friendly
    res.clearCookie("CK-REF-T", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    if (!rawToken) {
      return res.status(200).json({ message: "Logged out" });
    }

    const payload = verifyRefreshToken(rawToken);
    if (payload?.userId) {
      const userKey = `user:${payload.userId}`;
      const cachedData = await getAllHash(userKey);

      // Parse cart from Redis (Redis hash values are strings)
      let parsedCart = cachedData?.cart;
      if (typeof parsedCart === "string") {
        try {
          parsedCart = JSON.parse(parsedCart);
        } catch (_) {
          parsedCart = null;
        }
      }

      // Only persist if we have a valid items array
      if (parsedCart && Array.isArray(parsedCart.items)) {
        const existingCart = await Cart.findOne({ user_id: payload.userId });
        if (existingCart) {
          existingCart.items = parsedCart.items;
          await existingCart.save();
        } else {
          await Cart.create({
            user_id: payload.userId,
            items: parsedCart.items,
          });
        }
      }

      // clear redis
      await delKey(`user:${payload.userId}`).catch(() => {});

      const hashedToken = hashToken(rawToken);
      const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;
      await redis.del(refreshTokenKey);
    }

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    // Cookie was already cleared above; still return 200 to avoid trapping the user
    return res.status(200).json({ message: "Logged out" });
  }
};

// ---------- User's Redis Data ----------
const getUserRedisData = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];
    if (!rawToken) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(rawToken);

    const userKey = `user:${payload.userId}`;
    let cachedData = await getAllHash(userKey);

    if (!cachedData || Object.keys(cachedData).length === 0) {
      const hashedToken = hashToken(rawToken);
      const refreshTokenKey = `${process.env.REDIS_PREFIX}user:${payload.userId}:rt:${hashedToken}`;

      const exists = await redis.exists(refreshTokenKey);

      if (!exists) {
        res.clearCookie("CK-REF-T", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });

        if (payload?.userId) {
          const userKey2 = `user:${payload.userId}`;
          const cachedData2 = await getAllHash(userKey2);

          // Parse cart from Redis (Redis hash values are strings)
          let parsedCart = cachedData2?.cart;
          if (typeof parsedCart === "string") {
            try {
              parsedCart = JSON.parse(parsedCart);
            } catch (_) {
              parsedCart = null;
            }
          }

          // Only persist if we have a valid items array
          if (parsedCart && Array.isArray(parsedCart.items)) {
            const existingCart = await Cart.findOne({
              user_id: payload.userId,
            });
            if (existingCart) {
              existingCart.items = parsedCart.items;
              await existingCart.save();
            } else {
              await Cart.create({
                user_id: payload.userId,
                items: parsedCart.items,
              });
            }
          }

          // clear redis
          await delKey(`user:${payload.userId}`).catch(() => {});
          await redis.del(refreshTokenKey);
        }
        return res.status(401).json({ error: "No cache found for this user" });
      }

      // Rebuild cache since refresh token exists
      let user = await User.findOne({
        phone_number: payload.phone,
        status: 1,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let firstName = user.full_name
        ? user.full_name.trim().split(/\s+/)[0].toUpperCase()
        : "USER";
      if (firstName.length > 10) firstName = firstName.substring(0, 10);

      const roles = pickTrueRoles(user);
      const EXPIRY_SEC = Number(process.env.EXPIRY_SEC);

      // profile cache set
      await setHash(userKey, "profile", { firstName, ...roles }, EXPIRY_SEC);

      // cart cache set
      const existingCart = await Cart.findOne({ user_id: user._id }).lean();
      const cartItems = Array.isArray(existingCart?.items)
        ? existingCart.items
        : [];
      await setHash(userKey, "cart", { items: cartItems }, EXPIRY_SEC);
      await Cart.deleteOne({ user_id: user._id });

      // address cache set (only if present)
      const lastOrder = await Order.findOne({ user_id: user._id })
        .sort({ createdAt: -1 })
        .select({ shipping_address_id: 1 })
        .lean();
      if (lastOrder?.shipping_address_id) {
        const idToStore = lastOrder.shipping_address_id;
        await setHash(
          userKey,
          "recentAddress",
          { id: String(idToStore) },
          EXPIRY_SEC
        );
      }

      // cashback cache set
      const existingCashback = await Cashback.findOne({
        user_id: user._id,
      }).lean();
      const cashbackAmount = Number(existingCashback?.amount) || 0;
      await setHash(userKey, "cashback", cashbackAmount, EXPIRY_SEC);

      cachedData = await getAllHash(userKey);
    }

    res.status(200).json(cachedData);
  } catch (err) {
    console.error("getUserRedisData error::", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Register ----------
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, referrerCode } = req.body;

    const existingUser = await User.findOne({ phone_number, status: 1 });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: "User not found. Please verify OTP first." });
    }

    // Proper firstName
    let firstName = (full_name || "USER").trim().split(/\s+/)[0].toUpperCase();
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    // Create or reuse referral code
    const referralCode =
      existingUser.referral_code ||
      `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;

    // Update core user fields
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      {
        full_name: full_name || existingUser.full_name,
        email: (email || existingUser.email || "").trim().toLowerCase(),
        referral_code: referralCode,
      },
      { new: true }
    );

    // Optional: handle referral
    if (referrerCode) {
      const referrer = await User.findOne({
        referral_code: referrerCode,
        status: 1,
      });
      if (!referrer) {
        return res.status(400).json({ error: "Referral Code is Incorrect" });
      }
      const alreadyReferred = await Reference.findOne({
        referred_id: existingUser._id,
      });
      if (!alreadyReferred) {
        await Reference.create({
          referred_id: existingUser._id,
          referred_by: referrer._id,
          status: 0,
        });
      }
    }

    // Update Redis profile so UI shows new name immediately (only true roles)
    const userKey = `user:${updatedUser._id}`;
    const EXPIRY_SEC = Number(process.env.EXPIRY_SEC) || 60 * 24 * 60 * 60;
    const roles = pickTrueRoles(updatedUser);
    await setHash(userKey, "profile", { firstName, ...roles }, EXPIRY_SEC);

    // Respond with fresh display fields
    res.status(200).json({
      userId: updatedUser._id,
      referralCode,
      firstName,
      roles, // only true role keys (or {})
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------- Profile (detailed data) ----------
const getProfileData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ _id: userId, status: 1 })
      .select("full_name phone_number email")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      full_name: user.full_name,
      phone: user.phone_number,
      email: user.email,
    });
  } catch (err) {
    console.error("getProfileData error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProfileData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name, email } = req.body || {};
    const nameStr = String(full_name || "").trim();
    const emailStr = String(email || "")
      .trim()
      .toLowerCase();

    await User.findOneAndUpdate(
      { _id: userId, status: 1 },
      { $set: { full_name: nameStr, email: emailStr } },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("updateProfileData error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  generateOtp,
  verifyOtp,
  refresh,
  logout,
  register,
  getUserRedisData,
  getProfileData,
  updateProfileData,
};

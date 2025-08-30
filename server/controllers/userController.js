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
const {
  setHash,
  getHash,
  getAllHash,
  delKey,
} = require("../config/redisClient");

// Send OTP
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

    // TODO: send SMS here

    res.status(200).json({ otp: otp, message: "OTP sent successfully" });
  } catch (err) {
    console.error("generateOtp error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Verify OTP and login
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const record = await CustomerOtp.findOne({ phone, otp });
    if (!record) return res.status(400).json({ error: "Invalid OTP" });
    if (record.expires_at < new Date()) return res.status(400).json({ error: "OTP expired" });

    let user = await User.findOne({ phone_number: phone, status: 1 });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone_number: phone, status: 1 });
      isNewUser = true;
    } else if (!user.full_name?.trim()) {
      isNewUser = true;
    }

    await CustomerOtp.deleteOne({ _id: record._id });

    const payload = { userId: user._id, phone: user.phone_number, is_admin: user.is_admin };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const hashedRefreshToken = hashToken(refreshToken);

    await UserSession.create({
      user_id: user._id,
      refresh_token: hashedRefreshToken,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      ip_address: req.ip,
      device_info: req.headers["user-agent"] || "Unknown Device",
    });

    res.cookie("CK-REF-T", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 24 * 60 * 60 * 1000,
    });

    // temp firstName (will be replaced by register)
    let firstName = user.full_name
      ? user.full_name.trim().split(/\s+/)[0].toUpperCase()
      : "USER";
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    const userKey = `user:${user._id}`;
    const EXPIRY_SEC = 60 * 24 * 60 * 60;

    await setHash(userKey, "profile", { firstName, is_admin: user.is_admin }, EXPIRY_SEC);

    const existingCart = await Cart.findOne({ user_id: user._id });
    await setHash(userKey, "cart", existingCart || { items: [] }, EXPIRY_SEC);
    await Cart.deleteOne({ user_id: user._id });

    const existingCashback = await Cashback.findOne({ user_id: user._id });
    await setHash(userKey, "cashback", existingCashback || { amount: 0 }, EXPIRY_SEC);

    res.status(200).json({
      accessToken,
      userId: user._id,
      firstName,
      newUser: isNewUser,
      // referral code is finalized in register()
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ------------------- REFRESH TOKEN -------------------
const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];
    if (!rawToken) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(rawToken);
    const hashedToken = hashToken(rawToken);

    const session = await UserSession.findOne({
      user_id: payload.userId,
      refresh_token: hashedToken,
      expires_at: { $gt: new Date() },
    });
    if (!session) {
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    const user = await User.findOne({ _id: payload.userId, status: 1 });
    if (!user) {
      return res.status(403).json({ error: "User not found or inactive" });
    }

    const newAccessToken = generateAccessToken({
      userId: user._id,
      phone: user.phone_number,
      is_admin: user.is_admin,
    });

    console.log("newAccessToken:::", newAccessToken)

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("refreshToken error:", err);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

// ------------------- LOGOUT -------------------
const logout = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];
    if (!rawToken) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(rawToken);

    if (payload?.userId) {
      const userKey = `user:${payload.userId}`;
      const cachedData = await getAllHash(userKey);
      console.log("logout cachedData::", cachedData);

      // Parse cart from Redis (Redis hash values are strings)
      let parsedCart = null;
      if (cachedData?.cart) {
        try {
          parsedCart = typeof cachedData.cart === "string"
            ? JSON.parse(cachedData.cart)
            : cachedData.cart;
        } catch (e) {
          console.warn("Failed to parse cached cart JSON on logout:", e);
        }
      }

      // Only persist if we have a valid items array
      if (parsedCart && Array.isArray(parsedCart.items)) {
        const existingCart = await Cart.findOne({ user_id: payload.userId });

        if (existingCart) {
          // Update JUST the items array
          existingCart.items = parsedCart.items;
          await existingCart.save();
        } else {
          // Create a new cart doc with items
          await Cart.create({
            user_id: payload.userId,
            items: parsedCart.items,
          });
        }
      }

      // clear redis
      await delKey(userKey);

      // clear refresh token from DB
      const hashedToken = hashToken(req.cookies["CK-REF-T"]);
      await UserSession.deleteOne({
        user_id: payload.userId,
        refresh_token: hashedToken,
      });
    }

    // clear cookie
    res.clearCookie("CK-REF-T", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ------------------REGISTER--------------------
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, referrerCode } = req.body;

    const existingUser = await User.findOne({ phone_number, status: 1 });
    if (!existingUser) {
      return res.status(400).json({ error: "User not found. Please verify OTP first." });
    }

    // Proper firstName
    let firstName = (full_name || "USER").trim().split(/\s+/)[0].toUpperCase();
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    // Create or reuse referral code
    const referralCode =
      existingUser.referral_code || `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;

    // Update core user fields
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      {
        full_name: full_name || existingUser.full_name,
        email: email || existingUser.email,
        referral_code: referralCode,
      },
      { new: true }
    );

    // Optional: handle referral
    if (referrerCode) {
      const referrer = await User.findOne({ referral_code: referrerCode, status: 1 });
      if (!referrer) {
        return res.status(400).json({ error: "Referral Code is Incorrect" });
      }
      const alreadyReferred = await Reference.findOne({ referred_id: existingUser._id });
      if (!alreadyReferred) {
        await Reference.create({
          referred_id: existingUser._id,
          referred_by: referrer._id,
          status: 0,
        });
      }
    }

    // 🔴 CRITICAL: Update Redis profile so UI shows new name immediately
    const userKey = `user:${updatedUser._id}`;
    const EXPIRY_SEC = 60 * 24 * 60 * 60;
    await setHash(
      userKey,
      "profile",
      { firstName, is_admin: !!updatedUser.is_admin },
      EXPIRY_SEC
    );

    // You don’t need to touch cart/cashback here.

    // Respond with fresh display fields
    res.status(200).json({
      userId: updatedUser._id,
      referralCode,
      firstName,
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


const getUserRedisData = async (req, res) => {
  try {
    const rawToken = req.cookies["CK-REF-T"];
    if (!rawToken) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(rawToken);

    const userKey = `user:${payload.userId}`;
    const cachedData = await getAllHash(userKey);

    if (!cachedData || Object.keys(cachedData).length === 0) {
      return res.status(404).json({ message: "No cache found for this user" });
    }
    res.status(200).json(cachedData);
  } catch (err) {
    console.error("getUserRedisData error::", err);
    res.status(500).json({ error: err.message });
  }
};

const getProfileData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ _id: userId, status: 1 })
      .select('full_name phone_number email')
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

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
    const nameStr = String(full_name || '').trim();
    const emailStr = String(email || '').trim().toLowerCase();

    await User.findOneAndUpdate(
      { _id: userId, status: 1 },
      { $set: { full_name: nameStr, email: emailStr } },
      { new: true, runValidators: true }
    )

    return res.status(200).json({
      message: 'Profile updated successfully',
    });
  } catch (err) {
    console.error('updateProfileData error:', err);
    return res.status(500).json({ error: 'Server error' });
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
  updateProfileData
};









// const bcrypt = require('bcrypt');

// const {
//   generateAccessToken,
//   generateRefreshToken,
//   verifyAccessToken,
//   verifyRefreshToken
// } = require('../utils/jwt');

// const mysqlConnection = require('../database/mysql.js');
// const { hashToken } = require("../utils/hash");
// const { setHash, getHash, getAllHash, delKey, redisClient } = require("../database/redisClient");
// const { encrypt, decrypt } = require('../encryption.js');


// const executeQuery = (query, values) => {
//   return new Promise((resolve, reject) => {
//     mysqlConnection.query(query, values, (err, rows) => {
//       if (err) reject("mysql insert, update, select, etc. error::" + err);
//       else resolve(rows);
//     });
//   });
// };


// // helpers
// function tryVerifyRefresh(rawToken) {
//   try { return verifyRefreshToken(rawToken); } catch { return null; }
// }

// const isInterimMobile = (m) =>
//   typeof m === 'string' && m.length === 11 && m.startsWith('1');


// // ------------------- VERIFY API (supports interim→real upgrade, blocks real→real switch) -------------------
// const verifyApi = async (req, res) => {
//   try {
//     let { mobileNo } = req.body;
//     const rawToken = req.cookies['OHA-REF-T'];

//     const REFRESH_MAX_AGE_MS  = 60 * 24 * 60 * 60 * 1000; // 60 days
//     const REFRESH_MAX_AGE_SEC = Math.floor(REFRESH_MAX_AGE_MS / 1000);

//     const decoded = rawToken ? tryVerifyRefresh(rawToken) : null;
//     const cookieMobile = decoded?.mobileNo || null;

//     // Block real→real switch without logout
//     if (
//       cookieMobile &&
//       !isInterimMobile(cookieMobile) &&
//       mobileNo && !isInterimMobile(mobileNo) &&
//       cookieMobile !== mobileNo
//     ) {
//       return res.status(409).json({
//         error: 'Different real mobile not allowed in active session. Please logout first.',
//         currentMobile: cookieMobile,
//         requestedMobile: mobileNo,
//       });
//     }

//     // Decide target identity
//     if (!mobileNo) {
//       mobileNo = cookieMobile || ('1' + String(Math.floor(Math.random() * 1e10)).padStart(10, '0'));
//     } else if (cookieMobile) {
//       if (!isInterimMobile(cookieMobile)) {
//         mobileNo = cookieMobile; // lock to real from cookie
//       } else if (!isInterimMobile(mobileNo)) {
//         // interim -> real (upgrade handled below)
//       } else {
//         mobileNo = cookieMobile; // both interim, keep cookie
//       }
//     }

//     // If cookie already matches identity → just return access token
//     if (cookieMobile && cookieMobile === mobileNo) {
//       const accessToken = generateAccessToken({ mobileNo });
//       return res.status(200).json({ accessToken, interim: isInterimMobile(mobileNo) });
//     }

//     // Upgrade: interim cookie -> real request
//     if (cookieMobile && isInterimMobile(cookieMobile) && !isInterimMobile(mobileNo)) {
//       const oldHashed = hashToken(rawToken);

//       // delete interim session row
//       await executeQuery(
//         `DELETE FROM USER_SESSION WHERE MOBILE_NO = ? AND REFRESH_TOKEN = ? LIMIT 1`,
//         [cookieMobile, oldHashed]
//       );

//       // delete interim redis key
//       const oldEnc = `ENC=${encrypt(`CLIENT_ID=1&USER_ID=2&MOBILE_NO=${cookieMobile}`)}`;
//       await redisClient.del(`user:${oldEnc}:rt:${oldHashed}`);

//       // clear BOTH cookies (we'll set fresh ones below)
//       res.clearCookie('OHA-REF-T', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
//       res.clearCookie('OHA-IS-LOGGEDIN', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
//     }

//     // Look up OHA_USER_ID only for real numbers
//     let ohaUserId = null;
//     if (!isInterimMobile(mobileNo)) {
//       const rows = await executeQuery(
//         'SELECT ID FROM USERS WHERE MOBILE_NO = ? LIMIT 1',
//         [mobileNo]
//       );
//       if (rows && rows.length) ohaUserId = rows[0].ID ?? rows[0].id ?? null;
//     }

//     // Create NEW refresh token + session
//     const payload = { mobileNo };
//     const refreshToken = generateRefreshToken(payload);
//     const hashedRefreshToken = hashToken(refreshToken);

//     const expiresAt  = new Date(Date.now() + REFRESH_MAX_AGE_MS);
//     const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
//     const ipAddress  = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || req.ip || null;

//     const enc = `ENC=${encrypt(`CLIENT_ID=1&USER_ID=2&MOBILE_NO=${mobileNo}`)}`;
//     const encKey = `user:${enc}`;

//     await executeQuery(
//       `INSERT INTO USER_SESSION
//         (MOBILE_NO, REFRESH_TOKEN, EXPIRES_AT, DEVICE_INFO, IP_ADDRESS, QUERY_STRING, OHA_USER_ID)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         mobileNo,
//         hashedRefreshToken,     // store HASH
//         expiresAt,
//         deviceInfo,
//         ipAddress,
//         encKey,
//         ohaUserId,              // null if interim or no match
//       ]
//     );

//     // Redis per-token key with TTL (device-scoped)
//     await setHash(
//       `${encKey}:rt:${hashedRefreshToken}`,
//       'user-session:refreshtoken',
//       expiresAt.toISOString(),
//       REFRESH_MAX_AGE_SEC
//     );

//     // Cookies: refresh + login-state (same expiry/options)
//     res.cookie('OHA-REF-T', refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'none',
//       path: '/',
//       maxAge: REFRESH_MAX_AGE_MS,
//     });
//     res.cookie('OHA-IS-LOGGEDIN', (!isInterimMobile(mobileNo)).toString(), {
//       httpOnly: true,        // set to false if you need frontend JS to read it
//       secure: true,
//       sameSite: 'none',
//       path: '/',
//       maxAge: REFRESH_MAX_AGE_MS,
//     });

//     const accessToken = generateAccessToken({ mobileNo });
//     return res.status(200).json({
//       accessToken,
//       interim: isInterimMobile(mobileNo),
//       upgraded: !!(cookieMobile && isInterimMobile(cookieMobile) && !isInterimMobile(mobileNo)),
//     });

//   } catch (err) {
//     console.error('verifyApi error:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };


// // ------------------- REFRESH TOKEN (Redis-only check, no cookie changes) -------------------
// const refresh = async (req, res) => {
//   try {
//     const rawToken = req.cookies['OHA-REF-T'];
//     if (!rawToken) return res.status(401).json({ error: 'No refresh token' });

//     const decoded = tryVerifyRefresh(rawToken);
//     if (!decoded?.mobileNo) {
//       return res.status(403).json({ error: 'Invalid or expired refresh token' });
//     }

//     const mobileNo = decoded.mobileNo;
//     const hashedRefreshToken = hashToken(rawToken);
//     const enc = `ENC=${encrypt(`CLIENT_ID=1&USER_ID=2&MOBILE_NO=${mobileNo}`)}`;
//     const redisKey = `user:${enc}:rt:${hashedRefreshToken}`;

//     const exists = await redisClient.exists(redisKey);
//     if (!exists) {
//       return res.status(403).json({ error: 'Invalid or expired refresh token' });
//     }

//     const accessToken = generateAccessToken({ mobileNo });
//     return res.json({ accessToken });

//   } catch (err) {
//     console.error('refresh error:', err);
//     return res.status(403).json({ error: 'Invalid or expired refresh token' });
//   }
// };


// // ------------------- LOGOUT (device-scoped) -------------------
// const logout = async (req, res) => {
//   try {
//     const rawToken = req.cookies['OHA-REF-T'];

//     if (rawToken) {
//       const decoded = tryVerifyRefresh(rawToken);
//       if (decoded?.mobileNo) {
//         const mobileNo = decoded.mobileNo;
//         const hashedToken = hashToken(rawToken);

//         // delete DB session
//         await executeQuery(
//           `DELETE FROM USER_SESSION WHERE MOBILE_NO = ? AND REFRESH_TOKEN = ? LIMIT 1`,
//           [mobileNo, hashedToken]
//         );

//         // delete Redis per-token key
//         const enc = `ENC=${encrypt(`CLIENT_ID=1&USER_ID=2&MOBILE_NO=${mobileNo}`)}`;
//         const encKey = `user:${enc}`;
//         await redisClient.del(`${encKey}:rt:${hashedToken}`);
//       }
//     }

//     // clear cookies (both)
//     res.clearCookie('OHA-REF-T', {
//       httpOnly: true, secure: true, sameSite: 'none', path: '/',
//     });
//     res.clearCookie('OHA-IS-LOGGEDIN', {
//       httpOnly: true, secure: true, sameSite: 'none', path: '/',
//     });

//     return res.json({ message: 'Logged out successfully' });

//   } catch (err) {
//     console.error('logout error:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };


// module.exports = { verifyApi, refresh, logout };

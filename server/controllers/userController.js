const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = 
require('../utils/jwt');
const { User, CustomerOtp, Reference } = require('../models/userModels');


// Send OTP
const generateOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await CustomerOtp.findOneAndUpdate(
      { phone },
      { otp, expires_at: expiresAt },
      { upsert: true, new: true }
    );

    // TODO: send SMS here

    res.status(200).json({ otp:otp, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('generateOtp error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify OTP and login
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const record = await CustomerOtp.findOne({ phone, otp });
    if (!record) return res.status(400).json({ error: 'Invalid OTP' });
    if (record.expires_at < new Date()) return res.status(400).json({ error: 'OTP expired' });

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

    // Save refresh token in DB
    await User.updateOne({ _id: user._id, status: 1 }, { refresh_token: refreshToken });

    // Store refresh token as HttpOnly cookie
    res.cookie('CK-REF-T', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
    });

    // Extract first name and referral code
    let firstName = user.full_name ? user.full_name.trim().split(/\s+/)[0].toUpperCase() : 'USER';
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    const referralCode = user.referral_code || `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;

    res.status(200).json({
      accessToken,
      newUser: isNewUser,
      userId: user._id,
      firstName,
      referralCode
    });

  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// ------------------- REFRESH TOKEN -------------------
const refresh = async (req, res) => {
  try {
    const token = req.cookies['CK-REF-T'];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const payload = verifyRefreshToken(token);

    const user = await User.findOne({ _id: payload.userId, refresh_token: token, status: 1 });
    if (!user) return res.status(403).json({ error: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken({
      userId: user._id,
      phone: user.phone_number,
      is_admin: user.is_admin
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('refreshToken error:', err);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

// ------------------- LOGOUT -------------------
const logout = async (req, res) => {
  try {
    if (req.user?.userId) {
      await User.updateOne({ _id: req.user.userId, status: 1 }, { refresh_token: null });
    }

    res.clearCookie('CK-REF-T', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Register new user (optional if you want to pre-register)
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, referrerCode } = req.body;

    // Check if user exists (OTP already verified)
    const existingUser = await User.findOne({ phone_number, status: 1 });
    if (!existingUser) {
      return res.status(400).json({ error: 'User not found. Please verify OTP first.' });
    }

    // Extract first name & format
    let firstName = (full_name || 'USER').trim().split(/\s+/)[0].toUpperCase();
    if (firstName.length > 10) firstName = firstName.substring(0, 10);

    // Generate referral code if missing
    const referralCode = existingUser.referral_code || `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;

    // Update user basic info
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      {
        full_name: full_name || existingUser.full_name,
        email: email || existingUser.email,
        referral_code: referralCode
      },
      { new: true }
    );

    // Handle referral if provided
    if (referrerCode) {
      const referrer = await User.findOne({ referral_code: referrerCode, status: 1 });
      if (referrer) {
        // Prevent duplicate reference
        const alreadyReferred = await Reference.findOne({ referred_id: existingUser._id });
        if (!alreadyReferred) {
          await Reference.create({
            referred_id: existingUser._id,
            referred_by: referrer._id,
            status: 0
          });
        }
      } else {
        return res.status(400).json({ error: 'Referral Code is Incorrect' });
      }
    }

    // Respond with only referralCode, userId, and firstName
    res.status(200).json({
      userId: updatedUser._id,
      referralCode,
      firstName
    });

  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




module.exports={generateOtp, verifyOtp, refresh, logout, register};
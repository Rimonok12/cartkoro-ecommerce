const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { User, CustomerOtp } = require('../models/userModels');


// Send OTP
const generateOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(200).json({ error: 'Invalid phone number' });
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
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const record = await CustomerOtp.findOne({ phone, otp });
    if (!record) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (record.expires_at < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    let user = await User.findOne({ phone_number: phone });
    let isNewUser = false;

    if (!user) {
      // No user found — create with blank profile
      const userData = {
        phone_number:phone
      };
      user = await User.create(userData);
      isNewUser = true;

    } else if (!user.full_name || user.full_name.trim() === '') {
      // Existing user but no name → incomplete profile
      isNewUser = true;
    }

    const token = generateToken({
      userId: user._id,
      phone: user.phone_number,
      is_admin: user.is_admin
    });

    await CustomerOtp.deleteOne({ _id: record._id });

    res.status(200).json({
      token,
      newUser: isNewUser
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Register new user (optional if you want to pre-register)
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, referrerCode } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ phone_number });
    if (!existingUser) {
      return res.status(200).json({ error: 'User not found. Please verify OTP first.' });
    }

    // Extract first name (default 'USER' if empty)
    let firstName = (full_name || 'USER').trim().split(/\s+/)[0].toUpperCase();

    // Optional: enforce max 10 chars for first name
    if (firstName.length > 10) {
      firstName = firstName.substring(0, 10);
    }

    // Generate 4-digit random number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    // Final referral code (only if user doesn’t already have one)
    const referralCode = existingUser.referral_code || `${firstName}${randomDigits}`;

    // Prepare updated data
    const updateData = {
      full_name: full_name || existingUser.full_name,
      email: email || existingUser.email,
      referral_code: referralCode
    };

    // If they were referred by someone
    if (referrerCode) {
      const referrer = await User.findOne({ referral_code: referrerCode });
      if (referrer) {
        updateData.referred_by = referrer._id;
      }
    }

    // Update and return new document
    const updatedUser = await User.findByIdAndUpdate(existingUser._id, updateData, { new: true });

    res.status(200).json({
      message: 'User registered successfully',
      referral_code: referralCode,
      user: updatedUser
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,        // make sure to use HTTPS in production
    sameSite: 'Strict',
    path: '/',           // should match where the cookie was set
  });

  res.status(200).json({ message: 'Logged out successfully' });
};



module.exports={generateOtp, verifyOtp, register, logout};
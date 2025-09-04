// controllers/addressController.js
const {
  District, Upazila
} = require("../models/generalModels");
const {
  UserAddress
} = require("../models/userModels");
const { Order } = require('../models/orderModels.js');
const {
  setHash,
  getHash,
  getAllHash,
  delKey,
} = require("../config/redisClient");


// Add address
const addAddress = async (req, res) => {
  try {
    const user_id=req.user.userId;
    const {
      label,
      full_name,
      phone,
      address,
      district_id,
      upazila_id,
      postcode,
      landmark,
      alternate_phone,
    } = req.body;
    console.log("addadress req.body::", user_id, req.body)

    // validate district
    const district = await District.findOne({ _id: district_id, status: true });
    if (!district) return res.status(400).json({ error: "Invalid district" });

    // validate upazila
    const upazila = await Upazila.findOne({ _id: upazila_id, district_id, status: true });
    if (!upazila) return res.status(400).json({ error: "Invalid upazila for this district" });

    // validate postcode
    // const postcodeExists = await Postcode.findOne({ upazila_id, postcode, status: true });
    // if (!postcodeExists) return res.status(400).json({ error: "Invalid postcode for this upazila" });

    const newAddress = new UserAddress({
      user_id,
      label,
      full_name,
      phone,
      address,
      district_id,
      upazila_id,
      postcode,
      landmark,
      alternate_phone,
    });

    await newAddress.save();
    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    console.error("Add Address Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Get all addresses of user
const getAddresses = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const addresses = await UserAddress.find({ user_id, status: "1" })
      .populate("district_id", "name")   // populate district name
      .populate("upazila_id", "name");   // populate upazila name

    if (!addresses || addresses.length === 0) {
      return res.status(200).json({ addresses:[] });
    }

    res.json({ addresses });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Edit address
const editAddress = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { addressId } = req.params;

    console.log("editAddress req.body::", user_id, addressId, req.body)


    const updated = await UserAddress.findOneAndUpdate(
      { _id: addressId, user_id, status: "1" }, // only active
      { $set: req.body },
      { new: true }
    )
      .populate("district_id", "name")
      .populate("upazila_id", "name");

    if (!updated) {
      return res.status(404).json({ error: "Address not found or inactive" });
    }

    res.json({ message: "Address updated successfully", address: updated });
  } catch (error) {
    console.error("Edit Address Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete address (soft delete: status = 0)
const deleteAddress = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { addressId } = req.params;

    const deleted = await UserAddress.findOneAndUpdate(
      { _id: addressId, user_id, status: "1" }, // only active
      { $set: { status: "0" } },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ error: "Address not found or already deleted" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


const redisSetRecentAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { addressId } = req.body || {};
    const userKey = `user:${userId}`;

    let idToStore = addressId;

    // If no addressId is provided, fall back to the most recent order's shipping address
    if (idToStore == null) {
      const lastOrder = await Order
        .findOne({ user_id: userId })
        .sort({ createdAt: -1 })
        .select({ shipping_address_id: 1 })
        .lean();

      if (!lastOrder?.shipping_address_id) {
        // nothing to store; optionally clear the field
        await delHash(userKey, 'recentAddress').catch(() => {});
        return res.status(200).json({ ok: true, recentAddress: null });
      }
      idToStore = lastOrder.shipping_address_id;
    }

    await setHash(userKey, 'recentAddress', { id: String(idToStore) }, EXPIRY_SEC);
    return res.status(200).json({ ok: true, recentAddress: { id: String(idToStore) } });
  } catch (error) {
    console.error('redisSetRecentAddress Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  addAddress,
  getAddresses,
  editAddress,
  deleteAddress,
  redisSetRecentAddress
};
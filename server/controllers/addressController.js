// controllers/addressController.js
const Address = require("../models/address");
const { District, Upazila, Postcode } = require("../models/location");

// ➡️ Add address
const addAddress = async (req, res) => {
  try {
    const {
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
    } = req.body;

    // validate district
    const district = await District.findOne({ _id: district_id, status: true });
    if (!district) return res.status(400).json({ error: "Invalid district" });

    // validate upazila
    const upazila = await Upazila.findOne({ _id: upazila_id, district_id, status: true });
    if (!upazila) return res.status(400).json({ error: "Invalid upazila for this district" });

    // validate postcode
    const postcodeExists = await Postcode.findOne({ upazila_id, postcode, status: true });
    if (!postcodeExists) return res.status(400).json({ error: "Invalid postcode for this upazila" });

    const newAddress = new Address({
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



module.exports={addAddress}
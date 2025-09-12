const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  status: { type: Boolean, default: true }
});

const upazilaSchema = new mongoose.Schema({
  district_id: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  name: { type: String, required: true },
  status: { type: Boolean, default: true }
});

const postcodeSchema = new mongoose.Schema({
  upazila_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Upazila', required: true },
  postcode: { type: String, required: true, unique: true },
  status: { type: Boolean, default: true }
});

module.exports = {
  District: mongoose.model('District', districtSchema),
  Upazila: mongoose.model('Upazila', upazilaSchema),
  Postcode: mongoose.model('Postcode', postcodeSchema)
};

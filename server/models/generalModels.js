// models/general.js
const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema({
  division_name: { type: String, required: true }
});

const districtSchema = new mongoose.Schema({
  division_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  district_name: { type: String, required: true }
});

const upazilaSchema = new mongoose.Schema({
  district_id: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  upazila_name: { type: String, required: true }
});

const pincodeSchema = new mongoose.Schema({
  upazila_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Upazila', required: true },
  pincode: { type: String, required: true }
});

module.exports = {
  Division: mongoose.model('Division', divisionSchema),
  District: mongoose.model('District', districtSchema),
  Upazila: mongoose.model('Upazila', upazilaSchema),
  Pincode: mongoose.model('Pincode', pincodeSchema)
};

const { Division, District, Upazila } = require('../models/generalModels');


const getDivisions = async (req, res) => res.json(await Division.find());

const getDistrictsByDivision = async (req, res) => {
  const { divisionId } = req.params;
  res.json(await District.find({ division_id: divisionId }));
};

const getUpazilasByDistrict = async (req, res) => {
  const { districtId } = req.params;
  res.json(await Upazila.find({ district_id: districtId }));
};


module.exports={getDivisions, getDistrictsByDivision, getUpazilasByDistrict};
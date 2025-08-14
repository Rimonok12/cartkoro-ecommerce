const express = require('express');
const router = express.Router();
const {getDivisions, getDistrictsByDivision, getUpazilasByDistrict} = require('../controllers/generalController');

router.get('/divisions', getDivisions);
router.get('/districts/:divisionId', getDistrictsByDivision);
router.get('/upazilas/:districtId', getUpazilasByDistrict);

module.exports = router;

const express = require('express');
const router = express.Router();
const {getDistrictsWithUpazilas} = require('../controllers/generalController');

router.get('/getDistrictsWithUpazilas', getDistrictsWithUpazilas);

module.exports = router;

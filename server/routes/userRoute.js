const express = require('express');
const router = express.Router();
const {generateOtp, verifyOtp, refresh, logout, register} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.post('/generateOtp', generateOtp);
router.post('/verifyOtp', verifyOtp);
router.post('/register', auth, register);
router.post('/logout', auth, logout);
router.post('/refresh', refresh);


module.exports = router;


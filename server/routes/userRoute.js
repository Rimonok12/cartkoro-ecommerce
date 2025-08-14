const express = require('express');
const router = express.Router();
const {generateOtp, verifyOtp, register, logout} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.post('/generateOtp', generateOtp);
router.post('/verifyOtp', verifyOtp);
router.post('/register', register);
router.get('/logout', logout);


// Protected example route
router.get('/me', auth, (req, res) => {
    res.json({ message: 'Secure data', user: req.user });
});

module.exports = router;


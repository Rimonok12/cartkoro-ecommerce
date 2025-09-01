const express = require('express');
const router = express.Router();
const {getUserOrders, createOrder} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.get('/getUserOrders', auth, getUserOrders);
router.post('/createOrder', auth, createOrder);

module.exports = router;

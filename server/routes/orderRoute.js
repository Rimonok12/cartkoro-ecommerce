const express = require('express');
const router = express.Router();
const {getUserOrders, createOrder} = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getUserOrders);
router.post('/', auth, createOrder);

module.exports = router;

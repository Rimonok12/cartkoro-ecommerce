const express = require('express');
const router = express.Router();
const {createCategory, getCategories, createProduct, getAllProducts} = 
require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');



router.post('/createCategory', auth, adminOnly, createCategory);
router.get('/getCategories', getCategories);    
router.post('/createProduct', auth, adminOnly, createProduct); 
router.get('/getAllProducts', getAllProducts);

module.exports = router;

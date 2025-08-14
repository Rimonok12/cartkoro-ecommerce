const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
// Load env
dotenv.config();

const connectMongo = require('./config/mongodb');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const orderRoute = require('./routes/orderRoute');
const generalRoute = require('./routes/generalRoute');


const app = express();
app.use(cors({
  origin: process.env.NEXT_HOST,
  credentials: true
}));
app.use(cookieParser());
app.use(helmet());
app.use(express.json());

// Connect DB
connectMongo();

// Routes
app.use('/api/user', userRoute);
app.use('/api/product', productRoute);
app.use('/api/order', orderRoute);
app.use('/api/general', generalRoute);


// Health check
app.get('/', (req, res) => res.send('🚀 Portfolio API is running'));

const PORT = process.env.PORT || 8000;
const configIdentity = process.env.CONFIG_IDENTITY;

app.listen(PORT, () => {
    console.log(`config identity is ${configIdentity}`)
    console.log(`Server started on port ${PORT}`)
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/authRoutes')); // For user profile access
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/network', require('./routes/networkRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/academy', require('./routes/academyRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/sliders', require('./routes/sliderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/supplier', require('./routes/supplierProductRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/profits', require('./routes/profitsRoutes'));
app.use('/api/profit-periods', require('./routes/profitPeriodRoutes'));
app.use('/api/regions', require('./routes/regionRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/greetings', require('./routes/greetingRoutes'));
app.use('/api/polls', require('./routes/pollRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/member', require('./routes/memberRoutes'));
app.use('/api/permissions', require('./routes/permissionsRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with absolute path
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in local dev, strict in prod
      }
    },
    credentials: true
  })
);

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static directory for uploaded profile photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hiking Trail Explorer API is online and healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/explore', require('./routes/exploreRoutes'));
app.use('/api/trails', require('./routes/trailRoutes'));
app.use('/api', require('./routes/reviewRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/completions', require('./routes/completionRoutes'));



// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find route ${req.originalUrl}`
  });
});

// Centralized Error Handler Middleware
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Hiking Trail Explorer Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Handle unhandled promise rejections safely
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Error: ${err.message}`);
});

module.exports = app;

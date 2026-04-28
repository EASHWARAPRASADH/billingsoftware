const express = require('express');
const sequelize = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');

const app = express();

// CORS configuration - MUST come before other middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'https://test-tsdevelopment.org', 'http://test-tsdevelopment.org'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Security middleware - configured to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000 // limit each IP to 5000 requests per windowMs (increased for dev)
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MySQL connection with Sequelize
sequelize.authenticate()
  .then(() => {
    console.log('Successfully connected to MySQL');
    // Sync models with database (creates tables if they don't exist)
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('Database synchronized');
    try {
      const User = require('./models/User');
      const email = 'itsupport@technosprint.net';
      const user = await User.scope('withPassword').findOne({ where: { email } });
      if (user) {
        user.password = 'Poland@01';
        await user.save();
        console.log('Password reset successfully during startup for', email);
      } else {
        await User.create({
          email,
          password: 'Poland@01',
          businessName: 'TechnoSprint Support'
        });
        console.log('User created successfully during startup for', email);
      }
    } catch (e) {
      console.error('Password reset/creation failed:', e);
    }
  })
  .catch((error) => {
    console.error('MySQL connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Serve static files from the React app
app.use(express.static(path.resolve(__dirname, '..', 'frontend', 'build')));

// Catch-all route to serve the React index.html for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'build', 'index.html'));
  } else {
    res.status(404).json({ message: 'API route not found' });
  }
});

const PORT = process.env.PORT || 12345;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const deductionRoutes = require('./routes/deductionRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const committeeRoutes = require('./routes/committeeRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'WCMS API',
        version: '1.0.0'
    });
});

// API Routes
const API_VERSION = process.env.API_BASE_URL || '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/members`, memberRoutes);
app.use(`${API_VERSION}/deductions`, deductionRoutes);
app.use(`${API_VERSION}/withdrawals`, withdrawalRoutes);
app.use(`${API_VERSION}/committees`, committeeRoutes);
app.use(`${API_VERSION}/reports`, reportRoutes);

// serve frontend static files when build exists
const path = require('path');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' || true) {
    app.use(express.static(frontendDist));
    // catchall - send index.html for any non-API route
    app.get('*', (req, res, next) => {
        if (req.path.startsWith(API_VERSION)) return next();
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 WCMS Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: ${API_VERSION}`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;

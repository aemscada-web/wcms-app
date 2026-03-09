// routes/deductionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const deductionController = require('../controllers/deductionController');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// Configure multer for file uploads
const upload = multer({
    dest: process.env.UPLOAD_DIR || './uploads/',
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
    }
});

// All routes require authentication
router.use(authenticate);

// Get all deductions
router.get('/', deductionController.getDeductions);

// Get monthly summary
router.get('/summary', deductionController.getMonthlySummary);

// Create deduction entry (DEC/REC/ZEC)
router.post('/',
    authorize('DEC_USER', 'REC_USER', 'ZEC_USER', 'ADMIN'),
    auditLog('CREATE', 'monthly_deductions'),
    deductionController.createDeduction
);

// Verify deductions (ZEC)
router.post('/verify',
    authorize('ZEC_VERIFIER', 'ZEC_USER', 'ADMIN'),
    auditLog('VERIFY', 'monthly_deductions'),
    deductionController.verifyDeductions
);

// Forward to CEC (ZEC)
router.post('/forward',
    authorize('ZEC_VERIFIER', 'ZEC_USER', 'ADMIN'),
    auditLog('FORWARD', 'monthly_deductions'),
    deductionController.forwardToCEC
);

// Approve deductions (CEC)
router.post('/approve',
    authorize('CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'),
    auditLog('APPROVE', 'monthly_deductions'),
    deductionController.approveDeductions
);

// Bulk import deductions
router.post('/bulk-import',
    authorize('DEC_USER', 'REC_USER', 'ZEC_USER', 'ADMIN'),
    upload.single('file'),
    auditLog('BULK_IMPORT', 'monthly_deductions'),
    deductionController.bulkImportDeductions
);

module.exports = router;

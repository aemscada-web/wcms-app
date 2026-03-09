// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const memberController = require('../controllers/memberController');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog, captureOldValues } = require('../middleware/audit');

// Configure multer for file uploads
const upload = multer({
    dest: process.env.UPLOAD_DIR || './uploads/',
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// All routes require authentication
router.use(authenticate);

// Get all members
router.get('/', memberController.getMembers);

// Get member by ID
router.get('/:id', memberController.getMemberById);

// Get member balance
router.get('/:id/balance', memberController.getMemberBalance);

// Create new member (ZEC and above)
router.post('/',
    authorize('ZEC_USER', 'ZEC_VERIFIER', 'CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'ADMIN'),
    auditLog('CREATE', 'members'),
    memberController.createMember
);

// Update member
router.put('/:id',
    captureOldValues('members', 'member_id'),
    auditLog('UPDATE', 'members'),
    memberController.updateMember
);

// Bulk import members (CEC and ADMIN only)
router.post('/bulk-import',
    authorize('CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'ADMIN'),
    upload.single('file'),
    auditLog('BULK_IMPORT', 'members'),
    memberController.bulkImportMembers
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const ctrl = require('../controllers/auditController');

// Audit trail is read-only by design — no POST/PATCH/DELETE here.
router.get('/', asyncHandler(ctrl.listAudit));
router.get('/:record_id', asyncHandler(ctrl.getRecordHistory));

module.exports = router;

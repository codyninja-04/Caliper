const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');
const { asyncHandler } = require('../middleware/errorHandler');
const ctrl = require('../controllers/supplierController');

router.get('/', asyncHandler(ctrl.listSuppliers));
router.get('/:id', asyncHandler(ctrl.getSupplier));
router.get('/:id/scorecard', asyncHandler(ctrl.getScorecard));
router.post('/', requireRole('admin'), auditLogger('suppliers'), asyncHandler(ctrl.createSupplier));
router.post('/:id/recalculate-score', requireRole('quality_engineer', 'supervisor', 'admin'), asyncHandler(ctrl.recalculate));

module.exports = router;

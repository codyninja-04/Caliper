const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');
const { asyncHandler } = require('../middleware/errorHandler');
const ctrl = require('../controllers/capaController');

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

router.get('/', asyncHandler(ctrl.listCAPAs));
router.get('/:id', asyncHandler(ctrl.getCAPA));
router.post('/', requireRole(...WRITERS), auditLogger('capas'), asyncHandler(ctrl.createCAPA));
router.patch('/:id', requireRole(...WRITERS), auditLogger('capas'), asyncHandler(ctrl.updateCAPA));
router.post('/:id/verify', requireRole('supervisor', 'admin'), auditLogger('capas'), asyncHandler(ctrl.verifyCAPA));

module.exports = router;

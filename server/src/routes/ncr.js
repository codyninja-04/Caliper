const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');
const { asyncHandler } = require('../middleware/errorHandler');
const ctrl = require('../controllers/ncrController');

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

router.get('/', asyncHandler(ctrl.listNCRs));
router.get('/:id', asyncHandler(ctrl.getNCR));
router.post('/', requireRole(...WRITERS), auditLogger('ncrs'), asyncHandler(ctrl.createNCR));
router.patch('/:id/status', requireRole(...WRITERS), auditLogger('ncrs'), asyncHandler(ctrl.updateNCRStatus));
router.post('/:id/escalate', requireRole(...WRITERS), auditLogger('ncrs'), asyncHandler(ctrl.escalateNCR));

module.exports = router;

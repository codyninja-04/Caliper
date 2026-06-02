const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');
const { asyncHandler } = require('../middleware/errorHandler');
const ctrl = require('../controllers/defectController');

const WRITERS = ['quality_engineer', 'supervisor', 'admin'];

router.get('/stats/summary', asyncHandler(ctrl.defectStats));
router.get('/', asyncHandler(ctrl.listDefects));
router.get('/:id', asyncHandler(ctrl.getDefect));
router.post('/', requireRole(...WRITERS), auditLogger('defects'), asyncHandler(ctrl.createDefect));
router.patch('/:id', requireRole(...WRITERS), auditLogger('defects'), asyncHandler(ctrl.updateDefect));

module.exports = router;

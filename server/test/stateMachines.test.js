const { test } = require('node:test');
const assert = require('node:assert');

const { canTransition: ncrCan, NCR_TRANSITIONS } = require('../src/controllers/ncrController');
const { canTransition: capaCan, CAPA_TRANSITIONS } = require('../src/controllers/capaController');
const { statusForScore, SCORE_WEIGHTS } = require('../src/services/supplierScorer');

test('NCR: valid forward transitions are allowed', () => {
  assert.equal(ncrCan('draft', 'open'), true);
  assert.equal(ncrCan('under_review', 'capa_required'), true);
  assert.equal(ncrCan('capa_required', 'closed'), true);
});

test('NCR: invalid transitions are rejected', () => {
  assert.equal(ncrCan('draft', 'closed'), false);
  assert.equal(ncrCan('closed', 'open'), false);
  assert.equal(ncrCan('open', 'verified'), false);
});

test('NCR: closed is terminal', () => {
  assert.deepEqual(NCR_TRANSITIONS.closed, []);
});

test('NCR: same-state is idempotent', () => {
  assert.equal(ncrCan('open', 'open'), true);
});

test('CAPA: valid lifecycle progression', () => {
  assert.equal(capaCan('open', 'in_progress'), true);
  assert.equal(capaCan('in_progress', 'pending_verification'), true);
  assert.equal(capaCan('pending_verification', 'verified'), true);
  assert.equal(capaCan('verified', 'closed'), true);
});

test('CAPA: cannot skip verification', () => {
  assert.equal(capaCan('open', 'verified'), false);
  assert.equal(capaCan('in_progress', 'closed'), false);
});

test('CAPA: closed is terminal', () => {
  assert.deepEqual(CAPA_TRANSITIONS.closed, []);
});

test('supplier status tiers map correctly from score', () => {
  assert.equal(statusForScore(100), 'active');
  assert.equal(statusForScore(60), 'active');
  assert.equal(statusForScore(59.99), 'probation');
  assert.equal(statusForScore(40), 'probation');
  assert.equal(statusForScore(39.99), 'disqualified');
  assert.equal(statusForScore(0), 'disqualified');
});

test('score weights have expected signs', () => {
  assert.ok(SCORE_WEIGHTS.defect_critical < SCORE_WEIGHTS.defect_major);
  assert.ok(SCORE_WEIGHTS.defect_major < SCORE_WEIGHTS.defect_minor);
  assert.ok(SCORE_WEIGHTS.audit_pass > 0);
  assert.ok(SCORE_WEIGHTS.audit_fail < 0);
});

-- ============================================================================
-- Caliper — Sample Manufacturing Data
-- Run AFTER schema.sql. Safe to re-run (uses fixed UUIDs + ON CONFLICT).
--
-- NOTE on users: user_profiles.id references auth.users(id), which is created
-- by Supabase Auth when a person signs up. The seed below leaves detected_by /
-- raised_by / owner NULL so it loads cleanly on a fresh project. Once you have
-- real auth users, you can backfill those columns.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (id, name, code, contact_email, country, status, quality_score) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Acme Electronics',        'SUP-001', 'quality@acme-elec.com',   'Taiwan',        'active',       92.50),
  ('11111111-1111-1111-1111-111111111102', 'Shenzhen Precision Mfg',  'SUP-002', 'qa@szprecision.cn',       'China',         'active',       78.00),
  ('11111111-1111-1111-1111-111111111103', 'Bavaria Components GmbH', 'SUP-003', 'support@bavaria-comp.de', 'Germany',       'active',       96.75),
  ('11111111-1111-1111-1111-111111111104', 'Penang Circuit Works',    'SUP-004', 'ncr@penangcircuit.my',    'Malaysia',      'probation',    54.25),
  ('11111111-1111-1111-1111-111111111105', 'Guadalajara Assembly Co', 'SUP-005', 'quality@gdl-assembly.mx', 'Mexico',        'active',       83.00),
  ('11111111-1111-1111-1111-111111111106', 'Hanoi Plastics JSC',      'SUP-006', 'qc@hanoiplastics.vn',     'Vietnam',       'disqualified', 31.50)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DEFECTS
-- ---------------------------------------------------------------------------
INSERT INTO defects (id, defect_code, product_line, batch_number, defect_type, severity, quantity_affected, detected_at, supplier_id, description, root_cause, status) VALUES
  ('22222222-2222-2222-2222-222222222201', 'DEF-2024-0101', 'PCB Assembly Line 3', 'BATCH-2024-08-142', 'dimensional', 'major',    24, '2024-08-15T09:30:00Z', '11111111-1111-1111-1111-111111111102', 'Component placement offset exceeding ±0.2mm tolerance on U12 position', 'Pick-and-place nozzle calibration drift', 'closed'),
  ('22222222-2222-2222-2222-222222222202', 'DEF-2024-0102', 'PCB Assembly Line 3', 'BATCH-2024-08-150', 'functional',  'critical', 8,  '2024-08-18T14:05:00Z', '11111111-1111-1111-1111-111111111104', 'Intermittent open circuit on flex connector J4 after thermal cycling', NULL, 'under_review'),
  ('22222222-2222-2222-2222-222222222203', 'DEF-2024-0103', 'Enclosure Molding',   'BATCH-2024-08-161', 'cosmetic',    'minor',    140,'2024-08-20T11:20:00Z', '11111111-1111-1111-1111-111111111106', 'Visible sink marks on top housing near boss features', 'Insufficient hold pressure during injection', 'open'),
  ('22222222-2222-2222-2222-222222222204', 'DEF-2024-0104', 'PCB Assembly Line 1', 'BATCH-2024-08-170', 'functional',  'critical', 3,  '2024-08-22T08:45:00Z', '11111111-1111-1111-1111-111111111102', 'Solder bridging between QFN pads causing short on 3V3 rail', NULL, 'open'),
  ('22222222-2222-2222-2222-222222222205', 'DEF-2024-0105', 'Final Assembly',      'BATCH-2024-08-181', 'dimensional', 'major',    19, '2024-08-25T16:10:00Z', '11111111-1111-1111-1111-111111111105', 'Threaded insert depth out of spec, screws bottoming out', 'Worn insertion tooling', 'under_review'),
  ('22222222-2222-2222-2222-222222222206', 'DEF-2024-0106', 'Enclosure Molding',   'BATCH-2024-08-190', 'cosmetic',    'minor',    72, '2024-08-27T10:00:00Z', '11111111-1111-1111-1111-111111111106', 'Color mismatch vs. master swatch on bottom housing', NULL, 'open'),
  ('22222222-2222-2222-2222-222222222207', 'DEF-2024-0107', 'PCB Assembly Line 2', 'BATCH-2024-09-005', 'functional',  'major',    12, '2024-09-02T13:30:00Z', '11111111-1111-1111-1111-111111111104', 'Firmware flash failure on 12 units — boot loader checksum mismatch', 'ESD damage during handling', 'closed')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- NCRs
-- ---------------------------------------------------------------------------
INSERT INTO ncrs (id, ncr_number, defect_id, supplier_id, title, description, severity, status, due_date, escalated_at, closed_at) VALUES
  ('33333333-3333-3333-3333-333333333301', 'NCR-2024-0017', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111104', 'Critical intermittent open circuit — PCB Line 3', 'Flex connector J4 fails after thermal cycling. Containment in place; supplier RCA requested.', 'critical', 'escalated', '2024-08-25', '2024-08-26T07:00:00Z', NULL),
  ('33333333-3333-3333-3333-333333333302', 'NCR-2024-0018', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Solder bridging on 3V3 rail — PCB Line 1', 'QFN solder bridge causing dead-on-arrival units. Quarantine batch BATCH-2024-08-170.', 'critical', 'capa_required', '2024-08-29', NULL, NULL),
  ('33333333-3333-3333-3333-333333333303', 'NCR-2024-0019', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105', 'Threaded insert depth out of spec', 'Insert depth non-conformance on final assembly. Awaiting supplier 8D response.', 'major', 'awaiting_supplier', '2024-09-05', NULL, NULL),
  ('33333333-3333-3333-3333-333333333304', 'NCR-2024-0020', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Pick-and-place calibration drift', 'Dimensional offset traced to nozzle calibration. Corrective action verified effective.', 'major', 'closed', '2024-08-20', NULL, '2024-08-23T15:00:00Z'),
  ('33333333-3333-3333-3333-333333333305', 'NCR-2024-0021', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111106', 'Recurring cosmetic defects — Hanoi Plastics', 'Third cosmetic NCR this quarter. Supplier moved to disqualified pending review.', 'minor', 'under_review', '2024-09-10', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CAPAs
-- ---------------------------------------------------------------------------
INSERT INTO capas (id, capa_number, ncr_id, title, problem_statement, root_cause_analysis, corrective_action, preventive_action, status, target_date, verified_at, effectiveness_score) VALUES
  ('44444444-4444-4444-4444-444444444401', 'CAPA-2024-0009', '33333333-3333-3333-3333-333333333302', 'Eliminate QFN solder bridging on Line 1', 'Solder bridges on QFN pads short the 3V3 rail, causing DOA units.', 'Stencil aperture oversized by 15%; paste volume excessive on fine-pitch pads.', 'Re-cut stencil to IPC-recommended aperture ratio; revalidate paste inspection limits.', 'Add 100% AOI gate post-reflow for all QFN-bearing assemblies; quarterly stencil audit.', 'in_progress', '2024-09-15', NULL, NULL),
  ('44444444-4444-4444-4444-444444444402', 'CAPA-2024-0010', '33333333-3333-3333-3333-333333333304', 'Stabilize pick-and-place nozzle calibration', 'Nozzle calibration drift caused dimensional placement offset beyond tolerance.', 'Calibration interval too long; thermal expansion not accounted for.', 'Recalibrate nozzles; shorten interval from weekly to per-shift.', 'Install automated calibration verification at shift start; trend in SPC.', 'verified', '2024-08-22', '2024-08-23T14:30:00Z', 9),
  ('44444444-4444-4444-4444-444444444403', 'CAPA-2024-0011', '33333333-3333-3333-3333-333333333301', 'Resolve flex connector thermal failure', 'J4 flex connector opens intermittently after thermal cycling.', 'Pending — supplier RCA in progress.', NULL, NULL, 'open', '2024-09-20', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SUPPLIER QUALITY EVENTS (last ~90 days — drives scoring)
-- ---------------------------------------------------------------------------
INSERT INTO supplier_quality_events (id, supplier_id, event_type, impact_score, reference_id, notes) VALUES
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111102', 'defect',           -8.00,  '22222222-2222-2222-2222-222222222201', 'Major dimensional defect'),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111102', 'defect',          -15.00,  '22222222-2222-2222-2222-222222222204', 'Critical solder bridging'),
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111102', 'ncr',              -5.00,  '33333333-3333-3333-3333-333333333302', 'NCR raised'),
  ('55555555-5555-5555-5555-555555555504', '11111111-1111-1111-1111-111111111102', 'audit_pass',      10.00,  NULL, 'Passed Q3 process audit'),
  ('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111102', 'on_time_delivery', 2.00,  NULL, 'On-time delivery streak'),
  ('55555555-5555-5555-5555-555555555506', '11111111-1111-1111-1111-111111111104', 'defect',          -15.00,  '22222222-2222-2222-2222-222222222202', 'Critical open circuit'),
  ('55555555-5555-5555-5555-555555555507', '11111111-1111-1111-1111-111111111104', 'defect',           -8.00,  '22222222-2222-2222-2222-222222222207', 'Major firmware flash failure'),
  ('55555555-5555-5555-5555-555555555508', '11111111-1111-1111-1111-111111111104', 'ncr',              -5.00,  '33333333-3333-3333-3333-333333333301', 'NCR raised'),
  ('55555555-5555-5555-5555-555555555509', '11111111-1111-1111-1111-111111111104', 'capa_overdue',    -10.00,  NULL, 'CAPA past target date'),
  ('55555555-5555-5555-5555-555555555510', '11111111-1111-1111-1111-111111111106', 'defect',           -3.00,  '22222222-2222-2222-2222-222222222203', 'Minor cosmetic'),
  ('55555555-5555-5555-5555-555555555511', '11111111-1111-1111-1111-111111111106', 'defect',           -3.00,  '22222222-2222-2222-2222-222222222206', 'Minor cosmetic'),
  ('55555555-5555-5555-5555-555555555512', '11111111-1111-1111-1111-111111111106', 'audit_fail',      -20.00,  NULL, 'Failed process audit'),
  ('55555555-5555-5555-5555-555555555513', '11111111-1111-1111-1111-111111111106', 'late_delivery',    -4.00,  NULL, 'Late delivery'),
  ('55555555-5555-5555-5555-555555555514', '11111111-1111-1111-1111-111111111103', 'audit_pass',      10.00,  NULL, 'Passed audit, zero findings'),
  ('55555555-5555-5555-5555-555555555515', '11111111-1111-1111-1111-111111111103', 'on_time_delivery', 2.00,  NULL, 'On-time delivery'),
  ('55555555-5555-5555-5555-555555555516', '11111111-1111-1111-1111-111111111105', 'defect',           -8.00,  '22222222-2222-2222-2222-222222222205', 'Major insert depth'),
  ('55555555-5555-5555-5555-555555555517', '11111111-1111-1111-1111-111111111105', 'on_time_delivery', 2.00,  NULL, 'On-time delivery')
ON CONFLICT (id) DO NOTHING;

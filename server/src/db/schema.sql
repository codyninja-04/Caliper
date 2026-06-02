-- ============================================================================
-- Caliper — Database Schema
-- Paste this directly into the Supabase SQL Editor and run.
-- Every domain table carries created_at / updated_at and is mirrored into the
-- append-only audit_log on mutation (see triggers at the bottom).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- USERS (managed by Supabase Auth, extended here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'quality_engineer', 'supervisor', 'viewer')) DEFAULT 'viewer',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,             -- e.g. "SUP-001"
  contact_email TEXT,
  country TEXT,
  status TEXT CHECK (status IN ('active', 'probation', 'disqualified')) DEFAULT 'active',
  quality_score NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- DEFECTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defect_code TEXT UNIQUE NOT NULL,      -- e.g. "DEF-2024-0042"
  product_line TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  defect_type TEXT NOT NULL,             -- e.g. "dimensional", "cosmetic", "functional"
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')) NOT NULL,
  quantity_affected INTEGER NOT NULL DEFAULT 1,
  detected_at TIMESTAMPTZ NOT NULL,
  detected_by UUID REFERENCES user_profiles(id),
  supplier_id UUID REFERENCES suppliers(id),
  description TEXT,
  root_cause TEXT,
  status TEXT CHECK (status IN ('open', 'under_review', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- NON-CONFORMANCE REPORTS (NCR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ncrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_number TEXT UNIQUE NOT NULL,       -- e.g. "NCR-2024-0017"
  defect_id UUID REFERENCES defects(id),
  supplier_id UUID REFERENCES suppliers(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')) NOT NULL,
  status TEXT CHECK (status IN (
    'draft', 'open', 'under_review', 'awaiting_supplier', 'capa_required', 'closed', 'escalated'
  )) DEFAULT 'draft',
  raised_by UUID REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  due_date DATE,
  escalated_at TIMESTAMPTZ,              -- set when auto-escalation triggers
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CAPA (Corrective and Preventive Actions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_number TEXT UNIQUE NOT NULL,      -- e.g. "CAPA-2024-0009"
  ncr_id UUID REFERENCES ncrs(id),
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  root_cause_analysis TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  owner UUID REFERENCES user_profiles(id),
  status TEXT CHECK (status IN (
    'open', 'in_progress', 'pending_verification', 'verified', 'closed'
  )) DEFAULT 'open',
  target_date DATE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- SUPPLIER QUALITY EVENTS (drives the scoring engine)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_quality_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  event_type TEXT CHECK (event_type IN (
    'defect', 'ncr', 'capa', 'capa_overdue', 'audit_pass', 'audit_fail', 'on_time_delivery', 'late_delivery'
  )) NOT NULL,
  impact_score NUMERIC(5,2) NOT NULL,    -- positive or negative contribution
  reference_id UUID,                     -- links to defect/ncr/capa table
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AUDIT TRAIL (append-only — never UPDATE or DELETE)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES user_profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ---------------------------------------------------------------------------
-- Indexes for performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_defects_supplier ON defects(supplier_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_ncrs_status ON ncrs(status);
CREATE INDEX IF NOT EXISTS idx_ncrs_due_date ON ncrs(due_date);
CREATE INDEX IF NOT EXISTS idx_capas_ncr ON capas(ncr_id);
CREATE INDEX IF NOT EXISTS idx_sqe_supplier ON supplier_quality_events(supplier_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_touch ON suppliers;
CREATE TRIGGER trg_suppliers_touch BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_defects_touch ON defects;
CREATE TRIGGER trg_defects_touch BEFORE UPDATE ON defects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_ncrs_touch ON ncrs;
CREATE TRIGGER trg_ncrs_touch BEFORE UPDATE ON ncrs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_capas_touch ON capas;
CREATE TRIGGER trg_capas_touch BEFORE UPDATE ON capas
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------------------------------------------------------------------
-- Database-level audit trail trigger (belt-and-suspenders with app middleware)
-- Captures every INSERT / UPDATE / DELETE on the domain tables.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  actor UUID;
BEGIN
  -- auth.uid() is available when the call comes through PostgREST / RLS.
  BEGIN
    actor := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), actor);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), actor);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), actor);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_suppliers ON suppliers;
CREATE TRIGGER trg_audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_defects ON defects;
CREATE TRIGGER trg_audit_defects AFTER INSERT OR UPDATE OR DELETE ON defects
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_ncrs ON ncrs;
CREATE TRIGGER trg_audit_ncrs AFTER INSERT OR UPDATE OR DELETE ON ncrs
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS trg_audit_capas ON capas;
CREATE TRIGGER trg_audit_capas AFTER INSERT OR UPDATE OR DELETE ON capas
  FOR EACH ROW EXECUTE FUNCTION write_audit_log();

-- ---------------------------------------------------------------------------
-- Block UPDATE / DELETE on the audit_log itself (append-only enforcement)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_log;
CREATE TRIGGER trg_audit_immutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

-- ============================================================================
-- ROW LEVEL SECURITY
-- viewer        → SELECT only
-- quality_engineer → INSERT/UPDATE on defects, ncrs, capas
-- supervisor    → as engineer + verify/close
-- admin         → full control incl. suppliers + deletes
-- ============================================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE capas ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: current user's role
CREATE OR REPLACE FUNCTION current_role_name()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Everyone authenticated can read.
CREATE POLICY p_read_all ON defects FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_all ON ncrs FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_all ON capas FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_all ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_all ON supplier_quality_events FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_all ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY p_read_self ON user_profiles FOR SELECT TO authenticated USING (true);

-- Engineers and above can write defects / ncrs / capas.
CREATE POLICY p_write_defects ON defects FOR INSERT TO authenticated
  WITH CHECK (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));
CREATE POLICY p_update_defects ON defects FOR UPDATE TO authenticated
  USING (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));

CREATE POLICY p_write_ncrs ON ncrs FOR INSERT TO authenticated
  WITH CHECK (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));
CREATE POLICY p_update_ncrs ON ncrs FOR UPDATE TO authenticated
  USING (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));

CREATE POLICY p_write_capas ON capas FOR INSERT TO authenticated
  WITH CHECK (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));
CREATE POLICY p_update_capas ON capas FOR UPDATE TO authenticated
  USING (current_role_name() IN ('quality_engineer', 'supervisor', 'admin'));

-- Only admins manage suppliers and delete anything.
CREATE POLICY p_admin_suppliers ON suppliers FOR ALL TO authenticated
  USING (current_role_name() = 'admin')
  WITH CHECK (current_role_name() = 'admin');

CREATE POLICY p_delete_defects ON defects FOR DELETE TO authenticated
  USING (current_role_name() = 'admin');
CREATE POLICY p_delete_ncrs ON ncrs FOR DELETE TO authenticated
  USING (current_role_name() = 'admin');
CREATE POLICY p_delete_capas ON capas FOR DELETE TO authenticated
  USING (current_role_name() = 'admin');

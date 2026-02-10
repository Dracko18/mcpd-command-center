
-- =============================================
-- PHASE 2: Vehicles, Reports, Internal Affairs
-- =============================================

-- 1. Vehicle Registry
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text NOT NULL,
  make text,
  model text,
  year integer,
  color text,
  vin text,
  owner_name text,
  owner_subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  registration_status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_plate ON public.vehicles (plate_number);
CREATE INDEX idx_vehicles_owner ON public.vehicles (owner_subject_id);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicles"
  ON public.vehicles FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update vehicles"
  ON public.vehicles FOR UPDATE USING (auth.uid() = created_by OR is_admin());

CREATE POLICY "Admin can delete vehicles"
  ON public.vehicles FOR DELETE USING (is_admin());

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number text NOT NULL UNIQUE,
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'incident',
  status text NOT NULL DEFAULT 'draft',
  narrative text,
  location text,
  incident_date timestamptz,
  subject_ids uuid[] DEFAULT '{}',
  vehicle_ids uuid[] DEFAULT '{}',
  officer_id uuid NOT NULL,
  supervisor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_number ON public.reports (report_number);
CREATE INDEX idx_reports_officer ON public.reports (officer_id);
CREATE INDEX idx_reports_status ON public.reports (status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON public.reports FOR SELECT USING (true);

CREATE POLICY "Officers can insert own reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Owner or admin can update reports"
  ON public.reports FOR UPDATE USING (auth.uid() = officer_id OR is_admin());

CREATE POLICY "Admin can delete reports"
  ON public.reports FOR DELETE USING (is_admin());

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Internal Affairs Complaints
CREATE TABLE public.ia_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number text NOT NULL UNIQUE,
  subject_officer_id uuid NOT NULL,
  complainant_name text,
  complainant_type text NOT NULL DEFAULT 'civilian',
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  outcome text,
  assigned_to uuid,
  filed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ia_officer ON public.ia_complaints (subject_officer_id);
CREATE INDEX idx_ia_status ON public.ia_complaints (status);

ALTER TABLE public.ia_complaints ENABLE ROW LEVEL SECURITY;

-- IA complaints: only IA officers and admins can see
CREATE POLICY "IA and admins can read complaints"
  ON public.ia_complaints FOR SELECT
  USING (is_admin() OR has_role(auth.uid(), 'internal_affairs') OR auth.uid() = filed_by);

CREATE POLICY "IA and admins can insert complaints"
  ON public.ia_complaints FOR INSERT
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'internal_affairs'));

CREATE POLICY "IA and admins can update complaints"
  ON public.ia_complaints FOR UPDATE
  USING (is_admin() OR has_role(auth.uid(), 'internal_affairs'));

CREATE POLICY "Admin can delete complaints"
  ON public.ia_complaints FOR DELETE USING (is_admin());

CREATE TRIGGER update_ia_complaints_updated_at
  BEFORE UPDATE ON public.ia_complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate report numbers function
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'RPT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 9999 + 1)::text, 4, '0')
$$;

-- Generate IA complaint numbers function  
CREATE OR REPLACE FUNCTION public.generate_ia_number()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'IA-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 9999 + 1)::text, 4, '0')
$$;

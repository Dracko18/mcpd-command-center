
-- Function to check if user has rank of Comisionado or higher (ranks 10-12)
CREATE OR REPLACE FUNCTION public.is_high_rank()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND rank IN ('Comisionado [CMD]', 'Sub-Director [SUB-DIR]', 'Director General [DIR]')
  )
$$;

-- Update subjects: allow high-rank officers to update/delete any
DROP POLICY IF EXISTS "Owner or admin can update subjects" ON public.subjects;
CREATE POLICY "Owner or admin or high rank can update subjects"
ON public.subjects FOR UPDATE
USING ((auth.uid() = created_by) OR is_admin() OR is_high_rank());

DROP POLICY IF EXISTS "Admin can delete subjects" ON public.subjects;
CREATE POLICY "Admin or high rank can delete subjects"
ON public.subjects FOR DELETE
USING (is_admin() OR is_high_rank());

-- Update vehicles: allow high-rank officers to update/delete any
DROP POLICY IF EXISTS "Owner or admin can update vehicles" ON public.vehicles;
CREATE POLICY "Owner or admin or high rank can update vehicles"
ON public.vehicles FOR UPDATE
USING ((auth.uid() = created_by) OR is_admin() OR is_high_rank());

DROP POLICY IF EXISTS "Admin can delete vehicles" ON public.vehicles;
CREATE POLICY "Admin or high rank can delete vehicles"
ON public.vehicles FOR DELETE
USING (is_admin() OR is_high_rank());

-- Update criminal_records: allow high-rank officers to update/delete any
DROP POLICY IF EXISTS "Owner or admin can update criminal_records" ON public.criminal_records;
CREATE POLICY "Owner or admin or high rank can update criminal_records"
ON public.criminal_records FOR UPDATE
USING ((auth.uid() = officer_id) OR is_admin() OR is_high_rank());

DROP POLICY IF EXISTS "Admin can delete criminal_records" ON public.criminal_records;
CREATE POLICY "Admin or high rank can delete criminal_records"
ON public.criminal_records FOR DELETE
USING (is_admin() OR is_high_rank());

-- Update reports: allow high-rank officers to update/delete any
DROP POLICY IF EXISTS "Owner or admin can update reports" ON public.reports;
CREATE POLICY "Owner or admin or high rank can update reports"
ON public.reports FOR UPDATE
USING ((auth.uid() = officer_id) OR is_admin() OR is_high_rank());

DROP POLICY IF EXISTS "Admin can delete reports" ON public.reports;
CREATE POLICY "Admin or high rank can delete reports"
ON public.reports FOR DELETE
USING (is_admin() OR is_high_rank());


-- =============================================
-- MCPD MDC Database Schema - Phase 1 MVP
-- =============================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('officer', 'supervisor', 'administrator', 'internal_affairs');

-- 2. Divisions table
CREATE TABLE public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default divisions
INSERT INTO public.divisions (name) VALUES 
  ('Patrol'), ('Detectives'), ('SWAT'), ('Internal Affairs');

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  badge_number TEXT NOT NULL UNIQUE,
  rank TEXT NOT NULL DEFAULT 'Officer',
  division_id UUID REFERENCES public.divisions(id),
  status TEXT NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 5. Subjects table (civilian/suspect database)
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  address TEXT,
  phone TEXT,
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Criminal records table
CREATE TABLE public.criminal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID REFERENCES auth.users(id) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  crime_type TEXT NOT NULL,
  description TEXT,
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criminal_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Security definer helper functions
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'administrator')
$$;

-- =============================================
-- RLS Policies
-- =============================================

-- DIVISIONS: all authenticated can read, admins can manage
CREATE POLICY "Authenticated users can read divisions"
  ON public.divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert divisions"
  ON public.divisions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update divisions"
  ON public.divisions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete divisions"
  ON public.divisions FOR DELETE TO authenticated USING (public.is_admin());

-- PROFILES: all authenticated can read, admins can manage, users can update own
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- USER_ROLES: only admins can manage
CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- SUBJECTS: all authenticated can read and create, owner/admin can update/delete
CREATE POLICY "Authenticated users can read subjects"
  ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert subjects"
  ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update subjects"
  ON public.subjects FOR UPDATE TO authenticated 
  USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "Admin can delete subjects"
  ON public.subjects FOR DELETE TO authenticated USING (public.is_admin());

-- CRIMINAL_RECORDS: all authenticated can read and create, owner/admin can update/delete
CREATE POLICY "Authenticated users can read criminal_records"
  ON public.criminal_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert criminal_records"
  ON public.criminal_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = officer_id);
CREATE POLICY "Owner or admin can update criminal_records"
  ON public.criminal_records FOR UPDATE TO authenticated 
  USING (auth.uid() = officer_id OR public.is_admin());
CREATE POLICY "Admin can delete criminal_records"
  ON public.criminal_records FOR DELETE TO authenticated USING (public.is_admin());

-- =============================================
-- Updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_criminal_records_updated_at
  BEFORE UPDATE ON public.criminal_records FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

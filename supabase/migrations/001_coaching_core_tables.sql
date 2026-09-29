-- ====================================================================
-- 001_coaching_core_tables.sql
-- Part 1: extensions, tables, indexes, triggers.
-- Idempotent — safe to run more than once.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------- 1. INSTITUTES
CREATE TABLE IF NOT EXISTS public.institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  favicon_url TEXT,
  hero_title TEXT NOT NULL DEFAULT '',
  hero_description TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  google_maps_url TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  opening_hours TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',
  admission_contact TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#2563eb',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutes_slug ON public.institutes (slug);

-- ---------------------------------------------------------------- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE RESTRICT,
  full_name TEXT,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_institute_id ON public.profiles (institute_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- Exactly one owner can ever exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_single_owner
  ON public.profiles ((true))
  WHERE role = 'owner';

-- ---------------------------------------------------------------- 3. USER PERMISSIONS
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_permission UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_institute ON public.user_permissions (institute_id);

-- ---------------------------------------------------------------- 4. SETTINGS (site content)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL UNIQUE REFERENCES public.institutes (id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- 5. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subject_slug UNIQUE (institute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subjects_institute ON public.subjects (institute_id, is_active, display_order);

-- ---------------------------------------------------------------- 6. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  exam TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  original_price NUMERIC(12, 2),
  discount TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'Offline' CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  brochure_url TEXT,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  syllabus JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligibility TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  whatsapp_number TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_course_slug UNIQUE (institute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_courses_institute_active ON public.courses (institute_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses (institute_id, featured, is_active);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses (category);

-- ---------------------------------------------------------------- 7. FACULTY
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  qualification TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  specialization TEXT NOT NULL DEFAULT '',
  achievements TEXT NOT NULL DEFAULT '',
  profile_image TEXT,
  linkedin_url TEXT NOT NULL DEFAULT '',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_faculty_slug UNIQUE (institute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_faculty_institute_active ON public.faculty (institute_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_faculty_featured ON public.faculty (institute_id, featured, is_active);

-- ---------------------------------------------------------------- 8. COURSE <-> FACULTY <-> SUBJECT
CREATE TABLE IF NOT EXISTS public.course_faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty (id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects (id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_course_faculty UNIQUE (course_id, faculty_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_course_faculty_course ON public.course_faculty (course_id);
CREATE INDEX IF NOT EXISTS idx_course_faculty_faculty ON public.course_faculty (faculty_id);

-- ---------------------------------------------------------------- 9. GALLERY
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_institute ON public.gallery_items (institute_id, is_active, display_order);

-- ---------------------------------------------------------------- 10. TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Student',
  photo_url TEXT,
  content TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  course TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_institute ON public.testimonials (institute_id, is_active, display_order);

-- ---------------------------------------------------------------- 11. FAQ
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_institute ON public.faqs (institute_id, is_active, display_order);

-- ---------------------------------------------------------------- 12. ENQUIRIES (basic Part 1 storage)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'contact',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_institute ON public.enquiries (institute_id, created_at DESC);

-- ---------------------------------------------------------------- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_username TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_institute ON public.audit_logs (institute_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- ---------------------------------------------------------------- 14. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at ()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'institutes', 'profiles', 'settings', 'subjects', 'courses',
    'faculty', 'gallery_items', 'testimonials', 'faqs'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

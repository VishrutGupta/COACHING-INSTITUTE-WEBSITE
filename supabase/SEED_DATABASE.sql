-- ====================================================================
-- SEED_DATABASE.sql  (CONSOLIDATED)
-- Coaching Institute Website + Core Admin Platform — Parts 1 & 2
--
-- Run this ENTIRE file once in the Supabase SQL Editor
-- (Dashboard > SQL Editor > New query > Run).
--
-- It is the concatenation of supabase/migrations/001..007 and creates:
--   * tables, indexes, triggers
--   * SECURITY DEFINER helper functions
--   * Row Level Security policies (RLS stays ON)
--   * storage buckets + policies
--   * SEED DATA for the default institute, settings, subjects, FAQs, testimonials
--
-- Part 2 tables: branches, batches, schedule_entries, results,
-- announcements, gallery_albums, plus enquiry workflow columns,
-- gallery albums, testimonial features and their RLS policies.
--
-- It does NOT create a password. Supabase Auth owns credentials.
-- After running it, create the owner account via POST /api/auth/bootstrap
-- (username: administrator).
-- ====================================================================


-- ====================================================================
-- FILE: supabase\migrations\001_coaching_core_tables.sql
-- ====================================================================

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

-- ====================================================================
-- FILE: supabase\migrations\002_coaching_functions.sql
-- ====================================================================

-- ====================================================================
-- 002_coaching_functions.sql
-- SECURITY DEFINER helpers (non-recursive), login lookup, owner guards.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. ROLE / SCOPE HELPERS
CREATE OR REPLACE FUNCTION public.is_owner ()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid () AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager ()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid () AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_institute_id ()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT institute_id FROM public.profiles WHERE id = auth.uid ();
$$;

-- ---------------------------------------------------------------- 2. PERMISSION HELPERS
-- OWNER bypasses every permission check.
CREATE OR REPLACE FUNCTION public.has_permission (p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_owner ()
    OR EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid () AND permission = p_permission
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission (p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'owner'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = p_user_id AND permission = p_permission
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions (p_user_id UUID)
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT permission FROM public.user_permissions WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_owner () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_institute_id () TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission (TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission (UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions (UUID) TO authenticated;

-- ---------------------------------------------------------------- 3. USERNAME -> EMAIL LOOKUP
-- Used by the admin login flow. Supabase Auth owns the password;
-- this function never returns credentials, only the auth email.
CREATE OR REPLACE FUNCTION public.lookup_auth_email_by_username (p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email TEXT;
  v_disabled BOOLEAN;
BEGIN
  SELECT au.email, p.is_disabled
    INTO v_email, v_disabled
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(trim(p_username))
    AND p.role IN ('owner', 'admin', 'staff')
  LIMIT 1;

  IF v_email IS NULL OR v_disabled THEN
    RETURN NULL;
  END IF;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_auth_email_by_username (TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------- 4. OWNER ACCOUNT GUARDS
-- Blocks owner creation / demotion / deletion / disabling from normal sessions.
-- Service role and the SQL editor have no auth.uid() and are allowed.
CREATE OR REPLACE FUNCTION public.protect_owner_profile ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid () IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role = 'owner' THEN
    RAISE EXCEPTION 'Owner accounts cannot be created from the application.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
      RAISE EXCEPTION 'The owner account cannot be demoted.';
    END IF;
    IF OLD.role <> 'owner' AND NEW.role = 'owner' THEN
      RAISE EXCEPTION 'Accounts cannot be promoted to owner.';
    END IF;
    IF OLD.role = 'owner' AND NEW.institute_id IS DISTINCT FROM OLD.institute_id THEN
      RAISE EXCEPTION 'The owner institute cannot be changed.';
    END IF;
    IF NEW.role = 'owner' AND NEW.is_disabled = true THEN
      RAISE EXCEPTION 'The owner account cannot be disabled.';
    END IF;
    IF OLD.role = 'owner' AND NEW.username IS DISTINCT FROM OLD.username THEN
      RAISE EXCEPTION 'The owner username cannot be changed.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.role = 'owner' THEN
    RAISE EXCEPTION 'The owner account cannot be deleted.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_owner ON public.profiles;
CREATE TRIGGER trg_profiles_protect_owner
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_profile ();

-- ====================================================================
-- FILE: supabase\migrations\003_coaching_rls.sql
-- ====================================================================

-- ====================================================================
-- 003_coaching_rls.sql
-- Row Level Security. RLS stays ON everywhere; no USING(true) on private data.
-- Idempotent — safe to run more than once.
-- ====================================================================

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- INSTITUTES
DROP POLICY IF EXISTS "Public reads active institutes" ON public.institutes;
CREATE POLICY "Public reads active institutes"
  ON public.institutes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Members read own institute" ON public.institutes;
CREATE POLICY "Members read own institute"
  ON public.institutes FOR SELECT
  TO authenticated
  USING (id = public.current_institute_id ());

DROP POLICY IF EXISTS "Settings editors update institute" ON public.institutes;
CREATE POLICY "Settings editors update institute"
  ON public.institutes FOR UPDATE
  TO authenticated
  USING (id = public.current_institute_id () AND public.has_permission ('settings.edit'))
  WITH CHECK (id = public.current_institute_id () AND public.has_permission ('settings.edit'));

-- ---------------------------------------------------------------- PROFILES
-- Read-only for users. Writes happen server-side via the service role,
-- which is the only path that can create ADMIN/STAFF accounts.
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid ());

DROP POLICY IF EXISTS "Users view institute profiles" ON public.profiles;
CREATE POLICY "Users view institute profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('users.view')
  );

-- ---------------------------------------------------------------- USER PERMISSIONS
DROP POLICY IF EXISTS "Users read own permissions" ON public.user_permissions;
CREATE POLICY "Users read own permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid ());

DROP POLICY IF EXISTS "Users view institute permissions" ON public.user_permissions;
CREATE POLICY "Users view institute permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('users.view')
  );

DROP POLICY IF EXISTS "Users editors insert permissions" ON public.user_permissions;
CREATE POLICY "Users editors insert permissions"
  ON public.user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('users.edit')
  );

DROP POLICY IF EXISTS "Users editors delete permissions" ON public.user_permissions;
CREATE POLICY "Users editors delete permissions"
  ON public.user_permissions FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('users.edit')
  );

-- ---------------------------------------------------------------- SETTINGS (site content is public)
DROP POLICY IF EXISTS "Public reads settings" ON public.settings;
CREATE POLICY "Public reads settings"
  ON public.settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Settings editors insert settings" ON public.settings;
CREATE POLICY "Settings editors insert settings"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('settings.edit')
  );

DROP POLICY IF EXISTS "Settings editors update settings" ON public.settings;
CREATE POLICY "Settings editors update settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('settings.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('settings.edit')
  );

DROP POLICY IF EXISTS "Settings editors delete settings" ON public.settings;
CREATE POLICY "Settings editors delete settings"
  ON public.settings FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('settings.edit')
  );

-- ---------------------------------------------------------------- SUBJECTS
DROP POLICY IF EXISTS "Public reads active subjects" ON public.subjects;
CREATE POLICY "Public reads active subjects"
  ON public.subjects FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Subjects viewers read all subjects" ON public.subjects;
CREATE POLICY "Subjects viewers read all subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('subjects.view')
  );

DROP POLICY IF EXISTS "Subjects creators insert" ON public.subjects;
CREATE POLICY "Subjects creators insert"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('subjects.create')
  );

DROP POLICY IF EXISTS "Subjects editors update" ON public.subjects;
CREATE POLICY "Subjects editors update"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('subjects.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('subjects.edit')
  );

DROP POLICY IF EXISTS "Subjects deleters delete" ON public.subjects;
CREATE POLICY "Subjects deleters delete"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('subjects.delete')
  );

-- ---------------------------------------------------------------- COURSES
DROP POLICY IF EXISTS "Public reads active courses" ON public.courses;
CREATE POLICY "Public reads active courses"
  ON public.courses FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Courses viewers read all courses" ON public.courses;
CREATE POLICY "Courses viewers read all courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.view')
  );

DROP POLICY IF EXISTS "Courses creators insert" ON public.courses;
CREATE POLICY "Courses creators insert"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.create')
  );

DROP POLICY IF EXISTS "Courses editors update" ON public.courses;
CREATE POLICY "Courses editors update"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.edit')
  );

DROP POLICY IF EXISTS "Courses deleters delete" ON public.courses;
CREATE POLICY "Courses deleters delete"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.delete')
  );

-- ---------------------------------------------------------------- FACULTY
DROP POLICY IF EXISTS "Public reads active faculty" ON public.faculty;
CREATE POLICY "Public reads active faculty"
  ON public.faculty FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Faculty viewers read all faculty" ON public.faculty;
CREATE POLICY "Faculty viewers read all faculty"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faculty.view')
  );

DROP POLICY IF EXISTS "Faculty creators insert" ON public.faculty;
CREATE POLICY "Faculty creators insert"
  ON public.faculty FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faculty.create')
  );

DROP POLICY IF EXISTS "Faculty editors update" ON public.faculty;
CREATE POLICY "Faculty editors update"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faculty.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faculty.edit')
  );

DROP POLICY IF EXISTS "Faculty deleters delete" ON public.faculty;
CREATE POLICY "Faculty deleters delete"
  ON public.faculty FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faculty.delete')
  );

-- ---------------------------------------------------------------- COURSE <-> FACULTY
DROP POLICY IF EXISTS "Public reads published course faculty" ON public.course_faculty;
CREATE POLICY "Public reads published course faculty"
  ON public.course_faculty FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM public.faculty f
      WHERE f.id = faculty_id AND f.is_active = true
    )
  );

DROP POLICY IF EXISTS "Courses editors read mappings" ON public.course_faculty;
CREATE POLICY "Courses editors read mappings"
  ON public.course_faculty FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.view')
  );

DROP POLICY IF EXISTS "Courses editors insert mappings" ON public.course_faculty;
CREATE POLICY "Courses editors insert mappings"
  ON public.course_faculty FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.edit')
  );

DROP POLICY IF EXISTS "Courses editors delete mappings" ON public.course_faculty;
CREATE POLICY "Courses editors delete mappings"
  ON public.course_faculty FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('courses.edit')
  );

-- ---------------------------------------------------------------- GALLERY
DROP POLICY IF EXISTS "Public reads active gallery" ON public.gallery_items;
CREATE POLICY "Public reads active gallery"
  ON public.gallery_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated members read gallery" ON public.gallery_items;
CREATE POLICY "Authenticated members read gallery"
  ON public.gallery_items FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members insert gallery" ON public.gallery_items;
CREATE POLICY "Institute members insert gallery"
  ON public.gallery_items FOR INSERT
  TO authenticated
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members update gallery" ON public.gallery_items;
CREATE POLICY "Institute members update gallery"
  ON public.gallery_items FOR UPDATE
  TO authenticated
  USING (institute_id = public.current_institute_id ())
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete gallery" ON public.gallery_items;
CREATE POLICY "Institute members delete gallery"
  ON public.gallery_items FOR DELETE
  TO authenticated
  USING (institute_id = public.current_institute_id ());

-- ---------------------------------------------------------------- TESTIMONIALS
DROP POLICY IF EXISTS "Public reads active testimonials" ON public.testimonials;
CREATE POLICY "Public reads active testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated members read testimonials" ON public.testimonials;
CREATE POLICY "Authenticated members read testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members insert testimonials" ON public.testimonials;
CREATE POLICY "Institute members insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members update testimonials" ON public.testimonials;
CREATE POLICY "Institute members update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (institute_id = public.current_institute_id ())
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete testimonials" ON public.testimonials;
CREATE POLICY "Institute members delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (institute_id = public.current_institute_id ());

-- ---------------------------------------------------------------- FAQ
DROP POLICY IF EXISTS "Public reads active faqs" ON public.faqs;
CREATE POLICY "Public reads active faqs"
  ON public.faqs FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated members read faqs" ON public.faqs;
CREATE POLICY "Authenticated members read faqs"
  ON public.faqs FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members insert faqs" ON public.faqs;
CREATE POLICY "Institute members insert faqs"
  ON public.faqs FOR INSERT
  TO authenticated
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members update faqs" ON public.faqs;
CREATE POLICY "Institute members update faqs"
  ON public.faqs FOR UPDATE
  TO authenticated
  USING (institute_id = public.current_institute_id ())
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete faqs" ON public.faqs;
CREATE POLICY "Institute members delete faqs"
  ON public.faqs FOR DELETE
  TO authenticated
  USING (institute_id = public.current_institute_id ());

-- ---------------------------------------------------------------- ENQUIRIES
DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;
CREATE POLICY "Anyone can submit an enquiry"
  ON public.enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (institute_id IS NOT NULL);

DROP POLICY IF EXISTS "Managers read enquiries" ON public.enquiries;
CREATE POLICY "Managers read enquiries"
  ON public.enquiries FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.is_manager ()
  );

DROP POLICY IF EXISTS "Managers update enquiries" ON public.enquiries;
CREATE POLICY "Managers update enquiries"
  ON public.enquiries FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.is_manager ()
  )
  WITH CHECK (institute_id = public.current_institute_id ());

-- ---------------------------------------------------------------- AUDIT LOGS
DROP POLICY IF EXISTS "Logs viewers read audit logs" ON public.audit_logs;
CREATE POLICY "Logs viewers read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('logs.view')
  );

DROP POLICY IF EXISTS "Institute members append audit logs" ON public.audit_logs;
CREATE POLICY "Institute members append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (institute_id = public.current_institute_id ());

-- Append-only: no UPDATE or DELETE policies exist for audit_logs.

-- ====================================================================
-- FILE: supabase\migrations\004_coaching_storage.sql
-- ====================================================================

-- ====================================================================
-- 004_coaching_storage.sql
-- Storage buckets + storage.objects policies for the coaching platform.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('institute-assets', 'institute-assets', true),
  ('course-images', 'course-images', true),
  ('course-brochures', 'course-brochures', true),
  ('faculty-photos', 'faculty-photos', true),
  ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ---------------------------------------------------------------- 2. READ POLICIES (public content buckets)
DROP POLICY IF EXISTS "Public read institute-assets" ON storage.objects;
CREATE POLICY "Public read institute-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images'));

-- ---------------------------------------------------------------- 3. WRITE POLICIES (authenticated + permission gated)
-- No service-role key is ever required for ordinary uploads: the signed-in
-- user's own session writes through RLS on storage.objects.
DROP POLICY IF EXISTS "Storage upload permission" ON storage.objects;
CREATE POLICY "Storage upload permission"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  );

DROP POLICY IF EXISTS "Storage update permission" ON storage.objects;
CREATE POLICY "Storage update permission"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  )
  WITH CHECK (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.upload')
  );

DROP POLICY IF EXISTS "Storage delete permission" ON storage.objects;
CREATE POLICY "Storage delete permission"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('institute-assets', 'course-images', 'course-brochures', 'faculty-photos', 'gallery-images')
    AND public.has_permission ('storage.delete')
  );

-- ====================================================================
-- FILE: supabase\migrations\005_coaching_seed.sql
-- ====================================================================

-- ====================================================================
-- 005_coaching_seed.sql
-- Part 1 seed data. Everything here is clearly marked SEED DATA and can
-- be edited later from /admin/settings.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. SEED DATA: default institute
INSERT INTO public.institutes (
  name, slug, tagline, hero_title, hero_description,
  address, phone, whatsapp, email, google_maps_url,
  opening_hours, footer_text, admission_contact, accent_color,
  seo_title, seo_description, is_active
)
VALUES (
  'My Coaching Institute',
  'my-coaching-institute',
  'Learn better. Score higher.',
  'Achieve your academic and competitive exam goals with expert faculty and structured preparation.',
  'Classroom and online coaching for school, board and competitive examinations — with small batches, regular testing and personal mentoring.',
  '123 Knowledge Park, Main Road, Your City, India',
  '+91 98765 43210',
  '+91 98765 43210',
  'admissions@mycoachinginstitute.in',
  'https://maps.google.com/',
  'Mon - Sat: 8:00 AM - 8:00 PM',
  'Admissions open for the new session. Contact us for a free counselling call.',
  '+91 98765 43210',
  '#2563eb',
  'My Coaching Institute — Admissions Open',
  'Join My Coaching Institute for expert-led coaching, small batches and proven results in school, board and competitive examinations.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------- 2. SEED DATA: site settings
INSERT INTO public.settings (institute_id, data)
SELECT
  i.id,
  '{
    "stats": [
      { "label": "Students", "value": "10,000+" },
      { "label": "Faculty", "value": "50+" },
      { "label": "Courses", "value": "25+" },
      { "label": "Years Experience", "value": "12+" }
    ],
    "why_choose_us": [
      {
        "title": "Expert Faculty",
        "description": "Learn from experienced educators who specialise in their subjects and understand exam patterns deeply."
      },
      {
        "title": "Proven Results",
        "description": "A consistent track record of selections in competitive exams thanks to structured teaching and practice."
      },
      {
        "title": "Personal Attention",
        "description": "Small batches, regular doubt sessions and individual performance tracking for every student."
      },
      {
        "title": "Flexible Learning",
        "description": "Online, offline and hybrid modes so you can learn from anywhere without compromising quality."
      }
    ],
    "about": {
      "introduction": "We are a modern coaching institute committed to helping students build strong fundamentals, exam readiness and long-term confidence.",
      "vision": "To be the most trusted learning destination for students pursuing academic and competitive excellence.",
      "mission": "To deliver concept-driven teaching, consistent practice and honest mentorship that turns effort into results.",
      "why_choose_us": "Structured batches, experienced faculty, regular assessment and a supportive learning environment.",
      "teaching_philosophy": "Clarity before speed: understand the concept, practise deliberately, and revise consistently.",
      "experience": "Years of classroom experience across school, board and competitive examination preparation.",
      "achievements": "Thousands of selections, top ranks and students who went on to reputed colleges and universities.",
      "cta": "Talk to our counsellors and find the right batch for your goals."
    }
  }'::jsonb
FROM public.institutes i
WHERE i.slug = 'my-coaching-institute'
ON CONFLICT (institute_id) DO NOTHING;

-- ---------------------------------------------------------------- 3. SEED DATA: subjects
INSERT INTO public.subjects (institute_id, name, slug, description, display_order, is_active)
SELECT
  i.id,
  s.name,
  s.slug,
  s.description,
  s.ord,
  true
FROM public.institutes i
CROSS JOIN (
  VALUES
    ('Physics', 'physics', 'Mechanics, optics, electricity, modern physics and problem-solving practice.', 1),
    ('Chemistry', 'chemistry', 'Physical, organic and inorganic chemistry with reaction maps and numericals.', 2),
    ('Mathematics', 'mathematics', 'Algebra, calculus, coordinate geometry, vectors and advanced problem solving.', 3),
    ('Biology', 'biology', 'Cell biology, genetics, physiology, ecology and NCERT-based conceptual clarity.', 4),
    ('English', 'english', 'Reading comprehension, grammar, vocabulary and writing skills.', 5),
    ('Reasoning', 'reasoning', 'Verbal, non-verbal and analytical reasoning for competitive exams.', 6),
    ('General Knowledge', 'general-knowledge', 'Current affairs, static GK and curated monthly compilations.', 7),
    ('Quantitative Aptitude', 'quantitative-aptitude', 'Arithmetic, data interpretation and speed-math techniques.', 8)
) AS s (name, slug, description, ord)
WHERE i.slug = 'my-coaching-institute'
ON CONFLICT (institute_id, slug) DO NOTHING;

-- ---------------------------------------------------------------- 4. SEED DATA: FAQs
INSERT INTO public.faqs (institute_id, question, answer, display_order, is_active)
SELECT
  i.id,
  f.question,
  f.answer,
  f.ord,
  true
FROM public.institutes i
CROSS JOIN (
  VALUES
    ('How do I enrol in a course?', 'Pick a course from the Courses page and use the Enquire Now button or WhatsApp us. Our counsellor will call you back with batch details and fee options.', 1),
    ('Do you offer online classes?', 'Yes. Most courses are available in Online, Offline and Hybrid modes so you can choose what fits your schedule.', 2),
    ('What is the batch size?', 'We keep batches small so every student gets attention, along with regular doubt-clearing sessions.', 3),
    ('Is there a demo class?', 'Yes, you can request a demo class before enrolling. Mention it in the enquiry form and we will arrange it.', 4),
    ('How are tests and results shared?', 'Weekly and monthly tests are conducted, and performance reports are shared with students and parents.', 5),
    ('Can I get a course brochure?', 'Yes. Open any course page and use the Download Brochure button to get the complete PDF.', 6)
) AS f (question, answer, ord)
WHERE i.slug = 'my-coaching-institute'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- 5. SEED DATA: testimonials
INSERT INTO public.testimonials (institute_id, name, role, content, rating, course, year, display_order, is_active)
SELECT
  i.id,
  t.name,
  t.role,
  t.content,
  t.rating,
  t.course,
  t.year,
  t.ord,
  true
FROM public.institutes i
CROSS JOIN (
  VALUES
    ('Aarav Sharma', 'Student', 'The faculty explained every concept from scratch and the weekly tests really improved my accuracy.', 5, 'JEE Foundation', '2025', 1),
    ('Priya Nair', 'Parent', 'Regular progress reports and personal attention made a visible difference in my daughter''s confidence.', 5, 'NEET Classic', '2025', 2),
    ('Rohan Verma', 'Alumni', 'Structured study material and doubt sessions helped me stay consistent through the whole year.', 4, 'Foundation Batch', '2024', 3)
) AS t (name, role, content, rating, course, year, ord)
WHERE i.slug = 'my-coaching-institute'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------- 6. OWNER ACCOUNT
-- Supabase Auth owns the password; nothing is stored in public tables.
--
-- After running this file, create the owner account ONE of these ways:
--
--   A) Recommended: start the app and call the one-time bootstrap endpoint
--      POST /api/auth/bootstrap
--      { "username": "administrator", "password": "Admin@123" }
--      It refuses to run once an owner already exists.
--
--   B) Supabase Dashboard > Authentication > Users > "Add user"
--      (set email + password, "Auto Confirm" = ON), then insert the matching
--      profile row with role = 'owner' using the SQL Editor.
--
-- Never store a password in public tables.

-- ====================================================================
-- FILE: supabase\migrations\006_part2_tables.sql
-- ====================================================================

-- ====================================================================
-- 006_part2_tables.sql
-- Part 2: branches, batches, schedule, results, announcements,
-- gallery albums, advanced enquiries and testimonial features.
-- Idempotent — safe to run more than once.
-- ====================================================================

-- ---------------------------------------------------------------- 1. BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  maps_url TEXT NOT NULL DEFAULT '',
  opening_hours TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_branch_slug UNIQUE (institute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_branches_institute ON public.branches (institute_id, is_active, display_order);

-- ---------------------------------------------------------------- 2. BRANCH ASSOCIATIONS
CREATE TABLE IF NOT EXISTS public.branch_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_branch_course UNIQUE (branch_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_courses_branch ON public.branch_courses (branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_courses_course ON public.branch_courses (course_id);

CREATE TABLE IF NOT EXISTS public.branch_faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_branch_faculty UNIQUE (branch_id, faculty_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_faculty_branch ON public.branch_faculty (branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_faculty_faculty ON public.branch_faculty (faculty_id);

-- ---------------------------------------------------------------- 3. BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES public.faculty (id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches (id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'Offline' CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
  capacity INT NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_institute ON public.batches (institute_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_batches_course ON public.batches (course_id);
CREATE INDEX IF NOT EXISTS idx_batches_start ON public.batches (start_date);

-- ---------------------------------------------------------------- 4. SCHEDULE / TIMETABLE
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches (id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects (id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES public.faculty (id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches (id) ON DELETE SET NULL,
  day TEXT NOT NULL DEFAULT '',
  date DATE,
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'Offline' CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_institute ON public.schedule_entries (institute_id, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_schedule_faculty ON public.schedule_entries (faculty_id, day, start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON public.schedule_entries (date);
CREATE INDEX IF NOT EXISTS idx_schedule_batch ON public.schedule_entries (batch_id);

-- ---------------------------------------------------------------- 5. RESULTS
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  exam TEXT NOT NULL DEFAULT '',
  year INT,
  rank TEXT NOT NULL DEFAULT '',
  percentile TEXT NOT NULL DEFAULT '',
  score TEXT NOT NULL DEFAULT '',
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  image_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_results_institute ON public.results (institute_id, is_active, year DESC NULLS LAST);

-- ---------------------------------------------------------------- 6. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'important' CHECK (
    category IN ('new_batch', 'admission', 'results', 'holiday', 'exam', 'important')
  ),
  publish_date DATE,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_institute ON public.announcements (institute_id, is_active, publish_date DESC);

-- ---------------------------------------------------------------- 7. GALLERY ALBUMS
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES public.institutes (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_albums_institute ON public.gallery_albums (institute_id, is_active, display_order);

ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.gallery_albums (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_items_album ON public.gallery_items (album_id);

-- ---------------------------------------------------------------- 8. ENQUIRY WORKFLOW
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS preferred_batch TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS chk_enquiry_status;
ALTER TABLE public.enquiries ADD CONSTRAINT chk_enquiry_status
  CHECK (status IN ('new', 'contacted', 'follow_up', 'interested', 'converted', 'closed'));

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries (institute_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned ON public.enquiries (assigned_to);

-- ---------------------------------------------------------------- 9. TESTIMONIAL FEATURES
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------- 10. UPDATED_AT TRIGGERS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'branches', 'batches', 'schedule_entries', 'results',
    'announcements', 'gallery_albums', 'enquiries'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ====================================================================
-- FILE: supabase\migrations\007_part2_rls.sql
-- ====================================================================

-- ====================================================================
-- 007_part2_rls.sql
-- Row Level Security for Part 2 tables. RLS stays ON everywhere;
-- no USING(true) on private data. Idempotent — safe to run twice.
-- ====================================================================

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------- BRANCHES
DROP POLICY IF EXISTS "Public reads active branches" ON public.branches;
CREATE POLICY "Public reads active branches"
  ON public.branches FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Branches viewers read all branches" ON public.branches;
CREATE POLICY "Branches viewers read all branches"
  ON public.branches FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('branches.view')
  );

DROP POLICY IF EXISTS "Branches creators insert" ON public.branches;
CREATE POLICY "Branches creators insert"
  ON public.branches FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('branches.create')
  );

DROP POLICY IF EXISTS "Branches editors update" ON public.branches;
CREATE POLICY "Branches editors update"
  ON public.branches FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('branches.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('branches.edit')
  );

DROP POLICY IF EXISTS "Branches deleters delete" ON public.branches;
CREATE POLICY "Branches deleters delete"
  ON public.branches FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('branches.delete')
  );

-- ------------------------------------------------------ BRANCH ASSOCIATIONS
-- Not publicly readable: the public site fetches the related courses and
-- faculty directly through their own public policies.
DROP POLICY IF EXISTS "Public reads branch courses" ON public.branch_courses;
DROP POLICY IF EXISTS "Public reads branch faculty" ON public.branch_faculty;

DROP POLICY IF EXISTS "Institute members read branch courses" ON public.branch_courses;
CREATE POLICY "Institute members read branch courses"
  ON public.branch_courses FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Branches editors write branch courses" ON public.branch_courses;
CREATE POLICY "Branches editors write branch courses"
  ON public.branch_courses FOR ALL
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND (
      public.has_permission ('branches.create')
      OR public.has_permission ('branches.edit')
      OR public.has_permission ('branches.delete')
    )
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND (
      public.has_permission ('branches.create')
      OR public.has_permission ('branches.edit')
      OR public.has_permission ('branches.delete')
    )
  );

DROP POLICY IF EXISTS "Institute members read branch faculty" ON public.branch_faculty;
CREATE POLICY "Institute members read branch faculty"
  ON public.branch_faculty FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Branches editors write branch faculty" ON public.branch_faculty;
CREATE POLICY "Branches editors write branch faculty"
  ON public.branch_faculty FOR ALL
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND (
      public.has_permission ('branches.create')
      OR public.has_permission ('branches.edit')
      OR public.has_permission ('branches.delete')
    )
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND (
      public.has_permission ('branches.create')
      OR public.has_permission ('branches.edit')
      OR public.has_permission ('branches.delete')
    )
  );

-- ---------------------------------------------------------------- BATCHES
DROP POLICY IF EXISTS "Public reads published batches" ON public.batches;
CREATE POLICY "Public reads published batches"
  ON public.batches FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Batches viewers read all batches" ON public.batches;
CREATE POLICY "Batches viewers read all batches"
  ON public.batches FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('batches.view')
  );

DROP POLICY IF EXISTS "Batches creators insert" ON public.batches;
CREATE POLICY "Batches creators insert"
  ON public.batches FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('batches.create')
  );

DROP POLICY IF EXISTS "Batches editors update" ON public.batches;
CREATE POLICY "Batches editors update"
  ON public.batches FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('batches.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('batches.edit')
  );

DROP POLICY IF EXISTS "Batches deleters delete" ON public.batches;
CREATE POLICY "Batches deleters delete"
  ON public.batches FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('batches.delete')
  );

-- ---------------------------------------------------------------- SCHEDULE
DROP POLICY IF EXISTS "Public reads active schedule" ON public.schedule_entries;
CREATE POLICY "Public reads active schedule"
  ON public.schedule_entries FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Schedule viewers read all entries" ON public.schedule_entries;
CREATE POLICY "Schedule viewers read all entries"
  ON public.schedule_entries FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('schedule.view')
  );

DROP POLICY IF EXISTS "Schedule creators insert" ON public.schedule_entries;
CREATE POLICY "Schedule creators insert"
  ON public.schedule_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('schedule.create')
  );

DROP POLICY IF EXISTS "Schedule editors update" ON public.schedule_entries;
CREATE POLICY "Schedule editors update"
  ON public.schedule_entries FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('schedule.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('schedule.edit')
  );

DROP POLICY IF EXISTS "Schedule deleters delete" ON public.schedule_entries;
CREATE POLICY "Schedule deleters delete"
  ON public.schedule_entries FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('schedule.delete')
  );

-- ---------------------------------------------------------------- RESULTS
DROP POLICY IF EXISTS "Public reads active results" ON public.results;
CREATE POLICY "Public reads active results"
  ON public.results FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Results viewers read all results" ON public.results;
CREATE POLICY "Results viewers read all results"
  ON public.results FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('results.view')
  );

DROP POLICY IF EXISTS "Results creators insert" ON public.results;
CREATE POLICY "Results creators insert"
  ON public.results FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('results.create')
  );

DROP POLICY IF EXISTS "Results editors update" ON public.results;
CREATE POLICY "Results editors update"
  ON public.results FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('results.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('results.edit')
  );

DROP POLICY IF EXISTS "Results deleters delete" ON public.results;
CREATE POLICY "Results deleters delete"
  ON public.results FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('results.delete')
  );

-- ---------------------------------------------------------------- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Public reads published announcements" ON public.announcements;
CREATE POLICY "Public reads published announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Announcements viewers read all" ON public.announcements;
CREATE POLICY "Announcements viewers read all"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('announcements.view')
  );

DROP POLICY IF EXISTS "Announcements creators insert" ON public.announcements;
CREATE POLICY "Announcements creators insert"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('announcements.create')
  );

DROP POLICY IF EXISTS "Announcements editors update" ON public.announcements;
CREATE POLICY "Announcements editors update"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('announcements.edit')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('announcements.edit')
  );

DROP POLICY IF EXISTS "Announcements deleters delete" ON public.announcements;
CREATE POLICY "Announcements deleters delete"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('announcements.delete')
  );

-- ---------------------------------------------------------------- GALLERY ALBUMS
DROP POLICY IF EXISTS "Public reads active albums" ON public.gallery_albums;
CREATE POLICY "Public reads active albums"
  ON public.gallery_albums FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Gallery viewers read all albums" ON public.gallery_albums;
CREATE POLICY "Gallery viewers read all albums"
  ON public.gallery_albums FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.view')
  );

DROP POLICY IF EXISTS "Gallery uploaders insert albums" ON public.gallery_albums;
CREATE POLICY "Gallery uploaders insert albums"
  ON public.gallery_albums FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.upload')
  );

DROP POLICY IF EXISTS "Gallery uploaders update albums" ON public.gallery_albums;
CREATE POLICY "Gallery uploaders update albums"
  ON public.gallery_albums FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.upload')
  )
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.upload')
  );

DROP POLICY IF EXISTS "Gallery deleters delete albums" ON public.gallery_albums;
CREATE POLICY "Gallery deleters delete albums"
  ON public.gallery_albums FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.delete')
  );

-- --------------------------------------------- GALLERY ITEMS (tightened)
DROP POLICY IF EXISTS "Institute members insert gallery" ON public.gallery_items;
CREATE POLICY "Gallery uploaders insert items"
  ON public.gallery_items FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.upload')
  );

DROP POLICY IF EXISTS "Institute members update gallery" ON public.gallery_items;
CREATE POLICY "Gallery uploaders update items"
  ON public.gallery_items FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.upload')
  )
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete gallery" ON public.gallery_items;
CREATE POLICY "Gallery deleters delete items"
  ON public.gallery_items FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('gallery.delete')
  );

DROP POLICY IF EXISTS "Gallery viewers read all items" ON public.gallery_items;
CREATE POLICY "Gallery viewers read all items"
  ON public.gallery_items FOR SELECT
  TO authenticated
  USING (institute_id = public.current_institute_id ());

-- --------------------------------------------- TESTIMONIALS (tightened)
DROP POLICY IF EXISTS "Institute members insert testimonials" ON public.testimonials;
CREATE POLICY "Testimonials creators insert"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('testimonials.create')
  );

DROP POLICY IF EXISTS "Institute members update testimonials" ON public.testimonials;
CREATE POLICY "Testimonials editors update"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('testimonials.edit')
  )
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete testimonials" ON public.testimonials;
CREATE POLICY "Testimonials deleters delete"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('testimonials.delete')
  );

DROP POLICY IF EXISTS "Testimonials viewers read all" ON public.testimonials;
CREATE POLICY "Testimonials viewers read all"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('testimonials.view')
  );

-- --------------------------------------------- FAQ (tightened)
DROP POLICY IF EXISTS "Institute members insert faqs" ON public.faqs;
CREATE POLICY "Faq creators insert"
  ON public.faqs FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faq.create')
  );

DROP POLICY IF EXISTS "Institute members update faqs" ON public.faqs;
CREATE POLICY "Faq editors update"
  ON public.faqs FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faq.edit')
  )
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Institute members delete faqs" ON public.faqs;
CREATE POLICY "Faq deleters delete"
  ON public.faqs FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faq.delete')
  );

DROP POLICY IF EXISTS "Faq viewers read all" ON public.faqs;
CREATE POLICY "Faq viewers read all"
  ON public.faqs FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('faq.view')
  );

-- ---------------------------------------------------------------- ENQUIRIES
-- Public contact form inserts remain allowed (anon, institute id only);
-- authenticated staff creating a lead must hold enquiries.create.
DROP POLICY IF EXISTS "Authenticated staff insert enquiries" ON public.enquiries;
CREATE POLICY "Authenticated staff insert enquiries"
  ON public.enquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('enquiries.create')
  );

DROP POLICY IF EXISTS "Managers read enquiries" ON public.enquiries;
CREATE POLICY "Enquiries viewers read enquiries"
  ON public.enquiries FOR SELECT
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('enquiries.view')
  );

DROP POLICY IF EXISTS "Managers update enquiries" ON public.enquiries;
CREATE POLICY "Enquiries editors update enquiries"
  ON public.enquiries FOR UPDATE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('enquiries.edit')
  )
  WITH CHECK (institute_id = public.current_institute_id ());

DROP POLICY IF EXISTS "Enquiries deleters delete enquiries" ON public.enquiries;
CREATE POLICY "Enquiries deleters delete enquiries"
  ON public.enquiries FOR DELETE
  TO authenticated
  USING (
    institute_id = public.current_institute_id ()
    AND public.has_permission ('enquiries.delete')
  );

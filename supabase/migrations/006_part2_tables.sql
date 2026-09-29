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

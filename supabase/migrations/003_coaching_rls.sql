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

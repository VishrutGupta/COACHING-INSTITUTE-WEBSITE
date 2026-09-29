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

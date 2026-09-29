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

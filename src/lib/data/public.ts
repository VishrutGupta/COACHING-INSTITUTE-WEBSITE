import { createPublicSupabase } from "@/lib/supabase/public";
import { defaultInstituteSlug } from "@/lib/data/settings";
import type {
  Announcement,
  Batch,
  Branch,
  Course,
  Faculty,
  Result,
  ScheduleEntry,
  Subject,
  GalleryItem,
  Testimonial,
  Faq,
} from "@/lib/types";

async function instituteId(): Promise<string | null> {
  const { getInstitute } = await import("@/lib/data/settings");
  const institute = await getInstitute();
  return institute.id || null;
}

export async function getPublishedCourses(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<Course[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("courses")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (options?.featuredOnly) query = query.eq("featured", true);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      console.error("[courses] load failed:", error.message);
      return [];
    }
    return (data as Course[]) || [];
  } catch (err) {
    console.error("[courses] load error:", err);
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("institute_id", id)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[course] load failed:", error.message);
      return null;
    }
    return (data as Course) || null;
  } catch (err) {
    console.error("[course] load error:", err);
    return null;
  }
}

export async function getCourseSlugs(): Promise<string[]> {
  const courses = await getPublishedCourses();
  return courses.map((course) => course.slug);
}

export async function getPublishedFaculty(options?: {
  featuredOnly?: boolean;
}): Promise<Faculty[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("faculty")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (options?.featuredOnly) query = query.eq("featured", true);

    const { data, error } = await query;
    if (error) {
      console.error("[faculty] load failed:", error.message);
      return [];
    }
    return (data as Faculty[]) || [];
  } catch (err) {
    console.error("[faculty] load error:", err);
    return [];
  }
}

export async function getFacultyBySlug(slug: string): Promise<Faculty | null> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("faculty")
      .select("*")
      .eq("institute_id", id)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[faculty member] load failed:", error.message);
      return null;
    }
    return (data as Faculty) || null;
  } catch (err) {
    console.error("[faculty member] load error:", err);
    return null;
  }
}

export async function getFacultySlugs(): Promise<string[]> {
  const faculty = await getPublishedFaculty();
  return faculty.map((member) => member.slug);
}

/** Courses taught by a faculty member via the course_faculty join table. */
export async function getCoursesForFaculty(facultyId: string): Promise<Course[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("course_faculty")
      .select("courses(*)")
      .eq("institute_id", id)
      .eq("faculty_id", facultyId);

    if (error) {
      console.error("[faculty courses] load failed:", error.message);
      return [];
    }

    const rows = (data || []) as unknown as { courses: Course | null }[];
    return rows
      .map((row) => row.courses)
      .filter((course): course is Course => Boolean(course && course.is_active));
  } catch (err) {
    console.error("[faculty courses] load error:", err);
    return [];
  }
}

export interface CourseFacultyRow {
  faculty: Faculty;
  subject: Subject | null;
}

/** Faculty mapped to a course (with the subject they teach). */
export async function getFacultyForCourse(courseId: string): Promise<CourseFacultyRow[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("course_faculty")
      .select("faculty:faculty_id(*), subject:subject_id(*)")
      .eq("institute_id", id)
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[course faculty] load failed:", error.message);
      return [];
    }

    const rows = (data || []) as unknown as {
      faculty: Faculty | null;
      subject: Subject | null;
    }[];

    return rows
      .filter((row) => row.faculty && row.faculty.is_active)
      .map((row) => ({ faculty: row.faculty as Faculty, subject: row.subject }));
  } catch (err) {
    console.error("[course faculty] load error:", err);
    return [];
  }
}

export async function getActiveSubjects(): Promise<Subject[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[subjects] load failed:", error.message);
      return [];
    }
    return (data as Subject[]) || [];
  } catch (err) {
    console.error("[subjects] load error:", err);
    return [];
  }
}

export async function getGalleryItems(limit?: number): Promise<GalleryItem[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("gallery_items")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[gallery] load failed:", error.message);
      return [];
    }
    return (data as GalleryItem[]) || [];
  } catch (err) {
    console.error("[gallery] load error:", err);
    return [];
  }
}

export async function getActiveTestimonials(limit?: number): Promise<Testimonial[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("testimonials")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[testimonials] load failed:", error.message);
      return [];
    }
    return (data as Testimonial[]) || [];
  } catch (err) {
    console.error("[testimonials] load error:", err);
    return [];
  }
}

export async function getActiveFaqs(limit?: number): Promise<Faq[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("faqs")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[faqs] load failed:", error.message);
      return [];
    }
    return (data as Faq[]) || [];
  } catch (err) {
    console.error("[faqs] load error:", err);
    return [];
  }
}

/** Active branches for public filters and location sections. */
export async function getActiveBranches(): Promise<Branch[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[branches] load failed:", error.message);
      return [];
    }
    return (data as Branch[]) || [];
  } catch (err) {
    console.error("[branches] load error:", err);
    return [];
  }
}

export { defaultInstituteSlug };

/** Published batches with course/faculty/branch labels for the public site. */
export interface PublicBatch extends Batch {
  course: { id: string; title: string; slug: string } | null;
  faculty: { id: string; name: string; slug: string } | null;
  branch: { id: string; name: string } | null;
}

export async function getPublishedBatches(): Promise<PublicBatch[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("batches")
      .select("*, course:course_id(id, title, slug), faculty:faculty_id(id, name, slug), branch:branch_id(id, name)")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[batches] load failed:", error.message);
      return [];
    }
    return (data as unknown as PublicBatch[]) || [];
  } catch (err) {
    console.error("[batches] load error:", err);
    return [];
  }
}

/** Active schedule entries with relation labels; optional public filters. */
export interface PublicScheduleEntry extends ScheduleEntry {
  course: { id: string; title: string } | null;
  batch: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  faculty: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
}

export async function getPublicSchedule(filters?: {
  courseId?: string;
  facultyId?: string;
  day?: string;
  branchId?: string;
}): Promise<PublicScheduleEntry[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("schedule_entries")
      .select(
        "*, course:course_id(id, title), batch:batch_id(id, name), subject:subject_id(id, name), faculty:faculty_id(id, name), branch:branch_id(id, name)"
      )
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("start_time", { ascending: true });

    if (filters?.courseId) query = query.eq("course_id", filters.courseId);
    if (filters?.facultyId) query = query.eq("faculty_id", filters.facultyId);
    if (filters?.day) query = query.eq("day", filters.day);
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);

    const { data, error } = await query;
    if (error) {
      console.error("[schedule] load failed:", error.message);
      return [];
    }
    return (data as unknown as PublicScheduleEntry[]) || [];
  } catch (err) {
    console.error("[schedule] load error:", err);
    return [];
  }
}

/** Active results, newest year first. */
export interface PublicResult extends Result {
  course: { id: string; title: string } | null;
}

export async function getPublishedResults(limit?: number): Promise<PublicResult[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("results")
      .select("*, course:course_id(id, title)")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("year", { ascending: false, nullsFirst: false })
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[results] load failed:", error.message);
      return [];
    }
    return (data as unknown as PublicResult[]) || [];
  } catch (err) {
    console.error("[results] load error:", err);
    return [];
  }
}

/** Announcements that are active, published and not expired. */
export async function getLiveAnnouncements(limit?: number): Promise<Announcement[]> {
  const id = await instituteId();
  const supabase = createPublicSupabase();
  if (!id || !supabase) return [];

  try {
    let query = supabase
      .from("announcements")
      .select("*")
      .eq("institute_id", id)
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("publish_date", { ascending: false, nullsFirst: false })
      .order("display_order", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[announcements] load failed:", error.message);
      return [];
    }

    const today = new Date().toISOString().slice(0, 10);
    return ((data as Announcement[]) || []).filter((row) => {
      if (row.publish_date && row.publish_date > today) return false;
      if (row.expiry_date && row.expiry_date < today) return false;
      return true;
    });
  } catch (err) {
    console.error("[announcements] load error:", err);
    return [];
  }
}

export type Role = "owner" | "admin" | "staff";

export type CourseMode = "Online" | "Offline" | "Hybrid";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  instituteId: string;
  isDisabled: boolean;
  permissions: string[];
}

export interface Institute {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_title: string;
  hero_description: string;
  hero_image_url: string | null;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  google_maps_url: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  opening_hours: string;
  footer_text: string;
  admission_contact: string;
  accent_color: string;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  institute_id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  exam: string;
  target_audience: string;
  duration: string;
  fee: number;
  original_price: number | null;
  discount: string;
  mode: CourseMode;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  brochure_url: string | null;
  highlights: string[];
  syllabus: string[];
  eligibility: string;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  whatsapp_number: string;
  seo_title: string;
  seo_description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  institute_id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Faculty {
  id: string;
  institute_id: string;
  name: string;
  slug: string;
  designation: string;
  subject: string;
  qualification: string;
  experience: string;
  bio: string;
  specialization: string;
  achievements: string;
  profile_image: string | null;
  linkedin_url: string;
  social_links: Record<string, string>;
  display_order: number;
  is_active: boolean;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseFaculty {
  id: string;
  institute_id: string;
  course_id: string;
  faculty_id: string;
  subject_id: string | null;
  display_order: number;
}

export interface GalleryItem {
  id: string;
  institute_id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  album_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Testimonial {
  id: string;
  institute_id: string;
  name: string;
  role: string;
  photo_url: string | null;
  content: string;
  rating: number;
  course: string;
  year: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Faq {
  id: string;
  institute_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Enquiry {
  id?: string;
  institute_id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  course_id?: string | null;
  source: string;
  status?: string;
  preferred_batch?: string;
  assigned_to?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "interested"
  | "converted"
  | "closed";

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "new",
  "contacted",
  "follow_up",
  "interested",
  "converted",
  "closed",
];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  interested: "Interested",
  converted: "Converted",
  closed: "Closed",
};

export interface Branch {
  id: string;
  institute_id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  maps_url: string;
  opening_hours: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  course_id: string | null;
  faculty_id: string | null;
  branch_id: string | null;
  start_date: string | null;
  end_date: string | null;
  days: string[];
  start_time: string;
  end_time: string;
  room: string;
  mode: CourseMode;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  description: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleEntry {
  id: string;
  institute_id: string;
  course_id: string | null;
  batch_id: string | null;
  subject_id: string | null;
  faculty_id: string | null;
  branch_id: string | null;
  day: string;
  date: string | null;
  start_time: string;
  end_time: string;
  room: string;
  mode: CourseMode;
  notes: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Result {
  id: string;
  institute_id: string;
  student_name: string;
  exam: string;
  year: number | null;
  rank: string;
  percentile: string;
  score: string;
  course_id: string | null;
  image_url: string | null;
  description: string;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export type AnnouncementCategory =
  | "new_batch"
  | "admission"
  | "results"
  | "holiday"
  | "exam"
  | "important";

export const ANNOUNCEMENT_CATEGORIES: { value: AnnouncementCategory; label: string }[] = [
  { value: "new_batch", label: "New batch" },
  { value: "admission", label: "Admission" },
  { value: "results", label: "Results" },
  { value: "holiday", label: "Holiday" },
  { value: "exam", label: "Exam" },
  { value: "important", label: "Important notice" },
];

export interface Announcement {
  id: string;
  institute_id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: AnnouncementCategory;
  publish_date: string | null;
  expiry_date: string | null;
  is_active: boolean;
  featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryAlbum {
  id: string;
  institute_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  institute_id: string;
  actor_user_id: string | null;
  actor_username: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUserProfile {
  id: string;
  institute_id: string;
  full_name: string;
  username: string;
  role: Role;
  is_disabled: boolean;
  created_at: string;
}

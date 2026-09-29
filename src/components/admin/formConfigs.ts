import type { FormSection } from "@/components/admin/CrudForm";

export const BATCH_FORM: FormSection[] = [
  {
    title: "Batch details",
    fields: [
      { name: "name", label: "Batch name", required: true, placeholder: "JEE Morning Batch" },
      { name: "status", label: "Status", type: "select", options: [
        { value: "upcoming", label: "Upcoming" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ] },
      { name: "mode", label: "Mode", type: "select", options: [
        { value: "Offline", label: "Offline" },
        { value: "Online", label: "Online" },
        { value: "Hybrid", label: "Hybrid" },
      ] },
      { name: "capacity", label: "Seats", type: "number", min: 0, hint: "0 means unlimited" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "description", label: "Description", type: "textarea", rows: 3, span: 2 },
    ],
  },
  {
    title: "Linked records",
    description: "Shown on the public batch, schedule and course pages.",
    fields: [
      { name: "course_id", label: "Course", type: "select", optionLabel: "title" },
      { name: "faculty_id", label: "Lead faculty", type: "select" },
      { name: "branch_id", label: "Branch", type: "select" },
    ],
  },
  {
    title: "Timing",
    fields: [
      { name: "start_time", label: "Start time", type: "time" },
      { name: "end_time", label: "End time", type: "time" },
      { name: "room", label: "Room" },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date" },
      {
        name: "days",
        label: "Days",
        type: "days",
        hint: "Days this batch runs every week.",
      },
    ],
  },
  {
    title: "Publishing",
    fields: [
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const SCHEDULE_FORM: FormSection[] = [
  {
    title: "Class",
    fields: [
      { name: "course_id", label: "Course", type: "select", optionLabel: "title" },
      { name: "batch_id", label: "Batch", type: "select" },
      { name: "subject_id", label: "Subject", type: "select" },
      { name: "faculty_id", label: "Faculty", type: "select" },
      { name: "branch_id", label: "Branch", type: "select" },
      { name: "mode", label: "Mode", type: "select", options: [
        { value: "Offline", label: "Offline" },
        { value: "Online", label: "Online" },
        { value: "Hybrid", label: "Hybrid" },
      ] },
    ],
  },
  {
    title: "When",
    description:
      "Set a recurring day for weekly classes, or a specific date for one-off classes. Conflicts are rejected automatically.",
    fields: [
      { name: "day", label: "Recurring day", type: "select", options: [
        { value: "Monday", label: "Monday" },
        { value: "Tuesday", label: "Tuesday" },
        { value: "Wednesday", label: "Wednesday" },
        { value: "Thursday", label: "Thursday" },
        { value: "Friday", label: "Friday" },
        { value: "Saturday", label: "Saturday" },
        { value: "Sunday", label: "Sunday" },
      ] },
      { name: "date", label: "Specific date", type: "date", hint: "Overrides the recurring day." },
      { name: "start_time", label: "Start time", type: "time", required: true },
      { name: "end_time", label: "End time", type: "time", required: true },
    ],
  },
  {
    title: "Where",
    fields: [
      { name: "room", label: "Room", hint: "Two classes cannot share a room at the same time." },
      { name: "notes", label: "Notes", type: "textarea", rows: 3, span: 2 },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const RESULT_FORM: FormSection[] = [
  {
    title: "Achievement",
    fields: [
      { name: "student_name", label: "Student display name", required: true, hint: "Use a first name + initial to protect privacy." },
      { name: "exam", label: "Exam", placeholder: "JEE Main" },
      { name: "year", label: "Year", type: "number", min: 2000 },
      { name: "rank", label: "Rank", placeholder: "AIR 1200" },
      { name: "percentile", label: "Percentile", placeholder: "99.4" },
      { name: "score", label: "Score", placeholder: "285/300" },
      { name: "course_id", label: "Course", type: "select", optionLabel: "title" },
      { name: "display_order", label: "Display order", type: "number" },
    ],
  },
  {
    title: "Story",
    fields: [
      { name: "description", label: "Short write-up", type: "textarea", rows: 4, span: 2 },
      { name: "image_url", label: "Photo (optional)", type: "media", bucket: "faculty-photos", folder: "results", hint: "Leave empty to keep results anonymous." },
    ],
  },
  {
    title: "Publishing",
    fields: [
      { name: "featured", label: "Featured on the homepage", type: "checkbox" },
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const ANNOUNCEMENT_FORM: FormSection[] = [
  {
    title: "Announcement",
    fields: [
      { name: "title", label: "Title", required: true, placeholder: "New batch starts Monday" },
      { name: "category", label: "Category", type: "select", options: [
        { value: "new_batch", label: "New batch" },
        { value: "admission", label: "Admission" },
        { value: "results", label: "Results" },
        { value: "holiday", label: "Holiday" },
        { value: "exam", label: "Exam" },
        { value: "important", label: "Important" },
      ] },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "content", label: "Message", type: "textarea", rows: 5, span: 2 },
      { name: "image_url", label: "Image (optional)", type: "media", bucket: "gallery-images", folder: "announcements" },
    ],
  },
  {
    title: "Timing",
    fields: [
      { name: "publish_date", label: "Publish date", type: "date" },
      { name: "expiry_date", label: "Expiry date", type: "date" },
      { name: "featured", label: "Pin to the homepage", type: "checkbox" },
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const BRANCH_FORM: FormSection[] = [
  {
    title: "Branch",
    fields: [
      { name: "name", label: "Branch name", required: true, placeholder: "North Campus" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "opening_hours", label: "Opening hours", placeholder: "Mon–Sat: 9:00 AM – 7:00 PM" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "address", label: "Address", type: "textarea", rows: 3, span: 2 },
      { name: "maps_url", label: "Google Maps link", span: 2 },
    ],
  },
  {
    title: "Courses at this branch",
    fields: [
      {
        name: "course_ids",
        label: "Courses offered",
        type: "checks",
        optionLabel: "title",
        hint: "The public branch page lists exactly these courses.",
      },
    ],
  },
  {
    title: "Faculty at this branch",
    fields: [
      {
        name: "faculty_ids",
        label: "Faculty members",
        type: "checks",
        hint: "The public branch page lists exactly this faculty.",
      },
    ],
  },
  {
    title: "Publishing",
    fields: [
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const TESTIMONIAL_FORM: FormSection[] = [
  {
    title: "Testimonial",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "role", label: "Role", placeholder: "Student" },
      { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
      { name: "course", label: "Course" },
      { name: "year", label: "Year / batch", placeholder: "2025" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "content", label: "Testimonial", type: "textarea", rows: 5, required: true, span: 2 },
      { name: "photo_url", label: "Photo (optional)", type: "media", bucket: "faculty-photos", folder: "testimonials" },
    ],
  },
  {
    title: "Publishing",
    fields: [
      { name: "featured", label: "Feature on the homepage", type: "checkbox" },
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const FAQ_FORM: FormSection[] = [
  {
    title: "Question & answer",
    fields: [
      { name: "question", label: "Question", required: true, span: 2 },
      { name: "answer", label: "Answer", type: "textarea", rows: 5, required: true, span: 2 },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "is_active", label: "Published (visible on the public site)", type: "checkbox" },
    ],
  },
];

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  COURSES_VIEW: "courses.view",
  COURSES_CREATE: "courses.create",
  COURSES_EDIT: "courses.edit",
  COURSES_DELETE: "courses.delete",

  FACULTY_VIEW: "faculty.view",
  FACULTY_CREATE: "faculty.create",
  FACULTY_EDIT: "faculty.edit",
  FACULTY_DELETE: "faculty.delete",

  SUBJECTS_VIEW: "subjects.view",
  SUBJECTS_CREATE: "subjects.create",
  SUBJECTS_EDIT: "subjects.edit",
  SUBJECTS_DELETE: "subjects.delete",

  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",

  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",

  LOGS_VIEW: "logs.view",

  STORAGE_UPLOAD: "storage.upload",
  STORAGE_DELETE: "storage.delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,

  PERMISSIONS.COURSES_VIEW,
  PERMISSIONS.COURSES_CREATE,
  PERMISSIONS.COURSES_EDIT,
  PERMISSIONS.COURSES_DELETE,

  PERMISSIONS.FACULTY_VIEW,
  PERMISSIONS.FACULTY_CREATE,
  PERMISSIONS.FACULTY_EDIT,
  PERMISSIONS.FACULTY_DELETE,

  PERMISSIONS.SUBJECTS_VIEW,
  PERMISSIONS.SUBJECTS_CREATE,
  PERMISSIONS.SUBJECTS_EDIT,
  PERMISSIONS.SUBJECTS_DELETE,

  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.SETTINGS_EDIT,

  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_EDIT,

  PERMISSIONS.LOGS_VIEW,

  PERMISSIONS.STORAGE_UPLOAD,
  PERMISSIONS.STORAGE_DELETE,
];

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: "Dashboard", permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  {
    label: "Courses",
    permissions: [
      PERMISSIONS.COURSES_VIEW,
      PERMISSIONS.COURSES_CREATE,
      PERMISSIONS.COURSES_EDIT,
      PERMISSIONS.COURSES_DELETE,
    ],
  },
  {
    label: "Faculty",
    permissions: [
      PERMISSIONS.FACULTY_VIEW,
      PERMISSIONS.FACULTY_CREATE,
      PERMISSIONS.FACULTY_EDIT,
      PERMISSIONS.FACULTY_DELETE,
    ],
  },
  {
    label: "Subjects",
    permissions: [
      PERMISSIONS.SUBJECTS_VIEW,
      PERMISSIONS.SUBJECTS_CREATE,
      PERMISSIONS.SUBJECTS_EDIT,
      PERMISSIONS.SUBJECTS_DELETE,
    ],
  },
  { label: "Settings", permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_EDIT] },
  {
    label: "Users",
    permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT],
  },
  { label: "Audit Logs", permissions: [PERMISSIONS.LOGS_VIEW] },
  {
    label: "Storage",
    permissions: [PERMISSIONS.STORAGE_UPLOAD, PERMISSIONS.STORAGE_DELETE],
  },
];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function normalizeDay(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const alias = DAY_ALIASES[lower];
  if (alias) return alias;
  const match = WEEKDAYS.find((day) => day.toLowerCase() === lower);
  return match || raw;
}

/**
 * Normalises "8:00 AM", "08:00" or "8" into zero-padded 24h "HH:MM".
 * Returns "" for anything unparseable so callers can reject it.
 */
export function normalizeTime(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!match) {
    const hourOnly = raw.match(/^(\d{1,2})$/);
    if (hourOnly) {
      const hour = Number(hourOnly[1]);
      return hour >= 0 && hour <= 23 ? `${String(hour).padStart(2, "0")}:00` : "";
    }
    return "";
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "08:30" -> "8:30 AM" */
export function formatTime(value: string): string {
  const normalized = normalizeTime(value);
  if (!normalized) return value || "";
  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteText} ${suffix}`;
}

/** Half-open overlap: touching boundaries (09:00-10:00 / 10:00-11:00) are allowed. */
export function timeOverlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && startB < endA;
}

export function dayIndex(day: string): number {
  const index = WEEKDAYS.findIndex(
    (weekday) => weekday.toLowerCase() === (day || "").toLowerCase()
  );
  return index === -1 ? 99 : index;
}

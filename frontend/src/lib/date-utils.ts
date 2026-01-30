/**
 * Format date to MM/DD/YYYY, HH:MM:SS format in local timezone
 * Example: 12/01/2025, 12:55:40
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;

  // Check if date is invalid
  if (isNaN(d.getTime())) return "-";

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Convert local datetime string (YYYY-MM-DDTHH:mm) to ISO string (UTC)
 * Used when sending datetime to backend
 */
export function localToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return "";
  const localDate = new Date(localDateTimeString);
  return localDate.toISOString();
}

/**
 * Convert UTC datetime string to local datetime string (YYYY-MM-DDTHH:mm)
 * Used when displaying datetime in DateTimePicker
 */
export function utcToLocal(utcDateTimeString: string): string {
  if (!utcDateTimeString) return "";
  const date = new Date(utcDateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a date as relative time ago (e.g., "2 minutes ago", "1 hour ago")
 * Example: formatTimeAgo("2024-01-30T12:00:00Z") => "5 minutes ago"
 */
export function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}


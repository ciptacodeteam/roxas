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


/**
 * Format date to MM/DD/YYYY, HH:MM:SS format
 * Example: 12/01/2025, 12:55:40
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}


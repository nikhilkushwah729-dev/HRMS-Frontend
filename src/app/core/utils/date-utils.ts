/**
 * Date Utilities for HRMS Frontend
 * Prevents timezone offset shifts (e.g., IST UTC+05:30 to UTC day-shift bug AUD-06)
 */

/**
 * Formats a Date object as 'YYYY-MM-DD' using local timezone values.
 */
export function formatLocalIsoDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds a 'YYYY-MM-DD' date string directly from year, 0-indexed month, and day.
 */
export function buildLocalIsoDate(year: number, monthIndex: number, day: number): string {
  const yyyy = String(year);
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

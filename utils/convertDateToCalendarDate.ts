// convertDateToCalendarDate.ts
import { CalendarDate } from "@internationalized/date";

export function convertDateToCalendarDate(
  date: Date | string | null | undefined
) {
  if (!date) return undefined;

  // Если пришла строка — превращаем в Date
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return undefined; // неправильная дата

  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

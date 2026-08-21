import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

/** Værkstedet ligger i Danmark — alle bookinger bruger denne tidszone. */
export const WORKSHOP_TIMEZONE = "Europe/Copenhagen";

export function getNextHourSlot(from = new Date()): Date {
  const now = new TZDate(from, WORKSHOP_TIMEZONE);
  const slot = new TZDate(from, WORKSHOP_TIMEZONE);
  slot.setMinutes(0, 0, 0);

  if (now.getTime() > slot.getTime()) {
    slot.setHours(slot.getHours() + 1);
  }

  return new Date(slot.getTime());
}

export function toDateInputValue(date: Date): string {
  return format(new TZDate(date, WORKSHOP_TIMEZONE), "yyyy-MM-dd");
}

export function toTimeInputValue(date: Date): string {
  return format(new TZDate(date, WORKSHOP_TIMEZONE), "HH:mm");
}

export function getTodayDateInputValue(): string {
  return toDateInputValue(new Date());
}

export function parseBookingDateTime(date: string, time: string): Date {
  return new Date(new TZDate(`${date}T${time}:00`, WORKSHOP_TIMEZONE).getTime());
}

/** Kun HH:00 — fx "21:00" ja, "21:17" nej */
export function isWholeHourTimeString(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time) && time.endsWith(":00");
}

export function isWholeHourDate(date: Date): boolean {
  const tz = new TZDate(date, WORKSHOP_TIMEZONE);
  return tz.getMinutes() === 0 && tz.getSeconds() === 0 && tz.getMilliseconds() === 0;
}

/** Hele timer man kan vælge som booking-start på en given dato */
export function getSelectableBookingHours(date: string): string[] {
  const hours: string[] = [];
  let startHour = 0;

  if (date === getTodayDateInputValue()) {
    startHour = new TZDate(getNextHourSlot(), WORKSHOP_TIMEZONE).getHours();
  }

  for (let hour = startHour; hour <= 23; hour++) {
    hours.push(`${hour.toString().padStart(2, "0")}:00`);
  }

  return hours;
}

/** Hele timer fra start (inkl.) til slut (ekskl. eller inkl. afhængigt af range) */
export function getWholeHourOptionsInRange(start: Date, end: Date): string[] {
  const options: string[] = [];
  const cursor = new TZDate(start, WORKSHOP_TIMEZONE);
  cursor.setMinutes(0, 0, 0);

  const endMs = new TZDate(end, WORKSHOP_TIMEZONE).getTime();

  while (cursor.getTime() <= endMs) {
    options.push(toTimeInputValue(new Date(cursor.getTime())));
    cursor.setHours(cursor.getHours() + 1);
  }

  return options;
}

export function getMinTimeForDate(date: string): string | undefined {
  if (date !== getTodayDateInputValue()) return undefined;
  return toTimeInputValue(getNextHourSlot());
}

export function isBookingStartInPast(start: Date): boolean {
  return start.getTime() < getNextHourSlot().getTime();
}

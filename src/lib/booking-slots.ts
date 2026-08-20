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

export function getMinTimeForDate(date: string): string | undefined {
  if (date !== getTodayDateInputValue()) return undefined;
  return toTimeInputValue(getNextHourSlot());
}

export function isBookingStartInPast(start: Date): boolean {
  return start.getTime() < getNextHourSlot().getTime();
}

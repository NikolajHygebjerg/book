import { addHours, format } from "date-fns";

export function getNextHourSlot(from = new Date()): Date {
  const slot = new Date(from);
  slot.setMinutes(0, 0, 0);

  if (from.getTime() > slot.getTime()) {
    slot.setHours(slot.getHours() + 1);
  }

  return slot;
}

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function toTimeInputValue(date: Date): string {
  return format(date, "HH:mm");
}

export function parseBookingDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function getMinTimeForDate(date: string): string | undefined {
  const today = toDateInputValue(new Date());
  if (date !== today) return undefined;
  return toTimeInputValue(getNextHourSlot());
}

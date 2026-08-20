import { addHours } from "date-fns";
import { canAccommodate, BookingSlot } from "./capacity";
import { getNextHourSlot } from "./booking-slots";

const MAX_SEARCH_HOURS = 14 * 24;

export async function findNextAvailableSlot(
  hours: number,
  persons: number,
  fetchBookings: (from: Date, to: Date) => Promise<BookingSlot[]>
): Promise<Date | null> {
  const from = getNextHourSlot();
  const searchEnd = addHours(from, MAX_SEARCH_HOURS);

  const existingBookings = await fetchBookings(from, searchEnd);

  let candidate = from;
  for (let i = 0; i < MAX_SEARCH_HOURS; i++) {
    const check = canAccommodate(candidate, hours, persons, existingBookings);
    if (check.ok) return candidate;
    candidate = addHours(candidate, 1);
  }

  return null;
}

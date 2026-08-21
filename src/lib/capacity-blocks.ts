import { db } from "./db";
import { BookingSlot } from "./capacity";
import { fetchGoogleCalendarEvents } from "./google-calendar/events";
import { WORKSHOP_CONFIG } from "./config";

export async function getExistingCapacityBlocks(
  rangeStart: Date,
  rangeEnd: Date
): Promise<BookingSlot[]> {
  const [bookings, googleEvents] = await Promise.all([
    db.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { lt: rangeEnd },
        endTime: { gt: rangeStart },
      },
      select: {
        startTime: true,
        endTime: true,
        persons: true,
      },
    }),
    fetchGoogleCalendarEvents(rangeStart, rangeEnd),
  ]);

  const courseBlocks: BookingSlot[] = googleEvents.map((event) => ({
    startTime: event.startTime,
    endTime: event.endTime,
    persons: WORKSHOP_CONFIG.maxCapacity,
  }));

  return [...bookings, ...courseBlocks];
}

export function courseBlockReason(
  occupancy: number,
  persons: number
): string | undefined {
  if (occupancy >= WORKSHOP_CONFIG.maxCapacity) {
    return `Værkstedet er optaget af kursus eller fuld booking (${WORKSHOP_CONFIG.maxCapacity}/${WORKSHOP_CONFIG.maxCapacity} pladser)`;
  }
  if (occupancy + persons > WORKSHOP_CONFIG.maxCapacity) {
    return `Ikke nok plads (${occupancy}/${WORKSHOP_CONFIG.maxCapacity} optaget)`;
  }
  return undefined;
}

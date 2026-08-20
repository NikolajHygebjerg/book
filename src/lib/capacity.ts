import { addHours, isBefore, isEqual } from "date-fns";
import { WORKSHOP_CONFIG } from "./config";

export type OccupancySlot = {
  hour: Date;
  occupied: number;
  available: number;
  isFull: boolean;
};

export type BookingSlot = {
  startTime: Date;
  endTime: Date;
  persons: number;
};

export function getHourSlots(start: Date, hours: number): Date[] {
  const slots: Date[] = [];
  for (let i = 0; i < hours; i++) {
    slots.push(addHours(start, i));
  }
  return slots;
}

export function calculateOccupancy(
  start: Date,
  hours: number,
  existingBookings: BookingSlot[],
  excludeBookingId?: string
): OccupancySlot[] {
  const slots = getHourSlots(start, hours);

  return slots.map((hour) => {
    const occupied = existingBookings.reduce((sum, booking) => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;

      const hourEnd = addHours(hour, 1);
      const overlaps =
        isBefore(bookingStart, hourEnd) &&
        (isBefore(hour, bookingEnd) || isEqual(hour, bookingEnd));

      if (overlaps) {
        return sum + booking.persons;
      }
      return sum;
    }, 0);

    return {
      hour,
      occupied,
      available: WORKSHOP_CONFIG.maxCapacity - occupied,
      isFull: occupied >= WORKSHOP_CONFIG.maxCapacity,
    };
  });
}

export function canAccommodate(
  start: Date,
  hours: number,
  persons: number,
  existingBookings: BookingSlot[]
): { ok: boolean; reason?: string; occupancy: OccupancySlot[] } {
  const occupancy = calculateOccupancy(start, hours, existingBookings);

  for (const slot of occupancy) {
    if (slot.occupied + persons > WORKSHOP_CONFIG.maxCapacity) {
      return {
        ok: false,
        reason: `Ikke nok plads kl. ${slot.hour.getHours()}:00 (${slot.occupied}/${WORKSHOP_CONFIG.maxCapacity} optaget)`,
        occupancy,
      };
    }
  }

  return { ok: true, occupancy };
}

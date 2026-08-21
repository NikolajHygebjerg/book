import { differenceInMinutes } from "date-fns";
import { WORKSHOP_CONFIG } from "./config";
import { parseBookingDateTime, toTimeInputValue, isWholeHourDate } from "./booking-slots";

export type PotteryWheelReservationInput = {
  wheelNumber: number;
  startTime: string;
  endTime: string;
};

export type PotteryWheelReservationDraft = {
  clientId: string;
  wheelNumber: number;
  fromTime: string;
  toTime: string;
};

export function createPotteryWheelDraft(
  bookingStart: Date,
  bookingEnd: Date
): PotteryWheelReservationDraft {
  return {
    clientId: crypto.randomUUID(),
    wheelNumber: 1,
    fromTime: toTimeInputValue(bookingStart),
    toTime: toTimeInputValue(bookingEnd),
  };
}

export function draftToInput(
  draft: PotteryWheelReservationDraft,
  bookingDate: string
): PotteryWheelReservationInput {
  return {
    wheelNumber: draft.wheelNumber,
    startTime: parseBookingDateTime(bookingDate, draft.fromTime).toISOString(),
    endTime: parseBookingDateTime(bookingDate, draft.toTime).toISOString(),
  };
}

export function reservationDurationHours(start: Date, end: Date): number {
  const minutes = differenceInMinutes(end, start);
  return minutes / 60;
}

export function validatePotteryWheelReservations(
  reservations: PotteryWheelReservationInput[],
  bookingStart: Date,
  bookingEnd: Date,
  persons: number
): string | null {
  if (reservations.length > persons) {
    return `Du kan maks. reservere ${persons} drejeskive(r) — ét pr. person`;
  }

  const usedWheels = new Set<number>();

  for (const reservation of reservations) {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);

    if (
      reservation.wheelNumber < 1 ||
      reservation.wheelNumber > WORKSHOP_CONFIG.totalPotteryWheels
    ) {
      return `Drejeskive skal være mellem 1 og ${WORKSHOP_CONFIG.totalPotteryWheels}`;
    }

    if (usedWheels.has(reservation.wheelNumber)) {
      return `Drejeskive ${reservation.wheelNumber} er valgt mere end én gang`;
    }
    usedWheels.add(reservation.wheelNumber);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Ugyldigt tidspunkt for drejeskive";
    }

    if (!isWholeHourDate(start) || !isWholeHourDate(end)) {
      return "Drejeskive-tider skal være hele timer (fx 10:00, 11:00)";
    }

    if (start >= end) {
      return "Sluttid skal være efter starttid for drejeskive";
    }

    if (start < bookingStart || end > bookingEnd) {
      return "Drejeskive-tiden skal ligge inden for din booking";
    }

    if (reservationDurationHours(start, end) <= 0) {
      return "Drejeskive-booking skal vare mindst lidt over 0 timer";
    }
  }

  return null;
}

export function validatePotteryWheelDrafts(
  drafts: PotteryWheelReservationDraft[],
  bookingDate: string,
  bookingStart: Date,
  bookingEnd: Date,
  persons: number
): string | null {
  const inputs = drafts.map((d) => draftToInput(d, bookingDate));
  return validatePotteryWheelReservations(inputs, bookingStart, bookingEnd, persons);
}

export function formatReservationRange(start: Date, end: Date): string {
  return `${toTimeInputValue(start)}–${toTimeInputValue(end)}`;
}

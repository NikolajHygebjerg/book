import {
  addHours,
  eachDayOfInterval,
  format,
  isBefore,
  isEqual,
  parseISO,
} from "date-fns";
import { da } from "date-fns/locale";
import { WORKSHOP_CONFIG } from "../config";
import { parseBookingDateTime, toTimeInputValue, WORKSHOP_TIMEZONE } from "../booking-slots";
import { TZDate } from "@date-fns/tz";
import { extractFirstName } from "./first-name";
import {
  CalendarAttendee,
  CalendarDay,
  CalendarGrid,
  CalendarHourSlot,
  WorkshopCalendarEvent,
} from "./types";

/** Synlige timer i kalendergriddet (inkl. start, ekskl. slut) */
export const CALENDAR_DISPLAY_HOUR_START = 7;
export const CALENDAR_DISPLAY_HOUR_END = 23;

function eventOverlapsHour(event: WorkshopCalendarEvent, hourStart: Date): boolean {
  const hourEnd = addHours(hourStart, 1);
  return (
    isBefore(event.startTime, hourEnd) &&
    (isBefore(hourStart, event.endTime) || isEqual(hourStart, event.endTime))
  );
}

function buildHourSlot(
  dateStr: string,
  hour: number,
  events: WorkshopCalendarEvent[]
): CalendarHourSlot {
  const hourStart = parseBookingDateTime(
    dateStr,
    `${hour.toString().padStart(2, "0")}:00`
  );

  const attendees: CalendarAttendee[] = [];

  for (const event of events) {
    if (!eventOverlapsHour(event, hourStart)) continue;
    attendees.push({
      firstName: event.firstName,
      persons: event.persons,
      eventId: event.id,
      source: event.source,
    });
  }

  const occupied = attendees.reduce((sum, a) => sum + a.persons, 0);

  return {
    hour: hourStart.toISOString(),
    hourLabel: toTimeInputValue(hourStart),
    occupied,
    available: WORKSHOP_CONFIG.maxCapacity - occupied,
    isFull: occupied >= WORKSHOP_CONFIG.maxCapacity,
    attendees,
  };
}

export function buildCalendarGrid(
  fromDate: string,
  toDate: string,
  events: WorkshopCalendarEvent[]
): CalendarGrid {
  const start = parseISO(fromDate);
  const end = parseISO(toDate);
  const daysInRange = eachDayOfInterval({ start, end });

  const days: CalendarDay[] = daysInRange.map((day) => {
    const dateStr = format(new TZDate(day, WORKSHOP_TIMEZONE), "yyyy-MM-dd");
    const hours: CalendarHourSlot[] = [];

    for (let hour = CALENDAR_DISPLAY_HOUR_START; hour < CALENDAR_DISPLAY_HOUR_END; hour++) {
      hours.push(buildHourSlot(dateStr, hour, events));
    }

    const tzDay = new TZDate(day, WORKSHOP_TIMEZONE);

    return {
      date: dateStr,
      dayLabel: format(tzDay, "d. MMM", { locale: da }),
      weekdayLabel: format(tzDay, "EEE", { locale: da }),
      hours,
    };
  });

  return { from: fromDate, to: toDate, days };
}

export function bookingToCalendarEvent(booking: {
  id: string;
  startTime: Date;
  endTime: Date;
  persons: number;
  user: { name: string };
}): WorkshopCalendarEvent {
  const firstName = extractFirstName(booking.user.name);

  return {
    id: booking.id,
    source: "booking",
    title: `Åbent værksted — ${firstName}`,
    startTime: booking.startTime,
    endTime: booking.endTime,
    persons: booking.persons,
    firstName,
    bookingId: booking.id,
  };
}

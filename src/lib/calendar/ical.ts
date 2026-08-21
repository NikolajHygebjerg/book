import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { WORKSHOP_TIMEZONE } from "../booking-slots";
import { WorkshopCalendarEvent } from "./types";

const WORKSHOP_ADDRESS = "Ravnen 5, 8410 Rønde";

function formatIcsDateTime(date: Date): string {
  const tz = new TZDate(date, WORKSHOP_TIMEZONE);
  return format(tz, "yyyyMMdd'T'HHmmss");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function eventToVevent(event: WorkshopCalendarEvent): string {
  const summary =
    event.source === "booking"
      ? `${event.firstName} — Åbent værksted${event.persons > 1 ? ` (${event.persons} pers.)` : ""}`
      : event.title;

  const uid =
    event.source === "booking"
      ? `booking-${event.bookingId}@begejstring.dk`
      : event.source === "google"
        ? `google-${event.googleEventId}@begejstring.dk`
        : `event-${event.id}@begejstring.dk`;

  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateTime(new Date())}`,
    `DTSTART;TZID=${WORKSHOP_TIMEZONE}:${formatIcsDateTime(event.startTime)}`,
    `DTEND;TZID=${WORKSHOP_TIMEZONE}:${formatIcsDateTime(event.endTime)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(WORKSHOP_ADDRESS)}`,
    `DESCRIPTION:${escapeIcsText(`Godkendt: ${event.persons} — ${summary}`)}`,
    "END:VEVENT",
  ];

  return lines.join("\r\n");
}

export function buildIcsCalendar(
  events: WorkshopCalendarEvent[],
  calendarName = "Begejstring — Åbent værksted"
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Begejstring//Workshop Calendar//DA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    `X-WR-TIMEZONE:${WORKSHOP_TIMEZONE}`,
  ].join("\r\n");

  const body = events.map(eventToVevent).join("\r\n");
  const footer = "END:VCALENDAR";

  return `${header}\r\n${body}\r\n${footer}\r\n`;
}

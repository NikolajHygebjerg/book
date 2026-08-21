import { calendar_v3 } from "googleapis";
import { WORKSHOP_CONFIG } from "../config";
import { WORKSHOP_TIMEZONE } from "../booking-slots";
import { WorkshopCalendarEvent } from "../calendar/types";
import { getGoogleCalendarClient } from "./client";

const BOOKING_SOURCE_KEY = "begejstringBookingId";

function parseGoogleEventDate(
  value: calendar_v3.Schema$EventDateTime | undefined | null
): Date | null {
  if (!value) return null;
  if (value.dateTime) return new Date(value.dateTime);
  if (value.date) return new Date(`${value.date}T00:00:00`);
  return null;
}

function isAppSyncedBooking(event: calendar_v3.Schema$Event): boolean {
  return Boolean(event.extendedProperties?.private?.[BOOKING_SOURCE_KEY]);
}

export async function fetchGoogleCalendarEvents(
  from: Date,
  to: Date
): Promise<WorkshopCalendarEvent[]> {
  const client = await getGoogleCalendarClient();
  if (!client) return [];

  const response = await client.calendar.events.list({
    calendarId: client.calendarId,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 500,
  });

  const items = response.data.items ?? [];

  const events: WorkshopCalendarEvent[] = [];

  for (const event of items) {
    if (event.status === "cancelled") continue;
    if (isAppSyncedBooking(event)) continue;

    const startTime = parseGoogleEventDate(event.start);
    const endTime = parseGoogleEventDate(event.end);
    if (!startTime || !endTime || endTime <= startTime) continue;

    const title = event.summary?.trim() || "Kursus";

    events.push({
      id: `google-${event.id}`,
      source: "google",
      title,
      startTime,
      endTime,
      persons: WORKSHOP_CONFIG.maxCapacity,
      firstName: title,
      googleEventId: event.id ?? undefined,
    });
  }

  return events;
}

export { BOOKING_SOURCE_KEY };

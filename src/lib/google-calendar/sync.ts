import { db } from "../db";
import { WORKSHOP_TIMEZONE } from "../booking-slots";
import { extractFirstName } from "../calendar/first-name";
import { getGoogleCalendarClient } from "./client";
import { BOOKING_SOURCE_KEY } from "./events";

export async function syncBookingToGoogleCalendar(bookingId: string): Promise<void> {
  const integration = await db.googleCalendarIntegration.findUnique({
    where: { id: "default" },
  });

  if (!integration?.syncBookingsEnabled) return;

  const client = await getGoogleCalendarClient();
  if (!client) return;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: { select: { name: true } } },
  });

  if (!booking || booking.status !== "CONFIRMED") return;

  const firstName = extractFirstName(booking.user.name);
  const summary = `${firstName} — Åbent værksted${booking.persons > 1 ? ` (${booking.persons} pers.)` : ""}`;

  const requestBody = {
    summary,
    location: "Ravnen 5, 8410 Rønde",
    description: `Booking via book.begejstring.dk (${booking.hours} timer, ${booking.persons} person(er))`,
    start: {
      dateTime: booking.startTime.toISOString(),
      timeZone: WORKSHOP_TIMEZONE,
    },
    end: {
      dateTime: booking.endTime.toISOString(),
      timeZone: WORKSHOP_TIMEZONE,
    },
    extendedProperties: {
      private: {
        [BOOKING_SOURCE_KEY]: booking.id,
        source: "begejstring",
      },
    },
  };

  if (booking.googleEventId) {
    await client.calendar.events.update({
      calendarId: client.calendarId,
      eventId: booking.googleEventId,
      requestBody,
    });
    return;
  }

  const created = await client.calendar.events.insert({
    calendarId: client.calendarId,
    requestBody,
  });

  if (created.data.id) {
    await db.booking.update({
      where: { id: booking.id },
      data: { googleEventId: created.data.id },
    });
  }
}

export async function removeBookingFromGoogleCalendar(bookingId: string): Promise<void> {
  const client = await getGoogleCalendarClient();
  if (!client) return;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { googleEventId: true },
  });

  if (!booking?.googleEventId) return;

  try {
    await client.calendar.events.delete({
      calendarId: client.calendarId,
      eventId: booking.googleEventId,
    });
  } catch {
    // Event may already be deleted manually in Google Calendar
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { googleEventId: null },
  });
}

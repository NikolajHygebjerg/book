import { parseISO, endOfDay, startOfDay } from "date-fns";
import { db } from "../db";
import { bookingToCalendarEvent, buildCalendarGrid } from "../calendar/build-grid";
import { fetchGoogleCalendarEvents } from "../google-calendar/events";

export async function fetchWorkshopCalendarEvents(from: Date, to: Date) {
  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { lt: to },
      endTime: { gt: from },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      persons: true,
      user: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const bookingEvents = bookings.map(bookingToCalendarEvent);
  const googleEvents = await fetchGoogleCalendarEvents(from, to);

  return [...bookingEvents, ...googleEvents].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );
}

export async function getCalendarGrid(fromDate: string, toDate: string) {
  const from = startOfDay(parseISO(fromDate));
  const to = endOfDay(parseISO(toDate));
  const events = await fetchWorkshopCalendarEvents(from, to);
  return buildCalendarGrid(fromDate, toDate, events);
}

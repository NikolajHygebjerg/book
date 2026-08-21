export type CalendarEventSource = "booking" | "google" | "manual";

export type WorkshopCalendarEvent = {
  id: string;
  source: CalendarEventSource;
  title: string;
  startTime: Date;
  endTime: Date;
  persons: number;
  firstName: string;
  bookingId?: string;
  googleEventId?: string;
};

export type CalendarAttendee = {
  firstName: string;
  persons: number;
  eventId: string;
  source: CalendarEventSource;
};

export type CalendarHourSlot = {
  /** ISO start of hour in workshop timezone */
  hour: string;
  hourLabel: string;
  occupied: number;
  available: number;
  isFull: boolean;
  attendees: CalendarAttendee[];
};

export type CalendarDay = {
  date: string;
  dayLabel: string;
  weekdayLabel: string;
  hours: CalendarHourSlot[];
};

export type CalendarGrid = {
  from: string;
  to: string;
  days: CalendarDay[];
};

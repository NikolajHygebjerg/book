import { WorkshopCalendarEvent } from "../calendar/types";

export type GoogleCalendarEnv = {
  calendarId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
};

export function getGoogleCalendarEnv(): GoogleCalendarEnv {
  return {
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

export function isGoogleCalendarConfigured(): boolean {
  const env = getGoogleCalendarEnv();
  return Boolean(env.calendarId && env.serviceAccountEmail && env.privateKey);
}

/**
 * Henter eksterne begivenheder (kurser m.m.) fra Google Kalender.
 * Returnerer tom liste indtil Google Calendar API er konfigureret.
 */
export async function fetchGoogleCalendarEvents(
  _from: Date,
  _to: Date
): Promise<WorkshopCalendarEvent[]> {
  if (!isGoogleCalendarConfigured()) {
    return [];
  }

  // TODO: Google Calendar API — service account read på GOOGLE_CALENDAR_ID
  // Map events til WorkshopCalendarEvent med source: "google"
  return [];
}

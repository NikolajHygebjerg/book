const STATUS_MESSAGES: Record<string, string> = {
  connected: "Google Kalender er forbundet.",
  denied: "Forbindelse afvist — log ind som admin.",
  error: "Google returnerede en fejl.",
  missing: "Manglende parametre fra Google.",
  state: "Ugyldig sikkerhedstoken — prøv igen.",
  no_refresh: "Ingen refresh token — afbryd adgang i Google og forbind igen.",
  no_calendar: "Ingen kalender fundet på Google-kontoen.",
  failed: "Kunne ikke fuldføre forbindelsen.",
};

export function googleCalendarStatusMessage(
  code: string | null | undefined
): string | null {
  if (!code) return null;
  return STATUS_MESSAGES[code] ?? null;
}

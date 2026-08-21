import { google } from "googleapis";
import { db } from "../db";
import { createGoogleOAuthClient } from "./oauth";

const INTEGRATION_ID = "default";

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const integration = await db.googleCalendarIntegration.findUnique({
    where: { id: INTEGRATION_ID },
  });
  return Boolean(integration?.refreshToken);
}

export async function getGoogleCalendarIntegration() {
  return db.googleCalendarIntegration.findUnique({
    where: { id: INTEGRATION_ID },
  });
}

export async function getGoogleCalendarClient() {
  const integration = await getGoogleCalendarIntegration();
  if (!integration) return null;

  const oauth2Client = createGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: integration.accessToken ?? undefined,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiry?.getTime(),
  });

  oauth2Client.on("tokens", async (tokens) => {
    if (!tokens.access_token) return;
    await db.googleCalendarIntegration.update({
      where: { id: INTEGRATION_ID },
      data: {
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  return { calendar, calendarId: integration.calendarId, integration };
}

export async function saveGoogleCalendarIntegration(input: {
  calendarId: string;
  calendarSummary?: string | null;
  accessToken?: string | null;
  refreshToken: string;
  tokenExpiry?: Date | null;
  connectedByEmail: string;
}) {
  return db.googleCalendarIntegration.upsert({
    where: { id: INTEGRATION_ID },
    create: {
      id: INTEGRATION_ID,
      calendarId: input.calendarId,
      calendarSummary: input.calendarSummary,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      connectedByEmail: input.connectedByEmail,
    },
    update: {
      calendarId: input.calendarId,
      calendarSummary: input.calendarSummary,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      connectedByEmail: input.connectedByEmail,
    },
  });
}

export async function disconnectGoogleCalendar() {
  await db.googleCalendarIntegration.deleteMany({
    where: { id: INTEGRATION_ID },
  });
}

export async function setGoogleCalendarSyncEnabled(enabled: boolean) {
  await db.googleCalendarIntegration.update({
    where: { id: INTEGRATION_ID },
    data: { syncBookingsEnabled: enabled },
  });
}

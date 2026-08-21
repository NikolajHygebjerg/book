import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { createGoogleOAuthClient } from "@/lib/google-calendar/oauth";
import { saveGoogleCalendarIntegration } from "@/lib/google-calendar/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin?google=denied`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const adminUrl = `${process.env.NEXTAUTH_URL}/admin`;

  if (error) {
    return NextResponse.redirect(`${adminUrl}?google=error`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${adminUrl}?google=missing`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${adminUrl}?google=state`);
  }

  try {
    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${adminUrl}?google=no_refresh`);
    }

    oauth2Client.setCredentials(tokens);
    const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendarApi.calendarList.list();
    const primary =
      calendarList.data.items?.find((item) => item.primary) ?? calendarList.data.items?.[0];

    if (!primary?.id) {
      return NextResponse.redirect(`${adminUrl}?google=no_calendar`);
    }

    await saveGoogleCalendarIntegration({
      calendarId: primary.id,
      calendarSummary: primary.summary ?? primary.id,
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      connectedByEmail: session.user.email,
    });

    return NextResponse.redirect(`${adminUrl}?google=connected`);
  } catch {
    return NextResponse.redirect(`${adminUrl}?google=failed`);
  }
}

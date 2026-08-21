import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarIntegration,
  isGoogleCalendarConnected,
  isGoogleOAuthConfigured,
  setGoogleCalendarSyncEnabled,
} from "@/lib/google-calendar";
import { z } from "zod";

const patchSchema = z.object({
  syncBookingsEnabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  try {
    const integration = await getGoogleCalendarIntegration();
    const connected = await isGoogleCalendarConnected();

    return NextResponse.json({
      oauthConfigured: isGoogleOAuthConfigured(),
      connected,
      calendarId: integration?.calendarId ?? null,
      calendarSummary: integration?.calendarSummary ?? null,
      syncBookingsEnabled: integration?.syncBookingsEnabled ?? true,
      connectedByEmail: integration?.connectedByEmail ?? null,
      updatedAt: integration?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Google calendar status error:", error);
    return NextResponse.json(
      {
        oauthConfigured: isGoogleOAuthConfigured(),
        connected: false,
        calendarId: null,
        calendarSummary: null,
        syncBookingsEnabled: true,
        connectedByEmail: null,
        updatedAt: null,
        dbError: true,
      },
      { status: 200 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ugyldige data" }, { status: 400 });
    }

    await setGoogleCalendarSyncEnabled(parsed.data.syncBookingsEnabled);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kunne ikke opdatere indstillinger" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  try {
    await disconnectGoogleCalendar();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kunne ikke afbryde forbindelsen" }, { status: 500 });
  }
}

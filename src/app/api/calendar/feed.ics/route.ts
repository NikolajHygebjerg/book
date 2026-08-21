import { NextResponse } from "next/server";
import { addMonths, startOfDay, endOfDay } from "date-fns";
import {
  getCalendarFeedToken,
  getCalendarIcsFeed,
} from "@/lib/calendar/service";

export async function GET(request: Request) {
  const token = getCalendarFeedToken();
  if (!token) {
    return new NextResponse("Kalender-feed er ikke konfigureret", { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== token) {
    return new NextResponse("Ugyldig adgang", { status: 403 });
  }

  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(addMonths(now, 3));

  const ics = await getCalendarIcsFeed(from, to);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="begejstring-kalender.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}

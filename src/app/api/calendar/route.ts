import { NextResponse } from "next/server";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { da } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { getCalendarGrid } from "@/lib/calendar/service";
import { toDateInputValue } from "@/lib/booking-slots";
import { TZDate } from "@date-fns/tz";
import { WORKSHOP_TIMEZONE } from "@/lib/booking-slots";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let fromDate: string;
  let toDate: string;

  if (fromParam && toParam) {
    fromDate = fromParam;
    toDate = toParam;
  } else {
    const weekStart = startOfWeek(new TZDate(new Date(), WORKSHOP_TIMEZONE), {
      weekStartsOn: 1,
      locale: da,
    });
    fromDate = toDateInputValue(new Date(weekStart.getTime()));
    toDate = toDateInputValue(addDays(weekStart, 6));
  }

  if (Number.isNaN(parseISO(fromDate).getTime()) || Number.isNaN(parseISO(toDate).getTime())) {
    return NextResponse.json({ error: "Ugyldigt datointerval" }, { status: 400 });
  }

  const grid = await getCalendarGrid(fromDate, toDate);

  return NextResponse.json(grid);
}

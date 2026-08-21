"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { da } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { TZDate } from "@date-fns/tz";
import { WORKSHOP_CONFIG } from "@/lib/config";
import { toDateInputValue, WORKSHOP_TIMEZONE } from "@/lib/booking-slots";
import {
  CALENDAR_DISPLAY_HOUR_END,
  CALENDAR_DISPLAY_HOUR_START,
} from "@/lib/calendar/build-grid";
import type { CalendarDay, CalendarGrid } from "@/lib/calendar/types";

type CalendarApiResponse = CalendarGrid & {
  googleCalendarConfigured: boolean;
};

type WorkshopCalendarProps = {
  calendarFeedUrl?: string | null;
  googleCalendarConfigured?: boolean;
};

function getWeekRange(anchor: Date): { from: string; to: string } {
  const weekStart = startOfWeek(new TZDate(anchor, WORKSHOP_TIMEZONE), {
    weekStartsOn: 1,
    locale: da,
  });
  return {
    from: toDateInputValue(new Date(weekStart.getTime())),
    to: toDateInputValue(addDays(weekStart, 6)),
  };
}

function slotTone(occupied: number): string {
  if (occupied === 0) return "bg-white text-stone-400";
  if (occupied >= WORKSHOP_CONFIG.maxCapacity) return "bg-red-50 text-red-900";
  if (occupied >= WORKSHOP_CONFIG.maxCapacity - 2) return "bg-amber-50 text-amber-900";
  return "bg-brand-light/60 text-stone-800";
}

function HourCell({ slot }: { slot: CalendarDay["hours"][number] }) {
  if (slot.occupied === 0) {
    return (
      <div className="min-h-[3.25rem] border-t border-stone-100 px-1 py-1 text-xs text-stone-300">
        ·
      </div>
    );
  }

  return (
    <div
      className={`min-h-[3.25rem] border-t border-stone-100 px-1.5 py-1 text-xs ${slotTone(slot.occupied)}`}
      title={`${slot.occupied}/${WORKSHOP_CONFIG.maxCapacity} personer`}
    >
      <div className="font-semibold tabular-nums">{slot.occupied}</div>
      <ul className="mt-0.5 space-y-0.5 leading-tight">
        {slot.attendees.map((attendee) => (
          <li
            key={`${attendee.eventId}-${attendee.firstName}`}
            className={attendee.source === "google" ? "text-violet-800" : undefined}
          >
            {attendee.firstName}
            {attendee.persons > 1 ? ` ×${attendee.persons}` : ""}
            {attendee.source === "google" ? " (kursus)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkshopCalendar({
  calendarFeedUrl,
  googleCalendarConfigured = false,
}: WorkshopCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [grid, setGrid] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const weekRange = useMemo(() => getWeekRange(weekAnchor), [weekAnchor]);

  const weekTitle = useMemo(() => {
    const from = parseISO(weekRange.from);
    const to = parseISO(weekRange.to);
    return `${format(from, "d. MMM", { locale: da })} – ${format(to, "d. MMM yyyy", { locale: da })}`;
  }, [weekRange]);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(weekRange);
      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente kalender");
        return;
      }
      setGrid(data);
    } catch {
      setError("Kunne ikke hente kalender");
    } finally {
      setLoading(false);
    }
  }, [weekRange]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const googleSubscribeUrl = useMemo(() => {
    if (!calendarFeedUrl) return null;
    return calendarFeedUrl.replace(/^https?/, "webcal");
  }, [calendarFeedUrl]);

  const displayHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = CALENDAR_DISPLAY_HOUR_START; h < CALENDAR_DISPLAY_HOUR_END; h++) {
      hours.push(h);
    }
    return hours;
  }, []);

  return (
    <section className="mt-12 border-t border-stone-200 pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-stone-900">Kalender</h2>
          <p className="mt-2 text-sm text-stone-600">
            Her kan du se hvad eller hvem der allerede er i værkstedet — men bare rolig, der er{" "}
            {WORKSHOP_CONFIG.maxCapacity} pladser, så med mindre der er kursus er der sikkert også
            plads til dig.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}
              className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50"
              aria-label="Forrige uge"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekAnchor(new Date())}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              I dag
            </button>
            <button
              type="button"
              onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
              className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-50"
              aria-label="Næste uge"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-2 text-sm font-medium text-stone-900">{weekTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-brand-light/60 border border-stone-200" />
              Ledige pladser
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-amber-50 border border-amber-200" />
              Næsten fuldt
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-red-50 border border-red-200" />
              Fuldt ({WORKSHOP_CONFIG.maxCapacity})
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          {loading && !grid ? (
            <p className="p-8 text-center text-sm text-stone-500">Henter kalender…</p>
          ) : grid ? (
            <div className="min-w-[720px]">
              <div
                className="grid border-b border-stone-200 bg-stone-50"
                style={{ gridTemplateColumns: `4rem repeat(${grid.days.length}, minmax(6rem, 1fr))` }}
              >
                <div className="px-2 py-3 text-xs font-medium text-stone-500">Time</div>
                {grid.days.map((day) => (
                  <div key={day.date} className="px-2 py-3 text-center">
                    <div className="text-xs uppercase text-stone-500">{day.weekdayLabel}</div>
                    <div className="text-sm font-semibold text-stone-900">{day.dayLabel}</div>
                  </div>
                ))}
              </div>

              {displayHours.map((hour) => (
                <div
                  key={hour}
                  className="grid"
                  style={{
                    gridTemplateColumns: `4rem repeat(${grid.days.length}, minmax(6rem, 1fr))`,
                  }}
                >
                  <div className="border-t border-stone-100 px-2 py-2 text-xs font-medium text-stone-500 tabular-nums">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {grid.days.map((day) => {
                    const slot = day.hours[hour - CALENDAR_DISPLAY_HOUR_START];
                    return <div key={`${day.date}-${hour}`}>{slot ? <HourCell slot={slot} /> : null}</div>;
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium text-stone-900">Google Kalender</p>
              <p className="mt-1">
                Abonnér på værkstedskalenderen i Google Kalender-appen, så du også kan se
                bookinger der.
                {googleCalendarConfigured
                  ? " Kurser fra Google Kalender vises også i oversigten."
                  : " Kurser kan kobles på via Google Kalender-integration (GOOGLE_CALENDAR_ID)."}
              </p>
            </div>
            {googleSubscribeUrl ? (
              <a
                href={googleSubscribeUrl}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:border-brand hover:text-brand transition-colors shrink-0"
              >
                <CalendarPlus className="h-4 w-4" />
                Tilføj til Google Kalender
              </a>
            ) : (
              <p className="text-xs text-stone-500 shrink-0">
                Sæt CALENDAR_FEED_TOKEN i miljøvariabler for at aktivere abonnementslink.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

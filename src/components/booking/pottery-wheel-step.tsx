"use client";

import { Plus, Trash2 } from "lucide-react";
import { formatDKK, WORKSHOP_CONFIG } from "@/lib/config";
import {
  createPotteryWheelDraft,
  PotteryWheelReservationDraft,
} from "@/lib/pottery-wheels";
import { toTimeInputValue, getWholeHourOptionsInRange } from "@/lib/booking-slots";

type PotteryWheelStepProps = {
  bookingStart: Date;
  bookingEnd: Date;
  persons: number;
  pricePerHourOre: number;
  reservations: PotteryWheelReservationDraft[];
  onChange: (reservations: PotteryWheelReservationDraft[]) => void;
  error?: string;
};

export function PotteryWheelStep({
  bookingStart,
  bookingEnd,
  persons,
  pricePerHourOre,
  reservations,
  onChange,
  error,
}: PotteryWheelStepProps) {
  const minTime = toTimeInputValue(bookingStart);
  const maxTime = toTimeInputValue(bookingEnd);
  const bookingHourOptions = getWholeHourOptionsInRange(bookingStart, bookingEnd);
  const fromHourOptions = bookingHourOptions.filter((hour) => hour < maxTime);
  const canAdd = reservations.length < persons;

  const addReservation = () => {
    if (!canAdd) return;
    const used = new Set(reservations.map((r) => r.wheelNumber));
    const firstFree =
      Array.from({ length: WORKSHOP_CONFIG.totalPotteryWheels }, (_, i) => i + 1).find(
        (num) => !used.has(num)
      ) ?? 1;
    const draft = createPotteryWheelDraft(bookingStart, bookingEnd);
    onChange([...reservations, { ...draft, wheelNumber: firstFree }]);
  };

  const updateReservation = (
    clientId: string,
    patch: Partial<Omit<PotteryWheelReservationDraft, "clientId">>
  ) => {
    onChange(
      reservations.map((r) => {
        if (r.clientId !== clientId) return r;

        const next = { ...r, ...patch };

        if (patch.fromTime && next.toTime <= patch.fromTime) {
          const nextToTime = bookingHourOptions.find((hour) => hour > patch.fromTime!);
          if (nextToTime) next.toTime = nextToTime;
        }

        return next;
      })
    );
  };

  const removeReservation = (clientId: string) => {
    onChange(reservations.filter((r) => r.clientId !== clientId));
  };

  const usedWheelNumbers = new Set(reservations.map((r) => r.wheelNumber));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-stone-900">Tilvalg</h2>

      <div className="space-y-2 text-sm text-stone-600">
        <p>Du er altid velkommen til at bruge vores 7 drejeskiver gratis.</p>
        <p>Vil du sikre dig en drejeskive kan du booke en her.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <p className="font-medium text-stone-900">Drejeskive-reservation</p>
        <p className="mt-1">
          {formatDKK(pricePerHourOre)}/time pr. reserveret drejeskive · max {persons}{" "}
          stk. (én pr. person)
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Booking: {minTime}–{maxTime}
        </p>
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-stone-500">Ingen drejeskiver reserveret.</p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div
              key={reservation.clientId}
              className="rounded-xl border border-stone-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-900">Drejeskive</span>
                <button
                  type="button"
                  onClick={() => removeReservation(reservation.clientId)}
                  className="text-stone-400 hover:text-red-600 transition-colors"
                  aria-label="Fjern drejeskive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-stone-600">Nummer</span>
                  <select
                    value={reservation.wheelNumber}
                    onChange={(e) =>
                      updateReservation(reservation.clientId, {
                        wheelNumber: parseInt(e.target.value, 10),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  >
                    {Array.from(
                      { length: WORKSHOP_CONFIG.totalPotteryWheels },
                      (_, i) => i + 1
                    ).map((num) => (
                      <option
                        key={num}
                        value={num}
                        disabled={
                          usedWheelNumbers.has(num) && reservation.wheelNumber !== num
                        }
                      >
                        Drejeskive {num}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-stone-600">Fra</span>
                  <select
                    value={reservation.fromTime}
                    onChange={(e) =>
                      updateReservation(reservation.clientId, { fromTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  >
                    {fromHourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-stone-600">Til</span>
                  <select
                    value={reservation.toTime}
                    onChange={(e) =>
                      updateReservation(reservation.clientId, { toTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  >
                    {bookingHourOptions
                      .filter((hour) => hour > reservation.fromTime)
                      .map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addReservation}
        disabled={!canAdd}
        className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full justify-center"
      >
        <Plus className="h-4 w-4" />
        Tilføj drejeskive
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

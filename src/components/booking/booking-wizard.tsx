"use client";

import { useState, useCallback } from "react";
import { format, addHours } from "date-fns";
import { da } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Users, Clock, Calendar, CircleDot, Check } from "lucide-react";
import { PRICING, WORKSHOP_CONFIG, formatDKK } from "@/lib/config";
import { calculateBookingPrice } from "@/lib/pricing";

type OccupancySlot = {
  hour: string;
  occupied: number;
  available: number;
  isFull: boolean;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { num: 1, label: "Timer", icon: Clock },
  { num: 2, label: "Personer", icon: Users },
  { num: 3, label: "Dato & tid", icon: Calendar },
  { num: 4, label: "Tilvalg", icon: CircleDot },
  { num: 5, label: "Oversigt", icon: Check },
  { num: 6, label: "Betaling", icon: Check },
] as const;

export function BookingWizard({
  subscriptionHoursAvailable = 0,
}: {
  subscriptionHoursAvailable?: number;
}) {
  const [step, setStep] = useState<Step>(1);
  const [hours, setHours] = useState(2);
  const [persons, setPersons] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [hasPotteryWheel, setHasPotteryWheel] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canBook, setCanBook] = useState(true);

  const startTime = date && time ? new Date(`${date}T${time}:00`) : null;
  const endTime = startTime ? addHours(startTime, hours) : null;

  const pricing = calculateBookingPrice({
    hours,
    persons,
    hasPotteryWheel,
    subscriptionHoursAvailable,
  });

  const fetchOccupancy = useCallback(async () => {
    if (!startTime) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        startTime: startTime.toISOString(),
        hours: String(hours),
        persons: String(persons),
      });
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();

      setOccupancy(data.occupancy ?? []);
      setCanBook(data.canBook ?? false);
      if (!data.canBook) setError(data.reason ?? "Ikke nok plads");
    } catch {
      setError("Kunne ikke hente belægning");
    } finally {
      setLoading(false);
    }
  }, [startTime, hours, persons]);

  const handleNext = async () => {
    if (step === 3) {
      await fetchOccupancy();
    }
    if (step < 6) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!startTime) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours,
          persons,
          startTime: startTime.toISOString(),
          hasPotteryWheel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Noget gik galt");
        return;
      }

      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.confirmed) {
        window.location.href = `/booking/bekraeftelse?booking=${data.bookingId}`;
      }
    } catch {
      setError("Kunne ikke oprette booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.slice(0, 5).map(({ num, label, icon: Icon }) => (
          <div key={num} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                step >= num
                  ? "border-brand bg-brand text-white"
                  : "border-stone-200 text-stone-400"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs text-stone-500 hidden sm:block">{label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Hvor mange timer vil du booke?</h2>
            <p className="text-stone-500 text-sm">
              Du kan booke mellem {WORKSHOP_CONFIG.minHours} og {WORKSHOP_CONFIG.maxHours} timer i træk.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`rounded-xl py-3 text-sm font-medium transition-colors ${
                    hours === h
                      ? "bg-brand text-white"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {h}t
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Hvor mange personer?</h2>
            <p className="text-stone-500 text-sm">
              Max {WORKSHOP_CONFIG.maxCapacity} personer i værkstedet ad gangen.
            </p>
            <div className="flex gap-3 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersons(p)}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-medium transition-colors ${
                    persons === p
                      ? "bg-brand text-white"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Vælg dato og starttid</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Dato</label>
                <input
                  type="date"
                  value={date}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Starttid</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>
            {startTime && endTime && (
              <p className="text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">
                {format(startTime, "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: da })} —{" "}
                {format(endTime, "HH:mm", { locale: da })} ({hours} timer)
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Tilvalg</h2>
            <button
              onClick={() => setHasPotteryWheel(!hasPotteryWheel)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                hasPotteryWheel
                  ? "border-brand bg-brand-light"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">Drejeskive</p>
                  <p className="text-sm text-stone-500">
                    Reserver en drejeskive (+{formatDKK(PRICING.potteryWheelPerHourOre)}/time)
                  </p>
                </div>
                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    hasPotteryWheel ? "border-brand bg-brand" : "border-stone-300"
                  }`}
                >
                  {hasPotteryWheel && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Oversigt</h2>

            <div className="space-y-3 rounded-xl bg-stone-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Dato & tid</span>
                <span className="font-medium text-stone-900">
                  {startTime &&
                    format(startTime, "d. MMM yyyy 'kl.' HH:mm", { locale: da })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Varighed</span>
                <span className="font-medium text-stone-900">{hours} timer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Personer</span>
                <span className="font-medium text-stone-900">{persons}</span>
              </div>
              {hasPotteryWheel && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Drejeskive</span>
                  <span className="font-medium text-stone-900">Ja</span>
                </div>
              )}
            </div>

            {/* Belægning */}
            {occupancy.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700">Belægning i perioden</p>
                <div className="grid gap-1 max-h-40 overflow-y-auto">
                  {occupancy.map((slot) => (
                    <div
                      key={slot.hour}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        slot.isFull
                          ? "bg-red-50 text-red-700"
                          : slot.occupied + persons > 7
                            ? "bg-brand-light text-brand-dark"
                            : "bg-green-50 text-green-800"
                      }`}
                    >
                      <span>
                        {format(new Date(slot.hour), "HH:mm", { locale: da })}
                      </span>
                      <span>
                        {slot.occupied}/{WORKSHOP_CONFIG.maxCapacity} personer
                        {!slot.isFull && slot.occupied + persons <= WORKSHOP_CONFIG.maxCapacity && (
                          <span className="ml-2 opacity-70">— plads til jer ✓</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-stone-200 pt-4 space-y-1">
              {pricing.breakdown.map((line) => (
                <p key={line} className="text-sm text-stone-600">{line}</p>
              ))}
              <div className="flex justify-between text-lg font-semibold text-stone-900 pt-2">
                <span>Total</span>
                <span>{formatDKK(pricing.totalPriceOre)}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 rounded-xl px-4 py-2 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Tilbage
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={step === 3 && (!date || !time)}
              className="flex items-center gap-1 rounded-xl bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              Næste
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canBook}
              className="flex items-center gap-1 rounded-xl bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Behandler..."
                : pricing.totalPriceOre === 0
                  ? "Bekræft booking"
                  : `Betal ${formatDKK(pricing.totalPriceOre)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

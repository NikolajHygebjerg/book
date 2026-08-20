"use client";

import { useState, useCallback, useEffect } from "react";
import { format, addHours } from "date-fns";
import { da } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { WORKSHOP_CONFIG, formatDKK, formatBookingHours, formatBookingHoursShort } from "@/lib/config";
import { calculateBookingPrice } from "@/lib/pricing";
import { PricingSettings } from "@/lib/pricing-settings";
import {
  getMinTimeForDate,
  getTodayDateInputValue,
  parseBookingDateTime,
} from "@/lib/booking-slots";

type OccupancySlot = {
  hour: string;
  occupied: number;
  available: number;
  isFull: boolean;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = ["Timer", "Personer", "Dato", "Tilvalg", "Oversigt"] as const;

const basisPlan = (pricing: PricingSettings) => pricing.subscriptions.BASIS;

export function BookingWizard({
  subscriptionHoursAvailable = 0,
  pricingSettings,
  zeroPricing = false,
  onStepChange,
}: {
  subscriptionHoursAvailable?: number;
  pricingSettings: PricingSettings;
  zeroPricing?: boolean;
  onStepChange?: (step: Step) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [hours, setHours] = useState(2);
  const [persons, setPersons] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hasPotteryWheel, setHasPotteryWheel] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canBook, setCanBook] = useState(true);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const startTime = date && time ? parseBookingDateTime(date, time) : null;
  const endTime = startTime ? addHours(startTime, hours) : null;

  const pricing = calculateBookingPrice(
    {
      hours,
      persons,
      hasPotteryWheel,
      subscriptionHoursAvailable,
    },
    pricingSettings
  );

  const totalPriceOre = pricing.totalPriceOre;

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

  const maxOccupied = occupancy.reduce((max, slot) => Math.max(max, slot.occupied), 0);
  const hasSpace = occupancy.every((slot) => !slot.isFull && slot.occupied + persons <= WORKSHOP_CONFIG.maxCapacity);

  return (
    <div className="mx-auto max-w-2xl">
      {step < 5 && (
        <div className="mb-6 flex items-center gap-1">
          {STEPS.slice(0, 4).map((label, i) => {
            const num = (i + 1) as Step;
            return (
              <div key={label} className="flex flex-1 items-center gap-1">
                <div
                  className={`h-1.5 flex-1 rounded-full ${
                    step >= num ? "bg-brand" : "bg-stone-200"
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${step === 5 ? "p-4" : "p-6"}`}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-900">Hvor mange timer vil du booke?</h2>
            <p className="text-stone-500 text-sm">
              Vælg 1–6 timer, 12 timer eller et helt døgn.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {WORKSHOP_CONFIG.bookingHourOptions.map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`rounded-xl py-3 text-sm font-medium transition-colors ${
                    hours === h
                      ? "bg-brand text-white"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {formatBookingHoursShort(h)}
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
            <h2 className="text-xl font-semibold text-stone-900">Vælg dato og tid</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Dato</label>
                <input
                  type="date"
                  value={date}
                  min={getTodayDateInputValue()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Starttid</label>
                <input
                  type="time"
                  value={time}
                  min={date ? getMinTimeForDate(date) : undefined}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>
            {startTime && endTime && (
              <p className="text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">
                {format(startTime, "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: da })} —{" "}
                {format(endTime, "HH:mm", { locale: da })} ({formatBookingHours(hours)})
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
                    Reserver en drejeskive (+{formatDKK(pricingSettings.potteryWheelPerHourOre)}/time)
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
          <div className="space-y-3">
            <div className="space-y-2 rounded-xl bg-stone-50 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-500 shrink-0">Dato & tid</span>
                <span className="font-medium text-stone-900 text-right">
                  {startTime &&
                    format(startTime, "d. MMM yyyy 'kl.' HH:mm", { locale: da })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Varighed</span>
                <span className="font-medium text-stone-900">{formatBookingHours(hours)}</span>
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
              {occupancy.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Belægning</span>
                  <span className={`font-medium text-right ${hasSpace ? "text-green-700" : "text-red-700"}`}>
                    {maxOccupied}/{WORKSHOP_CONFIG.maxCapacity} personer
                    {hasSpace ? " — plads til jer" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-lg font-semibold text-stone-900 px-1">
              <span>Total</span>
              <span>{formatDKK(totalPriceOre)}</span>
            </div>

            {zeroPricing && totalPriceOre > 0 && (
              <p className="text-sm text-brand bg-brand-light rounded-xl px-4 py-2">
                Testtilstand: du betaler 0 kr. som admin — vist pris er den konfigurerede.
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !canBook}
              className="w-full rounded-xl bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Behandler..."
                : zeroPricing || totalPriceOre === 0
                  ? "Bekræft booking"
                  : `Betal ${formatDKK(totalPriceOre)}`}
            </button>

            <div className="rounded-xl border border-brand-light bg-brand-light p-3 text-center">
              <p className="text-sm text-stone-700">
                Køb abonnement fra {formatDKK(basisPlan(pricingSettings).monthlyPriceOre)}/md for{" "}
                {basisPlan(pricingSettings).hoursPerMonth === "unlimited"
                  ? "ubegrænset"
                  : `${basisPlan(pricingSettings).hoursPerMonth} timer om måneden`}{" "}
                — tryk her
              </p>
              <Link
                href="/abonnement"
                className="mt-2 inline-block w-full rounded-xl bg-white border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light transition-colors"
              >
                Se abonnement
              </Link>
            </div>
          </div>
        )}

        {error && step !== 5 && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {step !== 5 && (
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

            <button
              onClick={handleNext}
              disabled={step === 3 && (!date || !time)}
              className="flex items-center gap-1 rounded-xl bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              Næste
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 5 && (
          <button
            onClick={handleBack}
            className="mt-3 flex items-center gap-1 rounded-xl px-2 py-1 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tilbage
          </button>
        )}
      </div>
    </div>
  );
}

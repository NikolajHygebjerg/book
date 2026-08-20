"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WORKSHOP_CONFIG,
  formatBookingHours,
  formatDKK,
  SubscriptionPlanKey,
} from "@/lib/config";
import { PricingSettings } from "@/lib/pricing-settings";

type FormState = {
  potteryWheelPerHourOre: number;
  bookingHourPrices: Record<number, number>;
  subscriptions: Record<
    SubscriptionPlanKey,
    {
      name: string;
      description: string;
      hoursPerMonth: number | "unlimited";
      monthlyPriceOre: number;
    }
  >;
};

function toFormState(pricing: PricingSettings): FormState {
  return {
    potteryWheelPerHourOre: pricing.potteryWheelPerHourOre,
    bookingHourPrices: { ...pricing.bookingHourPrices },
    subscriptions: {
      BASIS: { ...pricing.subscriptions.BASIS },
      PLUS: { ...pricing.subscriptions.PLUS },
      UNLIMITED: { ...pricing.subscriptions.UNLIMITED },
    },
  };
}

function oreToKrInput(ore: number): string {
  return (ore / 100).toFixed(0);
}

function krInputToOre(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed * 100 : 0;
}

const PLAN_KEYS: SubscriptionPlanKey[] = ["BASIS", "PLUS", "UNLIMITED"];

export function AdminPricingEditor({ initialPricing }: { initialPricing: PricingSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialPricing));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        potteryWheelPerHourOre: form.potteryWheelPerHourOre,
        bookingHourPrices: Object.fromEntries(
          WORKSHOP_CONFIG.bookingHourOptions.map((hours) => [
            String(hours),
            form.bookingHourPrices[hours] ?? 0,
          ])
        ),
        subscriptions: form.subscriptions,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kunne ikke gemme");
      setSaving(false);
      return;
    }

    setForm(toFormState(data));
    setMessage("Priser gemt");
    router.refresh();
    setSaving(false);
  };

  const oneHourPrice = form.bookingHourPrices[1] ?? 0;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Timebooking</h2>
        <p className="text-sm text-stone-500 mb-6">
          Pris per person for hver bookingvarighed. Sæt f.eks. 5 timer lavere end 5× 1 time
          for at give mængderabat.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKSHOP_CONFIG.bookingHourOptions.map((hours) => {
            const priceOre = form.bookingHourPrices[hours] ?? 0;
            const linearPrice = oneHourPrice * hours;
            const hasDiscount = hours > 1 && priceOre < linearPrice;

            return (
              <label key={hours} className="block">
                <span className="text-sm font-medium text-stone-700">
                  {formatBookingHours(hours)}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={oreToKrInput(priceOre)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bookingHourPrices: {
                          ...prev.bookingHourPrices,
                          [hours]: krInputToOre(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  />
                  <span className="text-sm text-stone-500 shrink-0">kr</span>
                </div>
                {hours > 1 && (
                  <p className="mt-1 text-xs text-stone-400">
                    1 time × {hours} = {formatDKK(linearPrice)}
                    {hasDiscount && (
                      <span className="text-green-700"> · rabat</span>
                    )}
                  </p>
                )}
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Drejeskive</h2>
        <label className="block max-w-xs">
          <span className="text-sm font-medium text-stone-700">Tillæg per time</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={oreToKrInput(form.potteryWheelPerHourOre)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  potteryWheelPerHourOre: krInputToOre(e.target.value),
                }))
              }
              className="w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <span className="text-sm text-stone-500">kr/time</span>
          </div>
        </label>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-stone-900">Abonnementer</h2>
        {PLAN_KEYS.map((planKey) => {
          const plan = form.subscriptions[planKey];
          const isUnlimited = plan.hoursPerMonth === "unlimited";

          return (
            <div
              key={planKey}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4"
            >
              <h3 className="font-medium text-stone-900">{planKey}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Navn</span>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        subscriptions: {
                          ...prev.subscriptions,
                          [planKey]: { ...prev.subscriptions[planKey], name: e.target.value },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Månedspris</span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={oreToKrInput(plan.monthlyPriceOre)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          subscriptions: {
                            ...prev.subscriptions,
                            [planKey]: {
                              ...prev.subscriptions[planKey],
                              monthlyPriceOre: krInputToOre(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                    />
                    <span className="text-sm text-stone-500">kr/md</span>
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Beskrivelse</span>
                <input
                  type="text"
                  value={plan.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      subscriptions: {
                        ...prev.subscriptions,
                        [planKey]: {
                          ...prev.subscriptions[planKey],
                          description: e.target.value,
                        },
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </label>
              <label className="block max-w-xs">
                <span className="text-sm font-medium text-stone-700">Timer per måned</span>
                {planKey === "UNLIMITED" ? (
                  <p className="mt-2 text-sm text-stone-500">Ubegrænset</p>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={744}
                    value={isUnlimited ? "" : plan.hoursPerMonth}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        subscriptions: {
                          ...prev.subscriptions,
                          [planKey]: {
                            ...prev.subscriptions[planKey],
                            hoursPerMonth: parseInt(e.target.value, 10) || 1,
                          },
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
                  />
                )}
              </label>
            </div>
          );
        })}
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {saving ? "Gemmer..." : "Gem priser"}
        </button>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      <p className="text-xs text-stone-400">
        Abonnementspriser bruges direkte i Stripe Checkout. Eksisterende abonnenter beholder
        deres nuværende Stripe-pris indtil de skifter plan.
      </p>
    </div>
  );
}

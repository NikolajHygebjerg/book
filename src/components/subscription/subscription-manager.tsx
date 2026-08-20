"use client";

import { useState } from "react";
import { PRICING, formatDKK } from "@/lib/config";
import { Check } from "lucide-react";

type SubscriptionData = {
  subscription: {
    plan: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;
  hoursUsed: number;
  hoursAvailable: number | "unlimited";
};

const PLANS = [
  { key: "BASIS" as const, ...PRICING.subscriptions.BASIS },
  { key: "PLUS" as const, ...PRICING.subscriptions.PLUS },
  { key: "UNLIMITED" as const, ...PRICING.subscriptions.UNLIMITED },
];

export function SubscriptionManager({ initialData }: { initialData: SubscriptionData }) {
  const [data] = useState(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    setError("");

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error ?? "Noget gik galt");
      setLoading(null);
      return;
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else if (result.portalUrl) {
      window.location.href = result.portalUrl;
    }
  };

  const activePlan = data.subscription?.plan;

  return (
    <div className="space-y-8">
      {data.subscription && (
        <section className="rounded-2xl border border-brand-light bg-brand-light p-6">
          <h2 className="text-lg font-semibold text-brand-dark mb-2">Dit abonnement</h2>
          <p className="text-brand-dark">
            {PRICING.subscriptions[activePlan as keyof typeof PRICING.subscriptions]?.name ??
              activePlan}
            {data.subscription.cancelAtPeriodEnd && " (opsagt ved periodens udløb)"}
          </p>
          <p className="text-sm text-brand mt-1">
            {data.hoursAvailable === "unlimited"
              ? "Ubegrænset timer denne uge"
              : `${data.hoursAvailable} timer tilbage denne uge (${data.hoursUsed} brugt)`}
          </p>
          <button
            onClick={() => handleSubscribe(activePlan!)}
            disabled={!!loading}
            className="mt-4 rounded-xl border border-brand-light px-4 py-2 text-sm text-brand-dark hover:bg-brand-light transition-colors"
          >
            Administrer abonnement
          </button>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          {data.subscription ? "Skift abonnement" : "Vælg abonnement"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border-2 p-6 flex flex-col ${
                activePlan === plan.key
                  ? "border-brand bg-brand-light"
                  : "border-stone-200 bg-white"
              }`}
            >
              <h3 className="font-semibold text-stone-900 text-lg">{plan.name}</h3>
              <p className="text-3xl font-bold text-stone-900 mt-2">
                {formatDKK(plan.monthlyPriceOre)}
                <span className="text-sm font-normal text-stone-500">/md</span>
              </p>
              <p className="text-sm text-stone-500 mt-2 flex-1">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand" />
                  {plan.hoursPerWeek === Infinity
                    ? "Ubegrænset timer/uge"
                    : `${plan.hoursPerWeek} timer/uge`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand" />
                  Book døgnet rundt
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={!!loading || activePlan === plan.key}
                className="mt-6 w-full rounded-xl bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {loading === plan.key
                  ? "Vent..."
                  : activePlan === plan.key
                    ? "Nuværende plan"
                    : "Vælg plan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

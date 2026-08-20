import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING, formatDKK } from "@/lib/config";

const PLANS = [
  { key: "BASIS" as const, ...PRICING.subscriptions.BASIS, highlight: false },
  { key: "PLUS" as const, ...PRICING.subscriptions.PLUS, highlight: true },
  { key: "UNLIMITED" as const, ...PRICING.subscriptions.UNLIMITED, highlight: false },
];

const BENEFITS = [
  "Book tid døgnet rundt — når det passer dig",
  "Abonnementstimer trækkes automatisk ved booking",
  "Adgang til hele det åbne værksted",
  "Ingen binding — opsig når som helst",
];

export function SubscriptionLanding({ isLoggedIn }: { isLoggedIn: boolean }) {
  const ctaHref = isLoggedIn ? "/min-side/abonnement" : "/";
  const ctaLabel = isLoggedIn ? "Vælg abonnement" : "Opret konto og kom i gang";

  return (
    <div className="space-y-12">
      <section className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium uppercase tracking-wide text-brand mb-3">
          Abonnement
        </p>
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
          Kom oftere i værkstedet — og spar på timerne
        </h1>
        <p className="mt-4 text-stone-600 text-lg">
          Med et abonnement får du faste timer hver uge i keramikværkstedet. Book når det
          passer dig, og betal kun for det, abonnementet ikke dækker.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border-2 p-6 flex flex-col ${
              plan.highlight
                ? "border-brand bg-brand-light shadow-sm"
                : "border-stone-200 bg-white"
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 inline-block w-fit rounded-full bg-brand px-3 py-0.5 text-xs font-medium text-white">
                Mest populær
              </span>
            )}
            <h2 className="font-semibold text-stone-900 text-lg">{plan.name}</h2>
            <p className="text-3xl font-bold text-stone-900 mt-2">
              {formatDKK(plan.monthlyPriceOre)}
              <span className="text-sm font-normal text-stone-500">/md</span>
            </p>
            <p className="text-sm text-stone-500 mt-2 flex-1">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-brand" />
                {plan.hoursPerWeek === Infinity
                  ? "Ubegrænset timer/uge"
                  : `${plan.hoursPerWeek} timer/uge`}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-brand" />
                Book døgnet rundt
              </li>
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-8 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Det får du</h2>
        <ul className="space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-stone-700">
              <Check className="h-5 w-5 shrink-0 text-brand mt-0.5" />
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
        <Link
          href={ctaHref}
          className="inline-flex rounded-full bg-brand px-8 py-3 font-medium text-white hover:bg-brand-dark transition-colors"
        >
          {ctaLabel}
        </Link>
        {!isLoggedIn && (
          <p className="mt-3 text-sm text-stone-500">
            Har du allerede en konto?{" "}
            <Link href="/" className="text-brand hover:text-brand-dark">
              Log ind på forsiden
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

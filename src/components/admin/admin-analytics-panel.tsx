import { BarChart3, Clock, Users } from "lucide-react";
import { formatBookingHours } from "@/lib/config";
import { AdminAnalytics } from "@/lib/admin-analytics";
import { PricingSettings } from "@/lib/pricing-settings";
import { SubscriptionPlanKey } from "@/lib/config";

const PLAN_ORDER: SubscriptionPlanKey[] = ["BASIS", "PLUS", "UNLIMITED"];

type AdminAnalyticsPanelProps = {
  analytics: AdminAnalytics;
  pricing: PricingSettings;
};

export function AdminAnalyticsPanel({ analytics, pricing }: AdminAnalyticsPanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <BarChart3 className="h-5 w-5 text-brand mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Analyse</h2>
          <p className="text-sm text-stone-500 mt-1">
            Overblik over timer-bookinger og aktive abonnementer lige nu.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Users className="h-4 w-4" />
            Brugere med bookinger
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900 tabular-nums">
            {analytics.usersWithBookings}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Unikke brugere med mindst én bekræftet booking
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Clock className="h-4 w-4" />
            Betalt for timer
          </div>
          <p className="mt-2 text-3xl font-bold text-stone-900 tabular-nums">
            {analytics.usersWhoPaidForBookings}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Brugere der har betalt for mindst én booking
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        I alt {analytics.totalConfirmedBookings} bekræftede bookinger (
        {formatBookingHours(analytics.totalConfirmedHours)}).
      </p>

      <div className="mt-6 border-t border-stone-100 pt-6">
        <h3 className="text-sm font-semibold text-stone-900 mb-3">
          Aktive abonnenter ({analytics.totalActiveSubscribers})
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_ORDER.map((planKey) => {
            const plan = pricing.subscriptions[planKey];
            const count = analytics.activeSubscriptions[planKey];

            return (
              <div
                key={planKey}
                className="rounded-xl border border-stone-200 px-4 py-3 text-center"
              >
                <p className="text-sm font-medium text-stone-900">{plan.name}</p>
                <p className="mt-1 text-2xl font-bold text-brand tabular-nums">{count}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {plan.hoursPerMonth === "unlimited"
                    ? "Ubegrænset"
                    : `${plan.hoursPerMonth} t/md`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SubscriptionManager } from "@/components/subscription/subscription-manager";
import { getActiveSubscription, getWeeklyHoursUsed, getAvailableSubscriptionHours } from "@/lib/subscription";

export default async function AbonnementPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subscription = await getActiveSubscription(session.user.id);
  const hoursUsed = await getWeeklyHoursUsed(session.user.id);
  const hoursAvailable = await getAvailableSubscriptionHours(session.user.id);

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/min-side"
          className="text-sm text-stone-500 hover:text-stone-700 mb-4 inline-block"
        >
          ← Tilbage til min side
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Abonnement</h1>
        <p className="text-stone-500 mb-8">
          Vælg et abonnement der passer til hvor ofte du kommer i værkstedet.
        </p>
        <SubscriptionManager
          initialData={{
            subscription: subscription
              ? {
                  plan: subscription.plan,
                  status: subscription.status,
                  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                  currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                }
              : null,
            hoursUsed,
            hoursAvailable: hoursAvailable === Infinity ? "unlimited" : hoursAvailable,
          }}
        />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookPageClient } from "@/components/booking/book-page-client";
import { getActiveSubscription, getAvailableSubscriptionHours } from "@/lib/subscription";
import { getPricingSettings } from "@/lib/pricing-settings";
import { SubscriptionPlanKey } from "@/lib/config";

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [subscriptionHours, pricingSettings, subscription] = await Promise.all([
    getAvailableSubscriptionHours(session.user.id),
    getPricingSettings(),
    getActiveSubscription(session.user.id),
  ]);
  const available = subscriptionHours === Infinity ? 999 : subscriptionHours;

  return (
    <BookPageClient
      userName={session.user.name ?? ""}
      subscriptionHoursAvailable={available}
      hasActiveSubscription={!!subscription}
      hasUnlimitedSubscription={subscriptionHours === Infinity}
      currentSubscriptionPlan={
        subscription ? (subscription.plan as SubscriptionPlanKey) : null
      }
      pricingSettings={pricingSettings}
    />
  );
}

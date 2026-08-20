import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookPageClient } from "@/components/booking/book-page-client";
import { getAvailableSubscriptionHours } from "@/lib/subscription";
import { getPricingSettings } from "@/lib/pricing-settings";
import { shouldUseZeroPricing } from "@/lib/zero-pricing";

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [subscriptionHours, pricingSettings] = await Promise.all([
    getAvailableSubscriptionHours(session.user.id),
    getPricingSettings(),
  ]);
  const available = subscriptionHours === Infinity ? 999 : subscriptionHours;

  return (
    <BookPageClient
      userName={session.user.name ?? ""}
      subscriptionHoursAvailable={available}
      hasUnlimitedSubscription={subscriptionHours === Infinity}
      pricingSettings={pricingSettings}
      zeroPricing={shouldUseZeroPricing(session.user.email)}
    />
  );
}

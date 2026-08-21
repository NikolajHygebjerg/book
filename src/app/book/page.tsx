import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookPageClient } from "@/components/booking/book-page-client";
import { getAvailableSubscriptionHours } from "@/lib/subscription";
import { getPricingSettings } from "@/lib/pricing-settings";
import { getCalendarFeedToken, isCalendarFeedEnabled } from "@/lib/calendar/service";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/");

  const [subscriptionHours, pricingSettings] = await Promise.all([
    getAvailableSubscriptionHours(session.user.id),
    getPricingSettings(),
  ]);
  const available = subscriptionHours === Infinity ? 999 : subscriptionHours;

  const calendarFeedUrl =
    isCalendarFeedEnabled() && process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/calendar/feed.ics?token=${encodeURIComponent(getCalendarFeedToken()!)}`
      : null;

  return (
    <BookPageClient
      userName={session.user.name ?? ""}
      subscriptionHoursAvailable={available}
      hasUnlimitedSubscription={subscriptionHours === Infinity}
      pricingSettings={pricingSettings}
      calendarFeedUrl={calendarFeedUrl}
      googleCalendarConfigured={isGoogleCalendarConfigured()}
    />
  );
}

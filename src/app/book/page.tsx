import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookPageClient } from "@/components/booking/book-page-client";
import { getAvailableSubscriptionHours } from "@/lib/subscription";

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/");

  const subscriptionHours = await getAvailableSubscriptionHours(session.user.id);
  const available = subscriptionHours === Infinity ? 999 : subscriptionHours;

  return (
    <BookPageClient
      userName={session.user.name ?? ""}
      subscriptionHoursAvailable={available}
      hasUnlimitedSubscription={subscriptionHours === Infinity}
    />
  );
}

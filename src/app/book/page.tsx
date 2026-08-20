import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getAvailableSubscriptionHours } from "@/lib/subscription";

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subscriptionHours = await getAvailableSubscriptionHours(session.user.id);
  const available =
    subscriptionHours === Infinity ? 999 : subscriptionHours;

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Book værkstedstid</h1>
        <p className="mt-1 text-stone-500">
          Hej {session.user.name}! Følg trinene for at booke.
        </p>
        {subscriptionHours > 0 && subscriptionHours !== Infinity && (
          <p className="mt-2 text-sm text-brand bg-brand-light rounded-full inline-block px-4 py-1">
            {subscriptionHours} abonnementstimer tilbage denne uge
          </p>
        )}
        {subscriptionHours === Infinity && (
          <p className="mt-2 text-sm text-brand bg-brand-light rounded-full inline-block px-4 py-1">
            Ubegrænset abonnement — alle timer er gratis
          </p>
        )}
      </div>
      <BookingWizard subscriptionHoursAvailable={available} />
    </div>
  );
}

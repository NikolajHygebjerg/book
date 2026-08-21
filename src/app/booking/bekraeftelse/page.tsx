import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { finalizePendingBookingAfterUpgrade } from "@/lib/finalize-pending-booking-after-upgrade";
import { ensureSubscriptionUpgradedFromCheckoutSession } from "@/lib/ensure-subscription-upgrade";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; session_id?: string; upgraded?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (params.upgraded === "true" && params.booking && session?.user?.id) {
    const booking = await db.booking.findFirst({
      where: { id: params.booking, userId: session.user.id },
    });

    if (booking?.status === "PENDING") {
      try {
        const stripeSessionId = params.session_id ?? booking.stripeSessionId;
        if (stripeSessionId) {
          await ensureSubscriptionUpgradedFromCheckoutSession(
            session.user.id,
            stripeSessionId
          );
        }

        const result = await finalizePendingBookingAfterUpgrade(
          session.user.id,
          params.booking
        );
        if (result.checkoutUrl) {
          redirect(result.checkoutUrl);
        }
      } catch {
        // Webhook may still be processing — show confirmation below
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-2xl font-bold text-stone-900">Booking bekræftet!</h1>
      <p className="mt-2 text-stone-500">
        Din booking er godkendt. Vi glæder os til at se dig i værkstedet.
      </p>
      {params.upgraded === "true" && (
        <p className="mt-2 text-sm text-brand">
          Dit abonnement er opgraderet, og bookingen er dækket af abonnementet.
        </p>
      )}
      {params.booking && (
        <p className="mt-4 text-xs text-stone-400">Booking ID: {params.booking}</p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/min-side"
          className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark transition-colors"
        >
          Se mine bookinger
        </Link>
        <Link
          href="/book"
          className="rounded-xl border border-stone-200 px-6 py-3 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Book igen
        </Link>
      </div>
    </div>
  );
}

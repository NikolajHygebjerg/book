import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPricingSettings } from "@/lib/pricing-settings";
import { AdminPricingEditor } from "@/components/admin/admin-pricing-editor";
import {
  AdminGoogleCalendarPanel,
} from "@/components/admin/admin-google-calendar-panel";
import { googleCalendarStatusMessage } from "@/lib/google-calendar/status-messages";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  if (!isAdminEmail(session.user.email)) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Ingen adgang</h1>
        <p className="mt-2 text-stone-500">
          Admin-siden kræver kontoen {process.env.ADMIN_EMAIL ?? "nikolaj@idevaerket.dk"}.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-2 text-white hover:bg-brand-dark"
        >
          Til forsiden
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const googleMessage = googleCalendarStatusMessage(params.google);

  const pricing = await getPricingSettings();

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Administration</h1>
          <p className="text-stone-500">Styr priser, kalender og abonnementer.</p>
        </div>
        <AdminGoogleCalendarPanel initialMessage={googleMessage} />
        <AdminPricingEditor initialPricing={pricing} />
      </div>
    </div>
  );
}

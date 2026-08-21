import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPricingSettings } from "@/lib/pricing-settings";
import { AdminPricingEditor } from "@/components/admin/admin-pricing-editor";
import {
  AdminGoogleCalendarPanel,
  googleCalendarStatusMessage,
} from "@/components/admin/admin-google-calendar-panel";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
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

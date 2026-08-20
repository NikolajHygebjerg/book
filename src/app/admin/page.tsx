import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPricingSettings } from "@/lib/pricing-settings";
import { AdminPricingEditor } from "@/components/admin/admin-pricing-editor";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const pricing = await getPricingSettings();

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Administration</h1>
        <p className="text-stone-500 mb-8">
          Styr priser for timebooking og abonnementer.
        </p>
        <AdminPricingEditor initialPricing={pricing} />
      </div>
    </div>
  );
}

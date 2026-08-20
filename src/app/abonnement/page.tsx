import { auth } from "@/lib/auth";
import { SubscriptionLanding } from "@/components/subscription/subscription-landing";

export default async function AbonnementMarketingPage() {
  const session = await auth();

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <SubscriptionLanding isLoggedIn={!!session} />
      </div>
    </div>
  );
}

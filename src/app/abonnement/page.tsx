import { auth } from "@/lib/auth";
import { SubscriptionLanding } from "@/components/subscription/subscription-landing";
import { getPricingSettings } from "@/lib/pricing-settings";
import { shouldUseZeroPricing } from "@/lib/zero-pricing";

export default async function AbonnementMarketingPage() {
  const session = await auth();
  const pricing = await getPricingSettings();
  const zeroPricing = shouldUseZeroPricing(session?.user?.email);

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <SubscriptionLanding
          isLoggedIn={!!session}
          pricing={pricing}
          zeroPricing={zeroPricing}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { PricingSettings } from "@/lib/pricing-settings";

type BookPageClientProps = {
  userName: string;
  subscriptionHoursAvailable: number;
  hasUnlimitedSubscription: boolean;
  pricingSettings: PricingSettings;
};

export function BookPageClient({
  userName,
  subscriptionHoursAvailable,
  hasUnlimitedSubscription,
  pricingSettings,
}: BookPageClientProps) {
  const [step, setStep] = useState(1);
  const isOverview = step === 5;

  return (
    <div className={`px-4 ${isOverview ? "py-4" : "py-12"}`}>
      {!isOverview && (
        <div className="mx-auto max-w-2xl text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Book værkstedstid</h1>
          <p className="mt-1 text-stone-500">Hej {userName}! Følg trinene for at booke.</p>
          {subscriptionHoursAvailable > 0 && !hasUnlimitedSubscription && (
            <p className="mt-2 text-sm text-brand bg-brand-light rounded-full inline-block px-4 py-1">
              {subscriptionHoursAvailable} abonnementstimer tilbage denne måned
            </p>
          )}
          {hasUnlimitedSubscription && (
            <p className="mt-2 text-sm text-brand bg-brand-light rounded-full inline-block px-4 py-1">
              Ubegrænset abonnement — alle timer er gratis
            </p>
          )}
        </div>
      )}
      <BookingWizard
        subscriptionHoursAvailable={subscriptionHoursAvailable}
        pricingSettings={pricingSettings}
        onStepChange={setStep}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { SubscriptionPlan } from "@/generated/prisma/client";
import { getPricingSettings } from "@/lib/pricing-settings";
import { SubscriptionPlanKey } from "@/lib/config";
import { shouldUseZeroPricing, zeroPriceOre } from "@/lib/zero-pricing";

const subscribeSchema = z.object({
  plan: z.enum(["BASIS", "PLUS", "UNLIMITED"]),
});

async function activateSubscriptionForTest(
  userId: string,
  plan: SubscriptionPlan
): Promise<void> {
  const existing = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (existing) {
    await db.subscription.update({
      where: { id: existing.id },
      data: { plan },
    });
    return;
  }

  await db.subscription.create({
    data: {
      userId,
      plan,
      status: "ACTIVE",
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Ugyldig plan" }, { status: 400 });
    }

    const plan = parsed.data.plan as SubscriptionPlan;
    const pricingSettings = await getPricingSettings();
    const planKey = plan as SubscriptionPlanKey;
    const planPricing = pricingSettings.subscriptions[planKey];

    if (!planPricing) {
      return NextResponse.json({ error: "Ukendt abonnement" }, { status: 400 });
    }

    const existing = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (shouldUseZeroPricing(session.user.email)) {
      await activateSubscriptionForTest(session.user.id, plan);
      return NextResponse.json({
        confirmed: true,
        redirectUrl: `${process.env.NEXTAUTH_URL}/min-side/abonnement?success=true`,
      });
    }

    if (existing?.stripeSubscriptionId) {
      const stripeSession = await getStripe().billingPortal.sessions.create({
        customer: existing.stripeCustomerId!,
        return_url: `${process.env.NEXTAUTH_URL}/min-side/abonnement`,
      });
      return NextResponse.json({ portalUrl: stripeSession.url });
    }

    const monthlyPriceOre = zeroPriceOre(planPricing.monthlyPriceOre, session.user.email);

    const stripeSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `Abonnement — ${planPricing.name}`,
              description: planPricing.description,
            },
            unit_amount: monthlyPriceOre,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        plan,
      },
      success_url: `${process.env.NEXTAUTH_URL}/min-side/abonnement?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/min-side/abonnement?cancelled=true`,
    });

    return NextResponse.json({ checkoutUrl: stripeSession.url });
  } catch {
    return NextResponse.json({ error: "Kunne ikke starte abonnement" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
  }

  const subscription = await db.subscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  const { getMonthlyHoursUsed, getAvailableSubscriptionHours } = await import(
    "@/lib/subscription"
  );

  const hoursUsed = await getMonthlyHoursUsed(session.user.id);
  const hoursAvailable = await getAvailableSubscriptionHours(session.user.id);

  return NextResponse.json({
    subscription,
    hoursUsed,
    hoursAvailable: hoursAvailable === Infinity ? "unlimited" : hoursAvailable,
  });
}

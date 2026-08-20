import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { planToStripePriceId } from "@/lib/subscription";
import { SubscriptionPlan } from "@/generated/prisma/client";

const subscribeSchema = z.object({
  plan: z.enum(["BASIS", "PLUS", "UNLIMITED"]),
});

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
    const priceId = planToStripePriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe pris ikke konfigureret for denne plan" },
        { status: 500 }
      );
    }

    const existing = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (existing?.stripeSubscriptionId) {
      const stripeSession = await getStripe().billingPortal.sessions.create({
        customer: existing.stripeCustomerId!,
        return_url: `${process.env.NEXTAUTH_URL}/min-side/abonnement`,
      });
      return NextResponse.json({ portalUrl: stripeSession.url });
    }

    const stripeSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
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

  const { getWeeklyHoursUsed, getAvailableSubscriptionHours } = await import(
    "@/lib/subscription"
  );

  const hoursUsed = await getWeeklyHoursUsed(session.user.id);
  const hoursAvailable = await getAvailableSubscriptionHours(session.user.id);

  return NextResponse.json({
    subscription,
    hoursUsed,
    hoursAvailable: hoursAvailable === Infinity ? "unlimited" : hoursAvailable,
  });
}

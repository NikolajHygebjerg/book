import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { recordSubscriptionHoursUsed } from "@/lib/subscription";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment" && session.metadata?.bookingId) {
        const bookingId = session.metadata.bookingId;
        const subscriptionHoursUsed = parseInt(
          session.metadata.subscriptionHoursUsed ?? "0",
          10
        );

        await db.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        if (subscriptionHoursUsed > 0 && session.metadata.userId) {
          await recordSubscriptionHoursUsed(
            session.metadata.userId,
            subscriptionHoursUsed
          );
        }

        await db.payment.create({
          data: {
            userId: session.metadata.userId!,
            bookingId,
            type: "BOOKING",
            status: "SUCCEEDED",
            amountOre: session.amount_total ?? 0,
            stripeSessionId: session.id,
          },
        });
      }

      if (session.mode === "subscription" && session.metadata?.userId) {
        const plan = session.metadata.plan as SubscriptionPlan;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        await db.subscription.create({
          data: {
            userId: session.metadata.userId,
            plan,
            status: "ACTIVE",
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, SubscriptionStatus> = {
        active: "ACTIVE",
        canceled: "CANCELLED",
        past_due: "PAST_DUE",
        incomplete: "INCOMPLETE",
      };

      const firstItem = subscription.items.data[0];
      const periodStart = firstItem?.current_period_start;
      const periodEnd = firstItem?.current_period_end;

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: statusMap[subscription.status] ?? "INCOMPLETE",
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          ...(periodStart && {
            currentPeriodStart: new Date(periodStart * 1000),
          }),
          ...(periodEnd && {
            currentPeriodEnd: new Date(periodEnd * 1000),
          }),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: "CANCELLED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

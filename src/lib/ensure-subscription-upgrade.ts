import { SubscriptionPlan } from "@/generated/prisma/client";
import { db } from "./db";
import { getStripe } from "./stripe";

export async function ensureSubscriptionUpgradedFromCheckoutSession(
  userId: string,
  stripeSessionId: string
): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);

  if (session.metadata?.upgradeFromBooking !== "true" || session.metadata.userId !== userId) {
    return;
  }

  const plan = session.metadata.plan as SubscriptionPlan;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const previousStripeSubscriptionId =
    session.metadata.previousStripeSubscriptionId || undefined;

  if (
    previousStripeSubscriptionId &&
    subscriptionId &&
    previousStripeSubscriptionId !== subscriptionId
  ) {
    try {
      await getStripe().subscriptions.cancel(previousStripeSubscriptionId);
    } catch {
      // Old subscription may already be cancelled
    }
  }

  await db.subscription.updateMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      status: "ACTIVE",
    },
  });
}

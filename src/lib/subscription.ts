import { startOfMonth } from "date-fns";
import { SubscriptionPlan } from "@/generated/prisma/client";
import { db } from "./db";
import { getSubscriptionMonthlyLimit } from "./pricing";
import { getPricingSettings } from "./pricing-settings";
import { SubscriptionPlanKey } from "./config";

export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date);
}

export async function getActiveSubscription(userId: string) {
  return db.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMonthlyHoursUsed(userId: string, date: Date = new Date()): Promise<number> {
  const monthStart = getMonthStart(date);

  const usage = await db.monthlyUsage.findUnique({
    where: {
      userId_monthStart: { userId, monthStart },
    },
  });

  return usage?.hoursUsed ?? 0;
}

export async function getAvailableSubscriptionHours(userId: string): Promise<number> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return 0;

  const plan = subscription.plan as SubscriptionPlanKey;
  const settings = await getPricingSettings();
  const monthlyLimit = getSubscriptionMonthlyLimit(plan, settings);

  if (monthlyLimit === Infinity) return Infinity;

  const used = await getMonthlyHoursUsed(userId);
  return Math.max(0, monthlyLimit - used);
}

export async function recordSubscriptionHoursUsed(
  userId: string,
  hours: number,
  date: Date = new Date()
): Promise<void> {
  const monthStart = getMonthStart(date);

  await db.monthlyUsage.upsert({
    where: {
      userId_monthStart: { userId, monthStart },
    },
    create: {
      userId,
      monthStart,
      hoursUsed: hours,
    },
    update: {
      hoursUsed: { increment: hours },
    },
  });
}

export function planToStripePriceId(plan: SubscriptionPlan): string | undefined {
  const map: Record<SubscriptionPlan, string | undefined> = {
    BASIS: process.env.STRIPE_PRICE_BASIS,
    PLUS: process.env.STRIPE_PRICE_PLUS,
    UNLIMITED: process.env.STRIPE_PRICE_UNLIMITED,
  };
  return map[plan];
}

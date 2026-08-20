import { startOfWeek, endOfWeek } from "date-fns";
import { SubscriptionPlan } from "@/generated/prisma/client";
import { db } from "./db";
import { getSubscriptionWeeklyLimit } from "./pricing";
import { SubscriptionPlanKey } from "./config";

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
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

export async function getWeeklyHoursUsed(userId: string, date: Date = new Date()): Promise<number> {
  const weekStart = getWeekStart(date);

  const usage = await db.weeklyUsage.findUnique({
    where: {
      userId_weekStart: { userId, weekStart },
    },
  });

  return usage?.hoursUsed ?? 0;
}

export async function getAvailableSubscriptionHours(userId: string): Promise<number> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return 0;

  const plan = subscription.plan as SubscriptionPlanKey;
  const weeklyLimit = getSubscriptionWeeklyLimit(plan);

  if (weeklyLimit === Infinity) return Infinity;

  const used = await getWeeklyHoursUsed(userId);
  return Math.max(0, weeklyLimit - used);
}

export async function recordSubscriptionHoursUsed(
  userId: string,
  hours: number,
  date: Date = new Date()
): Promise<void> {
  const weekStart = getWeekStart(date);

  await db.weeklyUsage.upsert({
    where: {
      userId_weekStart: { userId, weekStart },
    },
    create: {
      userId,
      weekStart,
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

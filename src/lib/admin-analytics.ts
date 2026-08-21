import { SubscriptionPlan } from "@/generated/prisma/client";
import { db } from "./db";

export type AdminAnalytics = {
  usersWithBookings: number;
  usersWhoPaidForBookings: number;
  totalConfirmedBookings: number;
  totalConfirmedHours: number;
  activeSubscriptions: Record<SubscriptionPlan, number>;
  totalActiveSubscribers: number;
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [confirmedBookings, subscriptionGroups] = await Promise.all([
    db.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { userId: true, hours: true, totalPriceOre: true },
    }),
    db.subscription.groupBy({
      by: ["plan"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);

  const usersWithBookings = new Set(confirmedBookings.map((b) => b.userId)).size;
  const usersWhoPaidForBookings = new Set(
    confirmedBookings.filter((b) => b.totalPriceOre > 0).map((b) => b.userId)
  ).size;

  const activeSubscriptions: Record<SubscriptionPlan, number> = {
    BASIS: 0,
    PLUS: 0,
    UNLIMITED: 0,
  };

  for (const row of subscriptionGroups) {
    activeSubscriptions[row.plan] = row._count._all;
  }

  const totalActiveSubscribers = Object.values(activeSubscriptions).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    usersWithBookings,
    usersWhoPaidForBookings,
    totalConfirmedBookings: confirmedBookings.length,
    totalConfirmedHours: confirmedBookings.reduce((sum, b) => sum + b.hours, 0),
    activeSubscriptions,
    totalActiveSubscribers,
  };
}

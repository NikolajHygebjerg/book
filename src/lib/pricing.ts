import { PRICING, SubscriptionPlanKey } from "./config";

export type BookingPriceInput = {
  hours: number;
  persons: number;
  hasPotteryWheel: boolean;
  subscriptionHoursAvailable?: number;
};

export type BookingPriceResult = {
  subscriptionHoursUsed: number;
  extraHours: number;
  basePriceOre: number;
  potteryWheelPriceOre: number;
  totalPriceOre: number;
  breakdown: string[];
};

export function calculateBookingPrice(input: BookingPriceInput): BookingPriceResult {
  const { hours, persons, hasPotteryWheel, subscriptionHoursAvailable = 0 } = input;

  const subscriptionHoursUsed = Math.min(hours, subscriptionHoursAvailable);
  const extraHours = hours - subscriptionHoursUsed;

  const extraPriceOre = extraHours * PRICING.hourlyRateOre * persons;
  const potteryWheelPriceOre = hasPotteryWheel
    ? hours * PRICING.potteryWheelPerHourOre
    : 0;

  const totalPriceOre = extraPriceOre + potteryWheelPriceOre;

  const breakdown: string[] = [];

  if (subscriptionHoursUsed > 0) {
    breakdown.push(`${subscriptionHoursUsed} timer dækket af abonnement`);
  }
  if (extraHours > 0) {
    breakdown.push(
      `${extraHours} timer × ${persons} person(er) × ${PRICING.hourlyRateOre / 100} kr = ${extraPriceOre / 100} kr`
    );
  }
  if (hasPotteryWheel) {
    breakdown.push(
      `Drejeskive: ${hours} timer × ${PRICING.potteryWheelPerHourOre / 100} kr = ${potteryWheelPriceOre / 100} kr`
    );
  }

  return {
    subscriptionHoursUsed,
    extraHours,
    basePriceOre: extraPriceOre,
    potteryWheelPriceOre,
    totalPriceOre,
    breakdown,
  };
}

export function getSubscriptionWeeklyLimit(plan: SubscriptionPlanKey): number {
  return PRICING.subscriptions[plan].hoursPerWeek;
}

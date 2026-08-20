import { formatDKK, SubscriptionPlanKey } from "./config";
import { PricingSettings } from "./pricing-settings";
import {
  PotteryWheelReservationInput,
  reservationDurationHours,
} from "./pottery-wheels";

export type BookingPriceInput = {
  hours: number;
  persons: number;
  potteryWheelReservations: PotteryWheelReservationInput[];
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

function getBundlePriceOre(hours: number, settings: PricingSettings): number {
  if (hours <= 0) return 0;

  const bundle = settings.bookingHourPrices[hours];
  if (bundle !== undefined) return bundle;

  const hourly = settings.bookingHourPrices[1] ?? 0;
  return hourly * hours;
}

function calculatePotteryWheelPriceOre(
  reservations: PotteryWheelReservationInput[],
  pricePerHourOre: number
): number {
  return reservations.reduce((sum, reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationHours = reservationDurationHours(start, end);
    return sum + durationHours * pricePerHourOre;
  }, 0);
}

export function calculateBookingPrice(
  input: BookingPriceInput,
  settings: PricingSettings
): BookingPriceResult {
  const {
    hours,
    persons,
    potteryWheelReservations,
    subscriptionHoursAvailable = 0,
  } = input;

  const subscriptionHoursUsed = Math.min(hours, subscriptionHoursAvailable);
  const extraHours = hours - subscriptionHoursUsed;

  const fullBundleOre = getBundlePriceOre(hours, settings) * persons;
  const coveredBundleOre =
    subscriptionHoursUsed > 0
      ? getBundlePriceOre(subscriptionHoursUsed, settings) * persons
      : 0;
  const extraPriceOre = fullBundleOre - coveredBundleOre;

  const potteryWheelPriceOre = calculatePotteryWheelPriceOre(
    potteryWheelReservations,
    settings.potteryWheelPerHourOre
  );

  const totalPriceOre = extraPriceOre + potteryWheelPriceOre;

  const breakdown: string[] = [];

  if (subscriptionHoursUsed > 0) {
    breakdown.push(`${subscriptionHoursUsed} timer dækket af abonnement`);
  }
  if (extraHours > 0) {
    breakdown.push(
      `${formatBookingDurationLabel(hours, subscriptionHoursUsed, persons, settings)} = ${formatDKK(extraPriceOre)}`
    );
  }
  if (potteryWheelReservations.length > 0) {
    breakdown.push(
      `Drejeskive: ${potteryWheelReservations.length} stk. reserveret = ${formatDKK(potteryWheelPriceOre)}`
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

function formatBookingDurationLabel(
  totalHours: number,
  coveredHours: number,
  persons: number,
  settings: PricingSettings
): string {
  if (coveredHours > 0) {
    return `${totalHours} timer (${coveredHours} via abonnement) × ${persons} person(er)`;
  }

  const bundle = settings.bookingHourPrices[totalHours];
  if (bundle !== undefined) {
    return `${totalHours} timer × ${persons} person(er) (${formatDKK(bundle)}/pers.)`;
  }

  return `${totalHours} timer × ${persons} person(er)`;
}

export function getSubscriptionMonthlyLimit(
  plan: SubscriptionPlanKey,
  settings: PricingSettings
): number {
  const hoursPerMonth = settings.subscriptions[plan].hoursPerMonth;
  return hoursPerMonth === "unlimited" ? Infinity : hoursPerMonth;
}

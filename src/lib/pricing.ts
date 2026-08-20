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
  const guestCount = Math.max(0, persons - 1);

  const bundlePriceOre = getBundlePriceOre(hours, settings);
  const coveredBundlePriceOre =
    subscriptionHoursUsed > 0
      ? getBundlePriceOre(subscriptionHoursUsed, settings)
      : 0;

  const bookerPriceOre = bundlePriceOre - coveredBundlePriceOre;
  const guestPriceOre = bundlePriceOre * guestCount;
  const extraPriceOre = bookerPriceOre + guestPriceOre;

  const potteryWheelPriceOre = calculatePotteryWheelPriceOre(
    potteryWheelReservations,
    settings.potteryWheelPerHourOre
  );

  const totalPriceOre = extraPriceOre + potteryWheelPriceOre;

  const breakdown: string[] = [];

  if (subscriptionHoursUsed > 0) {
    breakdown.push(`${subscriptionHoursUsed} timer dækket af abonnement (dig)`);
  }

  if (bookerPriceOre > 0) {
    if (extraHours > 0 && subscriptionHoursUsed > 0) {
      breakdown.push(
        `${extraHours} timer uden abonnement (dig) = ${formatDKK(bookerPriceOre)}`
      );
    } else {
      breakdown.push(`${hours} timer (dig) = ${formatDKK(bookerPriceOre)}`);
    }
  }

  if (guestCount > 0) {
    breakdown.push(
      `${hours} timer × ${guestCount} ekstra person(er) = ${formatDKK(guestPriceOre)}`
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

export function getSubscriptionMonthlyLimit(
  plan: SubscriptionPlanKey,
  settings: PricingSettings
): number {
  const hoursPerMonth = settings.subscriptions[plan].hoursPerMonth;
  return hoursPerMonth === "unlimited" ? Infinity : hoursPerMonth;
}

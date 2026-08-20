export const WORKSHOP_CONFIG = {
  maxCapacity: 10,
  minHours: 1,
  maxHours: 24,
  /** Tilladte bookingvarigheder i timer */
  bookingHourOptions: [1, 2, 3, 4, 5, 6, 12, 24] as const,
  minPersons: 1,
  maxPersons: 10,
  /** Faste drejeskiver i værkstedet (nr. 1–7) */
  totalPotteryWheels: 7,
  openHour: 0,
  closeHour: 24,
} as const;

export type BookingHourOption = (typeof WORKSHOP_CONFIG.bookingHourOptions)[number];

export function formatBookingHours(hours: number): string {
  if (hours === 24) return "1 døgn";
  return `${hours} timer`;
}

export function formatBookingHoursShort(hours: number): string {
  if (hours === 24) return "Døgn";
  return `${hours}t`;
}

export function isValidBookingHours(hours: number): hours is BookingHourOption {
  return (WORKSHOP_CONFIG.bookingHourOptions as readonly number[]).includes(hours);
}

/** Priser i øre (1 DKK = 100 øre) */
export const PRICING = {
  hourlyRateOre: 3000, // 30 kr/time
  potteryWheelPerHourOre: 5000, // 50 kr/time ekstra
  subscriptions: {
    BASIS: {
      name: "Basis",
      hoursPerMonth: 5,
      monthlyPriceOre: 29900, // 299 kr/måned
      description: "5 timer om måneden i værkstedet",
    },
    PLUS: {
      name: "Plus",
      hoursPerMonth: 15,
      monthlyPriceOre: 59900, // 599 kr/måned
      description: "15 timer om måneden i værkstedet",
    },
    UNLIMITED: {
      name: "Ubegrænset",
      hoursPerMonth: Infinity,
      monthlyPriceOre: 99900, // 999 kr/måned
      description: "Book så mange timer du vil",
    },
  },
} as const;

export type SubscriptionPlanKey = keyof typeof PRICING.subscriptions;

export function formatDKK(ore: number): string {
  return `${(ore / 100).toFixed(0)} kr`;
}

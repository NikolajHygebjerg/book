export const WORKSHOP_CONFIG = {
  maxCapacity: 10,
  minHours: 1,
  maxHours: 24,
  minPersons: 1,
  maxPersons: 10,
  openHour: 0,
  closeHour: 24,
} as const;

/** Priser i øre (1 DKK = 100 øre) */
export const PRICING = {
  hourlyRateOre: 3000, // 30 kr/time
  potteryWheelPerHourOre: 5000, // 50 kr/time ekstra
  subscriptions: {
    BASIS: {
      name: "Basis",
      hoursPerWeek: 5,
      monthlyPriceOre: 29900, // 299 kr/måned
      description: "5 timer om ugen i værkstedet",
    },
    PLUS: {
      name: "Plus",
      hoursPerWeek: 15,
      monthlyPriceOre: 59900, // 599 kr/måned
      description: "15 timer om ugen i værkstedet",
    },
    UNLIMITED: {
      name: "Ubegrænset",
      hoursPerWeek: Infinity,
      monthlyPriceOre: 99900, // 999 kr/måned
      description: "Book så mange timer du vil",
    },
  },
} as const;

export type SubscriptionPlanKey = keyof typeof PRICING.subscriptions;

export function formatDKK(ore: number): string {
  return `${(ore / 100).toFixed(0)} kr`;
}

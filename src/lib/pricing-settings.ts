import { unstable_noStore as noStore } from "next/cache";
import { SubscriptionPlan } from "@/generated/prisma/client";
import { db } from "./db";
import { PRICING, SubscriptionPlanKey, WORKSHOP_CONFIG } from "./config";

export type SubscriptionPlanSettings = {
  name: string;
  description: string;
  hoursPerMonth: number | "unlimited";
  monthlyPriceOre: number;
};

export type PricingSettings = {
  bookingHourPrices: Record<number, number>;
  potteryWheelPerHourOre: number;
  subscriptions: Record<SubscriptionPlanKey, SubscriptionPlanSettings>;
};

function defaultSettings(): PricingSettings {
  const bookingHourPrices: Record<number, number> = {};
  for (const hours of WORKSHOP_CONFIG.bookingHourOptions) {
    bookingHourPrices[hours] = PRICING.hourlyRateOre * hours;
  }

  return {
    bookingHourPrices,
    potteryWheelPerHourOre: PRICING.potteryWheelPerHourOre,
    subscriptions: {
      BASIS: { ...PRICING.subscriptions.BASIS, hoursPerMonth: 5 },
      PLUS: { ...PRICING.subscriptions.PLUS, hoursPerMonth: 15 },
      UNLIMITED: {
        ...PRICING.subscriptions.UNLIMITED,
        hoursPerMonth: "unlimited",
      },
    },
  };
}

export async function ensurePricingDefaults(): Promise<void> {
  await db.pricingConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      potteryWheelPerHourOre: PRICING.potteryWheelPerHourOre,
    },
    update: {},
  });

  for (const hours of WORKSHOP_CONFIG.bookingHourOptions) {
    await db.bookingHourPrice.upsert({
      where: { hours },
      create: {
        hours,
        priceOre: PRICING.hourlyRateOre * hours,
      },
      update: {},
    });
  }

  const planDefaults: Array<{
    plan: SubscriptionPlan;
    name: string;
    description: string;
    hoursPerMonth: number;
    monthlyPriceOre: number;
  }> = [
    {
      plan: "BASIS",
      name: PRICING.subscriptions.BASIS.name,
      description: PRICING.subscriptions.BASIS.description,
      hoursPerMonth: PRICING.subscriptions.BASIS.hoursPerMonth,
      monthlyPriceOre: PRICING.subscriptions.BASIS.monthlyPriceOre,
    },
    {
      plan: "PLUS",
      name: PRICING.subscriptions.PLUS.name,
      description: PRICING.subscriptions.PLUS.description,
      hoursPerMonth: PRICING.subscriptions.PLUS.hoursPerMonth,
      monthlyPriceOre: PRICING.subscriptions.PLUS.monthlyPriceOre,
    },
    {
      plan: "UNLIMITED",
      name: PRICING.subscriptions.UNLIMITED.name,
      description: PRICING.subscriptions.UNLIMITED.description,
      hoursPerMonth: 0,
      monthlyPriceOre: PRICING.subscriptions.UNLIMITED.monthlyPriceOre,
    },
  ];

  for (const plan of planDefaults) {
    await db.subscriptionPlanConfig.upsert({
      where: { plan: plan.plan },
      create: plan,
      update: {},
    });
  }
}

const PLAN_KEYS: SubscriptionPlanKey[] = ["BASIS", "PLUS", "UNLIMITED"];

export async function getPricingSettings(): Promise<PricingSettings> {
  noStore();

  try {
    const [config, hourPrices, subscriptionPlans] = await Promise.all([
      db.pricingConfig.findUnique({ where: { id: "default" } }),
      db.bookingHourPrice.findMany({ orderBy: { hours: "asc" } }),
      db.subscriptionPlanConfig.findMany(),
    ]);

    if (!config || hourPrices.length === 0 || subscriptionPlans.length === 0) {
      await ensurePricingDefaults();
      return getPricingSettings();
    }

    const bookingHourPrices: Record<number, number> = {};
    for (const row of hourPrices) {
      bookingHourPrices[row.hours] = row.priceOre;
    }

    const missingHours = WORKSHOP_CONFIG.bookingHourOptions.filter(
      (hours) => bookingHourPrices[hours] === undefined
    );
    if (missingHours.length > 0) {
      await ensurePricingDefaults();
      return getPricingSettings();
    }

    const subscriptions = {} as Record<SubscriptionPlanKey, SubscriptionPlanSettings>;
    for (const row of subscriptionPlans) {
      const key = row.plan as SubscriptionPlanKey;
      subscriptions[key] = {
        name: row.name,
        description: row.description,
        hoursPerMonth: row.hoursPerMonth === 0 ? "unlimited" : row.hoursPerMonth,
        monthlyPriceOre: row.monthlyPriceOre,
      };
    }

    const missingPlans = PLAN_KEYS.filter((key) => !subscriptions[key]);
    if (missingPlans.length > 0) {
      await ensurePricingDefaults();
      return getPricingSettings();
    }

    return {
      bookingHourPrices,
      potteryWheelPerHourOre: config.potteryWheelPerHourOre,
      subscriptions,
    };
  } catch (error) {
    console.error("getPricingSettings failed:", error);
    return defaultSettings();
  }
}

export type PricingUpdateInput = {
  bookingHourPrices: Record<number, number>;
  potteryWheelPerHourOre: number;
  subscriptions: Record<
    SubscriptionPlanKey,
    {
      name: string;
      description: string;
      hoursPerMonth: number | "unlimited";
      monthlyPriceOre: number;
    }
  >;
};

export async function updatePricingSettings(input: PricingUpdateInput): Promise<PricingSettings> {
  await db.pricingConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      potteryWheelPerHourOre: input.potteryWheelPerHourOre,
    },
    update: {
      potteryWheelPerHourOre: input.potteryWheelPerHourOre,
    },
  });

  for (const hours of WORKSHOP_CONFIG.bookingHourOptions) {
    const priceOre = input.bookingHourPrices[hours];
    if (typeof priceOre !== "number" || priceOre < 0) {
      throw new Error(`Ugyldig pris for ${hours} timer`);
    }

    await db.bookingHourPrice.upsert({
      where: { hours },
      create: { hours, priceOre },
      update: { priceOre },
    });
  }

  for (const plan of ["BASIS", "PLUS", "UNLIMITED"] as SubscriptionPlanKey[]) {
    const settings = input.subscriptions[plan];
    if (!settings) {
      throw new Error(`Mangler abonnement: ${plan}`);
    }

    await db.subscriptionPlanConfig.upsert({
      where: { plan },
      create: {
        plan,
        name: settings.name,
        description: settings.description,
        hoursPerMonth:
          settings.hoursPerMonth === "unlimited" ? 0 : settings.hoursPerMonth,
        monthlyPriceOre: settings.monthlyPriceOre,
      },
      update: {
        name: settings.name,
        description: settings.description,
        hoursPerMonth:
          settings.hoursPerMonth === "unlimited" ? 0 : settings.hoursPerMonth,
        monthlyPriceOre: settings.monthlyPriceOre,
      },
    });
  }

  return getPricingSettings();
}

export function getSubscriptionMonthlyLimitFromSettings(
  plan: SubscriptionPlanKey,
  settings: PricingSettings
): number {
  const hoursPerMonth = settings.subscriptions[plan].hoursPerMonth;
  return hoursPerMonth === "unlimited" ? Infinity : hoursPerMonth;
}

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "potteryWheelPerHourOre" INTEGER NOT NULL DEFAULT 5000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHourPrice" (
    "hours" INTEGER NOT NULL,
    "priceOre" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingHourPrice_pkey" PRIMARY KEY ("hours")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanConfig" (
    "plan" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL,
    "monthlyPriceOre" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanConfig_pkey" PRIMARY KEY ("plan")
);

-- Seed default pricing
INSERT INTO "PricingConfig" ("id", "potteryWheelPerHourOre", "updatedAt")
VALUES ('default', 5000, CURRENT_TIMESTAMP);

INSERT INTO "BookingHourPrice" ("hours", "priceOre", "updatedAt") VALUES
(1, 3000, CURRENT_TIMESTAMP),
(2, 6000, CURRENT_TIMESTAMP),
(3, 9000, CURRENT_TIMESTAMP),
(4, 12000, CURRENT_TIMESTAMP),
(5, 12000, CURRENT_TIMESTAMP),
(6, 15000, CURRENT_TIMESTAMP),
(12, 28000, CURRENT_TIMESTAMP),
(24, 50000, CURRENT_TIMESTAMP);

INSERT INTO "SubscriptionPlanConfig" ("plan", "name", "description", "hoursPerWeek", "monthlyPriceOre", "updatedAt") VALUES
('BASIS', 'Basis', '5 timer om ugen i værkstedet', 5, 29900, CURRENT_TIMESTAMP),
('PLUS', 'Plus', '15 timer om ugen i værkstedet', 15, 59900, CURRENT_TIMESTAMP),
('UNLIMITED', 'Ubegrænset', 'Book så mange timer du vil', 0, 99900, CURRENT_TIMESTAMP);

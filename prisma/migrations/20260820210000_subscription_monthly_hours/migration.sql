-- WeeklyUsage -> MonthlyUsage
ALTER TABLE "WeeklyUsage" RENAME TO "MonthlyUsage";
ALTER TABLE "MonthlyUsage" RENAME COLUMN "weekStart" TO "monthStart";

UPDATE "MonthlyUsage"
SET "monthStart" = date_trunc('month', "monthStart"::timestamp);

ALTER INDEX "WeeklyUsage_userId_weekStart_key" RENAME TO "MonthlyUsage_userId_monthStart_key";
ALTER TABLE "MonthlyUsage" RENAME CONSTRAINT "WeeklyUsage_pkey" TO "MonthlyUsage_pkey";
ALTER TABLE "MonthlyUsage" RENAME CONSTRAINT "WeeklyUsage_userId_fkey" TO "MonthlyUsage_userId_fkey";

-- Subscription plan: hours per month
ALTER TABLE "SubscriptionPlanConfig" RENAME COLUMN "hoursPerWeek" TO "hoursPerMonth";

UPDATE "SubscriptionPlanConfig"
SET "description" = REPLACE("description", 'om ugen', 'om måneden')
WHERE "description" LIKE '%om ugen%';

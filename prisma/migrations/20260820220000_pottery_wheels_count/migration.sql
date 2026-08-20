-- Replace hasPotteryWheel boolean with potteryWheels count
ALTER TABLE "Booking" ADD COLUMN "potteryWheels" INTEGER NOT NULL DEFAULT 0;

UPDATE "Booking"
SET "potteryWheels" = CASE WHEN "hasPotteryWheel" = true THEN 1 ELSE 0 END;

ALTER TABLE "Booking" DROP COLUMN "hasPotteryWheel";

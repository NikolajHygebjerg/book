-- PotteryWheelReservation table; drop legacy count column
CREATE TABLE "PotteryWheelReservation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "wheelNumber" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PotteryWheelReservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PotteryWheelReservation_bookingId_idx" ON "PotteryWheelReservation"("bookingId");
CREATE INDEX "PotteryWheelReservation_wheelNumber_startTime_endTime_idx" ON "PotteryWheelReservation"("wheelNumber", "startTime", "endTime");

ALTER TABLE "PotteryWheelReservation" ADD CONSTRAINT "PotteryWheelReservation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" DROP COLUMN IF EXISTS "potteryWheels";

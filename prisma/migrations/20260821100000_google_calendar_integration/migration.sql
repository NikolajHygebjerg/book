-- Google Calendar integration + booking sync id
ALTER TABLE "Booking" ADD COLUMN "googleEventId" TEXT;

CREATE UNIQUE INDEX "Booking_googleEventId_key" ON "Booking"("googleEventId");

CREATE TABLE "GoogleCalendarIntegration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "calendarId" TEXT NOT NULL,
    "calendarSummary" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3),
    "syncBookingsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "connectedByEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarIntegration_pkey" PRIMARY KEY ("id")
);

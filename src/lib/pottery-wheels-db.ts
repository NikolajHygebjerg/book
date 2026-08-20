import { db } from "./db";
import { PotteryWheelReservationInput } from "./pottery-wheels";

export async function findPotteryWheelConflicts(
  reservations: PotteryWheelReservationInput[],
  excludeBookingId?: string
): Promise<string | null> {
  for (const reservation of reservations) {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);

    const conflict = await db.potteryWheelReservation.findFirst({
      where: {
        wheelNumber: reservation.wheelNumber,
        startTime: { lt: end },
        endTime: { gt: start },
        booking: {
          status: { in: ["CONFIRMED", "PENDING"] },
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        },
      },
    });

    if (conflict) {
      return `Drejeskive ${reservation.wheelNumber} er allerede reserveret i det tidsrum`;
    }
  }

  return null;
}

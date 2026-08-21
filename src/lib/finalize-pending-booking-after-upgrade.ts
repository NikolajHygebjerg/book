import { db } from "./db";
import { calculateBookingPrice } from "./pricing";
import { getPricingSettings } from "./pricing-settings";
import {
  getAvailableSubscriptionHours,
  recordSubscriptionHoursUsed,
} from "./subscription";
import { syncBookingToGoogleCalendar } from "./google-calendar";
import { getStripe } from "./stripe";

export async function finalizePendingBookingAfterUpgrade(
  userId: string,
  bookingId: string
): Promise<{ confirmed: boolean; checkoutUrl?: string }> {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId, status: "PENDING" },
    include: { potteryWheelReservations: true },
  });

  if (!booking) {
    const confirmedBooking = await db.booking.findFirst({
      where: { id: bookingId, userId, status: "CONFIRMED" },
    });
    if (confirmedBooking) {
      return { confirmed: true };
    }
    throw new Error("Booking ikke fundet");
  }

  const pricingSettings = await getPricingSettings();
  const subscriptionHoursAvailable = await getAvailableSubscriptionHours(userId);
  const availableHours =
    subscriptionHoursAvailable === Infinity ? booking.hours : subscriptionHoursAvailable;

  const potteryWheelReservations = booking.potteryWheelReservations.map((reservation) => ({
    wheelNumber: reservation.wheelNumber,
    startTime: reservation.startTime.toISOString(),
    endTime: reservation.endTime.toISOString(),
  }));

  const pricing = calculateBookingPrice(
    {
      hours: booking.hours,
      persons: booking.persons,
      potteryWheelReservations,
      subscriptionHoursAvailable: availableHours,
    },
    pricingSettings
  );

  if (pricing.totalPriceOre === 0) {
    await db.booking.update({
      where: { id: bookingId },
      data: {
        subscriptionHoursUsed: pricing.subscriptionHoursUsed,
        extraHoursPaid: pricing.extraHours,
        totalPriceOre: 0,
        status: "CONFIRMED",
      },
    });

    if (pricing.subscriptionHoursUsed > 0) {
      await recordSubscriptionHoursUsed(userId, pricing.subscriptionHoursUsed);
    }

    try {
      await syncBookingToGoogleCalendar(bookingId);
    } catch {
      // Booking confirmed even if Google sync fails
    }

    return { confirmed: true };
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  const wheelDescription =
    potteryWheelReservations.length > 0
      ? ` · ${potteryWheelReservations.length} drejeskive(r) reserveret`
      : "";

  const stripeSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user?.email ?? undefined,
    invoice_creation: { enabled: true },
    line_items: [
      {
        price_data: {
          currency: "dkk",
          product_data: {
            name: `Værkstedbooking — ${booking.hours} timer`,
            description: `${booking.persons} person(er)${wheelDescription}`,
          },
          unit_amount: pricing.totalPriceOre,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId,
      userId,
      subscriptionHoursUsed: String(pricing.subscriptionHoursUsed),
    },
    success_url: `${process.env.NEXTAUTH_URL}/booking/bekraeftelse?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/book?cancelled=true`,
  });

  await db.booking.update({
    where: { id: bookingId },
    data: {
      subscriptionHoursUsed: pricing.subscriptionHoursUsed,
      extraHoursPaid: pricing.extraHours,
      totalPriceOre: pricing.totalPriceOre,
      stripeSessionId: stripeSession.id,
    },
  });

  return { confirmed: false, checkoutUrl: stripeSession.url ?? undefined };
}

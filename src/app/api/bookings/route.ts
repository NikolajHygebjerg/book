import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccommodate } from "@/lib/capacity";
import { calculateBookingPrice } from "@/lib/pricing";
import { getAvailableSubscriptionHours } from "@/lib/subscription";
import { getStripe } from "@/lib/stripe";
import { findNextAvailableSlot } from "@/lib/find-next-slot";
import { toDateInputValue, toTimeInputValue } from "@/lib/booking-slots";

const bookingSchema = z.object({
  hours: z.number().int().min(1).max(24),
  persons: z.number().int().min(1).max(10),
  startTime: z.string().datetime(),
  hasPotteryWheel: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldige data" },
        { status: 400 }
      );
    }

    const { hours, persons, startTime, hasPotteryWheel } = parsed.data;
    const start = new Date(startTime);
    const end = addHours(start, hours);

    const existingBookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: {
        startTime: true,
        endTime: true,
        persons: true,
      },
    });

    const capacityCheck = canAccommodate(start, hours, persons, existingBookings);
    if (!capacityCheck.ok) {
      return NextResponse.json({ error: capacityCheck.reason }, { status: 409 });
    }

    const subscriptionHoursAvailable = await getAvailableSubscriptionHours(session.user.id);
    const availableHours =
      subscriptionHoursAvailable === Infinity ? hours : subscriptionHoursAvailable;

    const pricing = calculateBookingPrice({
      hours,
      persons,
      hasPotteryWheel,
      subscriptionHoursAvailable: availableHours,
    });

    const booking = await db.booking.create({
      data: {
        userId: session.user.id,
        startTime: start,
        endTime: end,
        hours,
        persons,
        hasPotteryWheel,
        subscriptionHoursUsed: pricing.subscriptionHoursUsed,
        extraHoursPaid: pricing.extraHours,
        totalPriceOre: pricing.totalPriceOre,
        status: pricing.totalPriceOre === 0 ? "CONFIRMED" : "PENDING",
      },
    });

    if (pricing.totalPriceOre === 0) {
      const { recordSubscriptionHoursUsed } = await import("@/lib/subscription");
      if (pricing.subscriptionHoursUsed > 0) {
        await recordSubscriptionHoursUsed(session.user.id, pricing.subscriptionHoursUsed);
      }

      return NextResponse.json({
        bookingId: booking.id,
        requiresPayment: false,
        confirmed: true,
      });
    }

    const stripeSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `Værkstedbooking — ${hours} timer`,
              description: `${persons} person(er)${hasPotteryWheel ? " + drejeskive" : ""}`,
            },
            unit_amount: pricing.totalPriceOre,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        userId: session.user.id,
        subscriptionHoursUsed: String(pricing.subscriptionHoursUsed),
      },
      success_url: `${process.env.NEXTAUTH_URL}/booking/bekraeftelse?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/book?cancelled=true`,
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({
      bookingId: booking.id,
      requiresPayment: true,
      checkoutUrl: stripeSession.url,
    });
  } catch {
    return NextResponse.json({ error: "Kunne ikke oprette booking" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get("hours") ?? "1", 10);
  const persons = parseInt(searchParams.get("persons") ?? "1", 10);

  if (searchParams.get("nextAvailable") === "true") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
    }

    const slot = await findNextAvailableSlot(hours, persons, async (from, to) =>
      db.booking.findMany({
        where: {
          status: "CONFIRMED",
          startTime: { lt: to },
          endTime: { gt: from },
        },
        select: {
          startTime: true,
          endTime: true,
          persons: true,
        },
      })
    );

    if (!slot) {
      return NextResponse.json({ error: "Ingen ledige tider de næste 14 dage" }, { status: 404 });
    }

    return NextResponse.json({
      startTime: slot.toISOString(),
      date: toDateInputValue(slot),
      time: toTimeInputValue(slot),
    });
  }

  const startTime = searchParams.get("startTime");

  if (!startTime) {
    return NextResponse.json({ error: "startTime påkrævet" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = addHours(start, hours);

  const existingBookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: {
      startTime: true,
      endTime: true,
      persons: true,
    },
  });

  const capacityCheck = canAccommodate(start, hours, persons, existingBookings);

  return NextResponse.json({
    canBook: capacityCheck.ok,
    reason: capacityCheck.reason,
    occupancy: capacityCheck.occupancy.map((slot) => ({
      hour: slot.hour.toISOString(),
      occupied: slot.occupied,
      available: slot.available,
      isFull: slot.isFull,
    })),
  });
}

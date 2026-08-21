import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccommodate } from "@/lib/capacity";
import { getExistingCapacityBlocks } from "@/lib/capacity-blocks";
import { getPricingSettings } from "@/lib/pricing-settings";
import { getStripe } from "@/lib/stripe";
import {
  getActiveSubscription,
  getAvailableSubscriptionHours,
} from "@/lib/subscription";
import { getNextUpgradePlan } from "@/lib/config";
import { SubscriptionPlanKey, WORKSHOP_CONFIG, isValidBookingHours } from "@/lib/config";
import { findPotteryWheelConflicts } from "@/lib/pottery-wheels-db";
import { validatePotteryWheelReservations } from "@/lib/pottery-wheels";
import { isBookingStartInPast, isWholeHourDate } from "@/lib/booking-slots";
import { SubscriptionPlan } from "@/generated/prisma/client";

const potteryWheelReservationSchema = z.object({
  wheelNumber: z.number().int().min(1).max(WORKSHOP_CONFIG.totalPotteryWheels),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const upgradeBookingSchema = z.object({
  hours: z
    .number()
    .int()
    .refine(isValidBookingHours, { message: "Ugyldigt antal timer" }),
  persons: z.number().int().min(1).max(10),
  startTime: z.string().datetime(),
  potteryWheelReservations: z.array(potteryWheelReservationSchema).default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du skal være logget ind" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = upgradeBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldige data" },
        { status: 400 }
      );
    }

    const { hours, persons, startTime, potteryWheelReservations } = parsed.data;
    const start = new Date(startTime);

    const subscription = await getActiveSubscription(session.user.id);
    if (!subscription) {
      return NextResponse.json({ error: "Du har intet aktivt abonnement" }, { status: 400 });
    }

    const availableHours = await getAvailableSubscriptionHours(session.user.id);
    if (availableHours === Infinity) {
      return NextResponse.json(
        { error: "Dit abonnement har allerede ubegrænsede timer" },
        { status: 400 }
      );
    }

    if (availableHours > 0) {
      return NextResponse.json(
        { error: "Du har stadig abonnementstimer tilbage — book direkte" },
        { status: 400 }
      );
    }

    const currentPlan = subscription.plan as SubscriptionPlanKey;
    const upgradePlan = getNextUpgradePlan(currentPlan);
    if (!upgradePlan) {
      return NextResponse.json(
        { error: "Du er allerede på det højeste abonnement" },
        { status: 400 }
      );
    }

    if (isBookingStartInPast(start)) {
      return NextResponse.json(
        { error: "Starttidspunktet ligger i fortiden — vælg et senere tidspunkt" },
        { status: 400 }
      );
    }

    if (!isWholeHourDate(start)) {
      return NextResponse.json(
        { error: "Bookingen skal starte på et helt timetal (fx kl. 10:00)" },
        { status: 400 }
      );
    }

    const end = addHours(start, hours);

    const wheelValidationError = validatePotteryWheelReservations(
      potteryWheelReservations,
      start,
      end,
      persons
    );
    if (wheelValidationError) {
      return NextResponse.json({ error: wheelValidationError }, { status: 400 });
    }

    const wheelConflictError = await findPotteryWheelConflicts(potteryWheelReservations);
    if (wheelConflictError) {
      return NextResponse.json({ error: wheelConflictError }, { status: 409 });
    }

    const existingBookings = await getExistingCapacityBlocks(start, end);
    const capacityCheck = canAccommodate(start, hours, persons, existingBookings);
    if (!capacityCheck.ok) {
      return NextResponse.json({ error: capacityCheck.reason }, { status: 409 });
    }

    const pricingSettings = await getPricingSettings();
    const planPricing = pricingSettings.subscriptions[upgradePlan];

    const booking = await db.booking.create({
      data: {
        userId: session.user.id,
        startTime: start,
        endTime: end,
        hours,
        persons,
        subscriptionHoursUsed: 0,
        extraHoursPaid: 0,
        totalPriceOre: 0,
        status: "PENDING",
        potteryWheelReservations: {
          create: potteryWheelReservations.map((reservation) => ({
            wheelNumber: reservation.wheelNumber,
            startTime: new Date(reservation.startTime),
            endTime: new Date(reservation.endTime),
          })),
        },
      },
    });

    const stripeSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: subscription.stripeCustomerId ?? undefined,
      customer_email: subscription.stripeCustomerId ? undefined : (session.user.email ?? undefined),
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `Abonnement — ${planPricing.name}`,
              description: planPricing.description,
            },
            unit_amount: planPricing.monthlyPriceOre,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        plan: upgradePlan as SubscriptionPlan,
        bookingId: booking.id,
        upgradeFromBooking: "true",
        previousStripeSubscriptionId: subscription.stripeSubscriptionId ?? "",
      },
      success_url: `${process.env.NEXTAUTH_URL}/booking/bekraeftelse?booking=${booking.id}&upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/book?cancelled=true`,
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({
      checkoutUrl: stripeSession.url,
      upgradePlan,
      bookingId: booking.id,
    });
  } catch {
    return NextResponse.json({ error: "Kunne ikke starte opgradering" }, { status: 500 });
  }
}

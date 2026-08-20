import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getPricingSettings,
  updatePricingSettings,
} from "@/lib/pricing-settings";
import { WORKSHOP_CONFIG } from "@/lib/config";

const subscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  hoursPerMonth: z.union([
    z.literal("unlimited"),
    z.number().int().min(1).max(744),
  ]),
  monthlyPriceOre: z.number().int().min(0),
});

const updateSchema = z.object({
  potteryWheelPerHourOre: z.number().int().min(0),
  bookingHourPrices: z.record(z.string(), z.number().int().min(0)),
  subscriptions: z.object({
    BASIS: subscriptionSchema,
    PLUS: subscriptionSchema,
    UNLIMITED: subscriptionSchema,
  }),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldige data" },
        { status: 400 }
      );
    }

    const bookingHourPrices: Record<number, number> = {};
    for (const hours of WORKSHOP_CONFIG.bookingHourOptions) {
      const price =
        parsed.data.bookingHourPrices[String(hours)] ??
        parsed.data.bookingHourPrices[hours as unknown as string];
      if (typeof price !== "number") {
        return NextResponse.json(
          { error: `Mangler pris for ${hours} timer` },
          { status: 400 }
        );
      }
      bookingHourPrices[hours] = price;
    }

    const pricing = await updatePricingSettings({
      potteryWheelPerHourOre: parsed.data.potteryWheelPerHourOre,
      bookingHourPrices,
      subscriptions: parsed.data.subscriptions,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke gemme priser";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  const pricing = await getPricingSettings();
  return NextResponse.json(pricing);
}

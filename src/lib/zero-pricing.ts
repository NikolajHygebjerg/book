import { isAdminEmail } from "./admin";

/** Gratis bookinger/abonnementer til test (admin eller ZERO_PRICING=true). */
export function shouldUseZeroPricing(email: string | null | undefined): boolean {
  if (process.env.ZERO_PRICING === "true") return true;
  return isAdminEmail(email);
}

export function zeroPriceOre(
  priceOre: number,
  email: string | null | undefined
): number {
  return shouldUseZeroPricing(email) ? 0 : priceOre;
}

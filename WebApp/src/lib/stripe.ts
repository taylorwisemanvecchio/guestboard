import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  tv: {
    name: "Guestboard TV",
    priceId: process.env.STRIPE_PRICE_TV!,
    price: 6.99,
    deviceLimit: 4,
  },
  tv_pro: {
    name: "Guestboard TV Pro",
    priceId: process.env.STRIPE_PRICE_TV_PRO!,
    price: 10.99,
    deviceLimit: 10,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): { key: PlanKey; plan: (typeof PLANS)[PlanKey] } | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return { key: key as PlanKey, plan };
    }
  }
  return null;
}

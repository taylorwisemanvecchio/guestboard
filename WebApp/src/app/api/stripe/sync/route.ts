import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLANS, getPlanByPriceId, PlanKey } from "@/lib/stripe";

// Sync subscription from Stripe for a property (fallback if webhook is delayed)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId } = await request.json();
  if (!propertyId) {
    return Response.json({ error: "propertyId required" }, { status: 400 });
  }

  // Verify ownership
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: session.user.id },
  });
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Check if subscription already exists locally
  const existing = await prisma.subscription.findUnique({
    where: { propertyId },
  });
  if (existing && existing.status === "active") {
    return Response.json({ synced: true, subscription: existing });
  }

  // Look up user's Stripe customer
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  // List active subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 100,
  });

  // Find one with matching propertyId in metadata
  for (const sub of subscriptions.data) {
    if (sub.metadata.propertyId === propertyId) {
      const priceId = sub.items.data[0].price.id;
      const planInfo = getPlanByPriceId(priceId);
      const plan = (sub.metadata.plan || planInfo?.key || "tv") as PlanKey;

      // Extract current_period_end — Stripe may return it as a number (unix) or nested object
      const rawSub = JSON.parse(JSON.stringify(sub));
      const periodEndRaw = rawSub.current_period_end;
      const currentPeriodEnd = typeof periodEndRaw === "number"
        ? new Date(periodEndRaw * 1000)
        : new Date(periodEndRaw || Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback: 30 days from now

      const subscription = await prisma.subscription.upsert({
        where: { propertyId },
        create: {
          propertyId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          plan,
          status: sub.status,
          deviceLimit: PLANS[plan]?.deviceLimit ?? 4,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          plan,
          status: sub.status,
          deviceLimit: PLANS[plan]?.deviceLimit ?? 4,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      return Response.json({ synced: true, subscription });
    }
  }

  return Response.json({ synced: false, error: "No matching subscription found in Stripe" }, { status: 404 });
}

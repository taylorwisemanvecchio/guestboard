import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PLANS, getPlanByPriceId, PlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;

        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription;
        const propertyId = sub.metadata.propertyId;
        const plan = sub.metadata.plan as PlanKey;

        if (!propertyId || !plan || !(plan in PLANS)) {
          console.error("Invalid subscription metadata:", sub.metadata);
          break;
        }

        const priceId = sub.items.data[0].price.id;
        const rawSub = JSON.parse(JSON.stringify(sub));
        const periodEndRaw = rawSub.current_period_end;
        const currentPeriodEnd = typeof periodEndRaw === "number"
          ? new Date(periodEndRaw * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.subscription.upsert({
          where: { propertyId },
          create: {
            propertyId,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan,
            status: sub.status,
            deviceLimit: PLANS[plan].deviceLimit,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan,
            status: sub.status,
            deviceLimit: PLANS[plan].deviceLimit,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const updatedSub = event.data.object as Stripe.Subscription;
        const rawUpdated = JSON.parse(JSON.stringify(updatedSub));
        const periodEndUpdated = typeof rawUpdated.current_period_end === "number"
          ? new Date(rawUpdated.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: updatedSub.id },
        });

        if (!existing) break;

        const priceId = updatedSub.items.data[0].price.id;
        const planInfo = getPlanByPriceId(priceId);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: updatedSub.id },
          data: {
            status: updatedSub.status,
            stripePriceId: priceId,
            plan: planInfo?.key ?? existing.plan,
            deviceLimit: planInfo?.plan.deviceLimit ?? existing.deviceLimit,
            currentPeriodEnd: periodEndUpdated,
            cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;

        const existingDel = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: deletedSub.id },
        });

        if (!existingDel) break;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: deletedSub.id },
          data: { status: "canceled" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (!existing) break;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: "past_due" },
        });
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, plan } = await request.json();

    if (!propertyId || !plan) {
      return NextResponse.json(
        { error: "propertyId and plan are required" },
        { status: 400 }
      );
    }

    if (!(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planKey = plan as PlanKey;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: session.user.id },
      include: { subscription: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (
      property.subscription &&
      property.subscription.status === "active"
    ) {
      return NextResponse.json(
        { error: "Property already has an active subscription" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: PLANS[planKey].priceId, quantity: 1 }],
      subscription_data: {
        metadata: { propertyId, plan: planKey },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${propertyId}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${propertyId}/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanKey } from "@/lib/stripe";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify property ownership
  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { propertyId: id },
  });

  const activeDeviceCount = await prisma.device.count({
    where: { propertyId: id, status: "active" },
  });

  if (subscription) {
    const plan = PLANS[subscription.plan as PlanKey];

    return Response.json({
      subscription: {
        plan: subscription.plan,
        planName: plan?.name ?? subscription.plan,
        status: subscription.status,
        deviceLimit: subscription.deviceLimit,
        activeDeviceCount,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        price: plan?.price ?? 0,
      },
    });
  }

  return Response.json({
    subscription: null,
    activeDeviceCount,
  });
}

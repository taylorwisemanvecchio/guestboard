import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePairingCode } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { propertyId } = body;

  if (!propertyId) {
    return Response.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: session.user.id },
  });
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Check subscription and device limit
  const subscription = await prisma.subscription.findUnique({
    where: { propertyId },
  });

  if (!subscription || subscription.status !== "active") {
    return Response.json(
      { error: "An active subscription is required to pair devices. Visit the Billing page to subscribe." },
      { status: 403 }
    );
  }

  const activeDeviceCount = await prisma.device.count({
    where: { propertyId, status: "active" },
  });

  if (activeDeviceCount >= subscription.deviceLimit) {
    return Response.json(
      { error: `Device limit reached (${activeDeviceCount}/${subscription.deviceLimit}). Upgrade your plan for more screens.` },
      { status: 403 }
    );
  }

  // Clean up expired and used codes
  await prisma.pairingCode.deleteMany({
    where: {
      propertyId,
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
    },
  });

  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const pairingCode = await prisma.pairingCode.create({
    data: {
      propertyId,
      code,
      expiresAt,
    },
  });

  return Response.json({ code: pairingCode.code, expiresAt: pairingCode.expiresAt }, { status: 201 });
}

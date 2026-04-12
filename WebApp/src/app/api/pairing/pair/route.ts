import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { code } = body;

  if (!code) {
    return Response.json({ error: "code is required" }, { status: 400 });
  }

  const pairingCode = await prisma.pairingCode.findUnique({
    where: { code },
    include: { property: { select: { id: true, name: true } } },
  });

  if (!pairingCode) {
    return Response.json({ error: "Invalid pairing code" }, { status: 404 });
  }

  if (pairingCode.used) {
    return Response.json({ error: "Pairing code already used" }, { status: 410 });
  }

  if (pairingCode.expiresAt < new Date()) {
    return Response.json({ error: "Pairing code expired" }, { status: 410 });
  }

  // Check subscription and device limit
  const subscription = await prisma.subscription.findUnique({
    where: { propertyId: pairingCode.propertyId },
  });

  if (!subscription || subscription.status !== "active") {
    return Response.json({ error: "Subscription required" }, { status: 403 });
  }

  const activeDeviceCount = await prisma.device.count({
    where: { propertyId: pairingCode.propertyId, status: "active" },
  });

  if (activeDeviceCount >= subscription.deviceLimit) {
    return Response.json({ error: "Device limit reached" }, { status: 403 });
  }

  // Mark code as used
  await prisma.pairingCode.update({
    where: { id: pairingCode.id },
    data: { used: true },
  });

  // Create device
  const device = await prisma.device.create({
    data: {
      propertyId: pairingCode.propertyId,
      name: "TV",
    },
  });

  return Response.json({
    deviceToken: device.deviceToken,
    propertyName: pairingCode.property.name,
  }, { status: 201 });
}

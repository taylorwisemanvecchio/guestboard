import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — host triggers credential wipe on all active devices for a property
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // Set pending wipe command on all active devices for this property
  const result = await prisma.device.updateMany({
    where: {
      propertyId: id,
      status: "active",
    },
    data: {
      pendingCommand: "wipe_credentials",
      commandIssuedAt: new Date(),
    },
  });

  return Response.json({
    message: `Wipe command sent to ${result.count} device(s)`,
    devicesAffected: result.count,
  });
}

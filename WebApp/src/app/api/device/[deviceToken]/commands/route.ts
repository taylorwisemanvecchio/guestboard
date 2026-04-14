import { prisma } from "@/lib/prisma";

// GET — device polls for pending commands (unauthenticated, device token is the credential)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  const { deviceToken } = await params;

  const device = await prisma.device.findUnique({
    where: { deviceToken },
  });

  if (!device || device.status !== "active") {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  if (device.pendingCommand) {
    return Response.json({
      command: device.pendingCommand,
      timestamp: device.commandIssuedAt?.toISOString() || new Date().toISOString(),
    });
  }

  // No pending command
  return Response.json(null);
}

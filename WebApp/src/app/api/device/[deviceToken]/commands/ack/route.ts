import { prisma } from "@/lib/prisma";

// POST — device acknowledges a command was executed
export async function POST(
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

  const body = await request.json();
  const { command, status } = body;

  // Clear the pending command
  if (device.pendingCommand === command) {
    await prisma.device.update({
      where: { id: device.id },
      data: {
        pendingCommand: null,
        commandIssuedAt: null,
      },
    });
  }

  return Response.json({ received: true, command, status });
}

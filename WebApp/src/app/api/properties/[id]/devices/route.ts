import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedProperty(userId: string, propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, userId },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(session.user.id, id);
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const devices = await prisma.device.findMany({
    where: { propertyId: id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(devices);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(session.user.id, id);
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) {
    return Response.json({ error: "deviceId query param is required" }, { status: 400 });
  }

  const existing = await prisma.device.findFirst({
    where: { id: deviceId, propertyId: id },
  });
  if (!existing) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name } = body;

  const device = await prisma.device.update({
    where: { id: deviceId },
    data: { ...(name !== undefined && { name }) },
  });

  return Response.json(device);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(session.user.id, id);
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get("deviceId");
  if (!deviceId) {
    return Response.json({ error: "deviceId query param is required" }, { status: 400 });
  }

  const existing = await prisma.device.findFirst({
    where: { id: deviceId, propertyId: id },
  });
  if (!existing) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  const device = await prisma.device.update({
    where: { id: deviceId },
    data: { status: "revoked" },
  });

  return Response.json(device);
}

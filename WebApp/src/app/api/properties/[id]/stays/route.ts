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

  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: Record<string, unknown> = { propertyId: id };
  if (start || end) {
    where.checkIn = {};
    where.checkOut = {};
    if (start) {
      (where.checkOut as Record<string, unknown>).gte = new Date(start);
    }
    if (end) {
      (where.checkIn as Record<string, unknown>).lte = new Date(end);
    }
  }

  const stays = await prisma.stay.findMany({
    where,
    orderBy: { checkIn: "desc" },
  });

  return Response.json(stays);
}

export async function POST(
  request: Request,
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

  const body = await request.json();
  const { guestName, checkIn, checkOut, welcomeNote, occasion, tags, customRecommendations, status, source } = body;

  if (!guestName || !checkIn || !checkOut) {
    return Response.json({ error: "guestName, checkIn, and checkOut are required" }, { status: 400 });
  }

  const stay = await prisma.stay.create({
    data: {
      propertyId: id,
      guestName,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      welcomeNote: welcomeNote || null,
      occasion: occasion || null,
      tags: tags || undefined,
      customRecommendations: customRecommendations || undefined,
      status: status || "upcoming",
      source: source || "manual",
    },
  });

  return Response.json(stay, { status: 201 });
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
  const stayId = searchParams.get("stayId");
  if (!stayId) {
    return Response.json({ error: "stayId query param is required" }, { status: 400 });
  }

  // Verify stay belongs to this property
  const existing = await prisma.stay.findFirst({
    where: { id: stayId, propertyId: id },
  });
  if (!existing) {
    return Response.json({ error: "Stay not found" }, { status: 404 });
  }

  const body = await request.json();
  const { guestName, checkIn, checkOut, welcomeNote, occasion, tags, customRecommendations, status, source } = body;

  const stay = await prisma.stay.update({
    where: { id: stayId },
    data: {
      ...(guestName !== undefined && { guestName }),
      ...(checkIn !== undefined && { checkIn: new Date(checkIn) }),
      ...(checkOut !== undefined && { checkOut: new Date(checkOut) }),
      ...(welcomeNote !== undefined && { welcomeNote }),
      ...(occasion !== undefined && { occasion }),
      ...(tags !== undefined && { tags: tags || undefined }),
      ...(customRecommendations !== undefined && { customRecommendations: customRecommendations || undefined }),
      ...(status !== undefined && { status }),
      ...(source !== undefined && { source }),
    },
  });

  return Response.json(stay);
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
  const stayId = searchParams.get("stayId");
  if (!stayId) {
    return Response.json({ error: "stayId query param is required" }, { status: 400 });
  }

  const existing = await prisma.stay.findFirst({
    where: { id: stayId, propertyId: id },
  });
  if (!existing) {
    return Response.json({ error: "Stay not found" }, { status: 404 });
  }

  await prisma.stay.delete({ where: { id: stayId } });

  return Response.json({ success: true });
}

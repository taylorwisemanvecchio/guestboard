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
  const includeHidden = searchParams.get("includeHidden") === "true";

  const where: Record<string, unknown> = { propertyId: id };
  if (!includeHidden) {
    where.hidden = false;
  }

  const recommendations = await prisma.recommendation.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return Response.json(recommendations);
}

export async function POST(
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

  const body = await request.json();
  const {
    name,
    category,
    address,
    description,
    placeId,
    photoUrl,
    rating,
    latitude,
    longitude,
    hostNote,
    custom,
    sortOrder,
  } = body;

  if (!name || !category) {
    return Response.json(
      { error: "name and category are required" },
      { status: 400 }
    );
  }

  // Get the next sort order if not provided
  let order = sortOrder ?? 0;
  if (sortOrder === undefined) {
    const last = await prisma.recommendation.findFirst({
      where: { propertyId: id, category },
      orderBy: { sortOrder: "desc" },
    });
    order = last ? last.sortOrder + 1 : 0;
  }

  const recommendation = await prisma.recommendation.create({
    data: {
      propertyId: id,
      name,
      category,
      address: address || "",
      description: description || "",
      sortOrder: order,
      custom: custom ?? false,
      placeId: placeId || null,
      photoUrl: photoUrl || null,
      rating: rating != null ? parseFloat(String(rating)) : null,
      latitude: latitude != null ? parseFloat(String(latitude)) : null,
      longitude: longitude != null ? parseFloat(String(longitude)) : null,
      hostNote: hostNote || null,
    },
  });

  return Response.json(recommendation, { status: 201 });
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
  const recommendationId = searchParams.get("recommendationId");
  if (!recommendationId) {
    return Response.json(
      { error: "recommendationId query param is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.recommendation.findFirst({
    where: { id: recommendationId, propertyId: id },
  });
  if (!existing) {
    return Response.json(
      { error: "Recommendation not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { name, description, hidden, sortOrder, hostNote } = body;

  const recommendation = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(hidden !== undefined && { hidden }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(hostNote !== undefined && { hostNote }),
    },
  });

  return Response.json(recommendation);
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
  const recommendationId = searchParams.get("recommendationId");
  if (!recommendationId) {
    return Response.json(
      { error: "recommendationId query param is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.recommendation.findFirst({
    where: { id: recommendationId, propertyId: id },
  });
  if (!existing) {
    return Response.json(
      { error: "Recommendation not found" },
      { status: 404 }
    );
  }

  await prisma.recommendation.delete({ where: { id: recommendationId } });

  return Response.json({ success: true });
}

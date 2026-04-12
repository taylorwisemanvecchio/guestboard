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

  const settings = await prisma.propertySettings.findUnique({
    where: { propertyId: id },
  });

  if (!settings) {
    // Auto-create default settings if they don't exist
    const created = await prisma.propertySettings.create({
      data: { propertyId: id },
    });
    return Response.json(created);
  }

  return Response.json(settings);
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

  const body = await request.json();
  const { welcomeTemplate, showWeather, showRecommendations, showWifi, showCheckout, accentColor, theme, backgroundImageUrl, logoUrl } = body;

  const settings = await prisma.propertySettings.upsert({
    where: { propertyId: id },
    update: {
      ...(welcomeTemplate !== undefined && { welcomeTemplate }),
      ...(showWeather !== undefined && { showWeather }),
      ...(showRecommendations !== undefined && { showRecommendations }),
      ...(showWifi !== undefined && { showWifi }),
      ...(showCheckout !== undefined && { showCheckout }),
      ...(accentColor !== undefined && { accentColor }),
      ...(theme !== undefined && { theme }),
      ...(backgroundImageUrl !== undefined && { backgroundImageUrl }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
    create: {
      propertyId: id,
      welcomeTemplate: welcomeTemplate ?? "Welcome, {{guestName}}!",
      showWeather: showWeather ?? true,
      showRecommendations: showRecommendations ?? true,
      showWifi: showWifi ?? true,
      showCheckout: showCheckout ?? true,
      accentColor: accentColor ?? "#0096a6",
      theme: theme ?? "dark",
      backgroundImageUrl: backgroundImageUrl ?? null,
      logoUrl: logoUrl ?? null,
    },
  });

  return Response.json(settings);
}

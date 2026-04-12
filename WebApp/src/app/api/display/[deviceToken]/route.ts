import { prisma } from "@/lib/prisma";
import { getWeather } from "@/lib/services/weather";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  const { deviceToken } = await params;

  const device = await prisma.device.findUnique({
    where: { deviceToken },
    include: {
      property: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!device || device.status !== "active") {
    return Response.json({ error: "Device not found or revoked" }, { status: 404 });
  }

  // Update lastSeen
  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeen: new Date() },
  });

  const property = device.property;
  const settings = property.settings;

  // Fetch subscription status
  const subscription = await prisma.subscription.findUnique({
    where: { propertyId: property.id },
  });

  // Find active stay (checkIn <= now AND checkOut >= now)
  const now = new Date();
  const activeStay = await prisma.stay.findFirst({
    where: {
      propertyId: property.id,
      checkIn: { lte: now },
      checkOut: { gte: now },
    },
    orderBy: { checkIn: "desc" },
  });

  // Fetch weather if enabled and coordinates exist
  let weather = null;
  if (settings?.showWeather && property.latitude && property.longitude) {
    weather = await getWeather(property.latitude, property.longitude);
  }

  // Fetch recommendations if enabled
  let recommendations = null;
  if (settings?.showRecommendations) {
    recommendations = await prisma.recommendation.findMany({
      where: { propertyId: property.id, hidden: false },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        name: true,
        category: true,
        address: true,
        description: true,
        photoUrl: true,
        rating: true,
        hostNote: true,
      },
    });
  }

  // Build welcome message
  let welcomeMessage = settings?.welcomeTemplate || "Welcome!";
  if (activeStay) {
    welcomeMessage = welcomeMessage.replace(/\{\{guestName\}\}/g, activeStay.guestName);
  } else {
    welcomeMessage = welcomeMessage.replace(/\{\{guestName\}\}/g, "Guest");
  }

  return Response.json({
    property: {
      name: property.name,
      photoUrl: property.photoUrl,
      wifiName: settings?.showWifi ? property.wifiName : null,
      wifiPassword: settings?.showWifi ? property.wifiPassword : null,
      checkoutInstructions: settings?.showCheckout ? property.checkoutInstructions : null,
      houseRules: property.houseRules,
      hostName: property.hostName,
      hostPhone: property.hostPhone,
      hostEmail: property.hostEmail,
    },
    settings: settings ? {
      accentColor: settings.accentColor,
      theme: settings.theme,
      showWeather: settings.showWeather,
      showRecommendations: settings.showRecommendations,
      showWifi: settings.showWifi,
      showCheckout: settings.showCheckout,
      backgroundImageUrl: settings.backgroundImageUrl,
      logoUrl: settings.logoUrl,
    } : null,
    guest: activeStay ? {
      name: activeStay.guestName,
      welcomeMessage,
      welcomeNote: activeStay.welcomeNote,
      checkIn: activeStay.checkIn.toISOString(),
      checkOut: activeStay.checkOut.toISOString(),
      occasion: activeStay.occasion,
    } : null,
    weather,
    recommendations,
    subscriptionActive: subscription?.status === "active" || subscription?.status === "past_due",
  });
}

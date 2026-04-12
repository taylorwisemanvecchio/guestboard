import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/services/geocoding";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          stays: { where: { status: "active" } },
          devices: { where: { status: "active" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(properties);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, address, city, state, zip, country, timezone, wifiName, wifiPassword, checkoutInstructions, houseRules, hostName, hostPhone, hostEmail } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  // Auto-geocode if address parts are provided
  let latitude: number | null = null;
  let longitude: number | null = null;
  const fullAddress = [address, city, state, zip, country].filter(Boolean).join(", ");
  if (fullAddress) {
    const coords = await geocode(fullAddress);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }
  }

  const property = await prisma.property.create({
    data: {
      userId: session.user.id,
      name,
      address: address || "",
      city: city || "",
      state: state || "",
      zip: zip || "",
      country: country || "",
      timezone: timezone || "America/New_York",
      latitude,
      longitude,
      wifiName: wifiName || null,
      wifiPassword: wifiPassword || null,
      checkoutInstructions: checkoutInstructions || null,
      houseRules: houseRules || null,
      hostName: hostName || null,
      hostPhone: hostPhone || null,
      hostEmail: hostEmail || null,
      settings: {
        create: {},
      },
    },
    include: { settings: true },
  });

  return Response.json(property, { status: 201 });
}

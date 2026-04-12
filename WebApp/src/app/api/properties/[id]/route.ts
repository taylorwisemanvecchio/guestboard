import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/services/geocoding";

async function getOwnedProperty(userId: string, propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, userId },
  });
}

export async function GET(
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
    include: {
      settings: true,
      stays: {
        where: { status: "active" },
        take: 1,
      },
      _count: {
        select: {
          devices: { where: { status: "active" } },
        },
      },
    },
  });

  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  return Response.json(property);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedProperty(session.user.id, id);
  if (!existing) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, address, city, state, zip, country, timezone, wifiName, wifiPassword, checkoutInstructions, houseRules, photoUrl, settings, hostName, hostPhone, hostEmail } = body;

  // Re-geocode if address changed
  let latitude = existing.latitude;
  let longitude = existing.longitude;
  const newAddress = address ?? existing.address;
  const newCity = city ?? existing.city;
  const newState = state ?? existing.state;
  const newZip = zip ?? existing.zip;
  const newCountry = country ?? existing.country;

  const addressChanged =
    newAddress !== existing.address ||
    newCity !== existing.city ||
    newState !== existing.state ||
    newZip !== existing.zip ||
    newCountry !== existing.country;

  if (addressChanged) {
    const fullAddress = [newAddress, newCity, newState, newZip, newCountry].filter(Boolean).join(", ");
    if (fullAddress) {
      const coords = await geocode(fullAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }
  }

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zip !== undefined && { zip }),
      ...(country !== undefined && { country }),
      ...(timezone !== undefined && { timezone }),
      ...(wifiName !== undefined && { wifiName }),
      ...(wifiPassword !== undefined && { wifiPassword }),
      ...(checkoutInstructions !== undefined && { checkoutInstructions }),
      ...(houseRules !== undefined && { houseRules }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(hostName !== undefined && { hostName }),
      ...(hostPhone !== undefined && { hostPhone }),
      ...(hostEmail !== undefined && { hostEmail }),
      latitude,
      longitude,
    },
    include: { settings: true },
  });

  // Update settings if provided
  if (settings && property.settings) {
    await prisma.propertySettings.update({
      where: { id: property.settings.id },
      data: settings,
    });
  }

  const updated = await prisma.property.findUnique({
    where: { id },
    include: { settings: true },
  });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedProperty(session.user.id, id);
  if (!existing) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id } });

  return Response.json({ success: true });
}

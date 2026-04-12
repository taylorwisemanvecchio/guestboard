import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeather } from "@/lib/services/weather";

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
  });
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  if (!property.latitude || !property.longitude) {
    return Response.json({ error: "Property has no coordinates" }, { status: 400 });
  }

  const weather = await getWeather(property.latitude, property.longitude);
  if (!weather) {
    return Response.json({ error: "Unable to fetch weather" }, { status: 502 });
  }

  return Response.json(weather);
}

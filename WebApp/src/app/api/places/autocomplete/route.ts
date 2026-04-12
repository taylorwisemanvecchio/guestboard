import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { searchPlaces } from "@/lib/services/places";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const category = searchParams.get("category") || undefined;

  if (!q || !lat || !lng) {
    return Response.json(
      { error: "q, lat, and lng are required" },
      { status: 400 }
    );
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return Response.json(
      { error: "lat and lng must be valid numbers" },
      { status: 400 }
    );
  }

  const results = await searchPlaces(q, latitude, longitude, category);

  return Response.json(results);
}

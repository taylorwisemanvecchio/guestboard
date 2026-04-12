import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getPlaceDetails } from "@/lib/services/places";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return Response.json(
      { error: "placeId is required" },
      { status: 400 }
    );
  }

  try {
    const details = await getPlaceDetails(placeId);
    return Response.json(details);
  } catch (error) {
    console.error("Failed to fetch place details:", error);
    return Response.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}

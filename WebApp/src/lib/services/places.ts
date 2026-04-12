const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const BASE_URL = "https://places.googleapis.com/v1";

// Category to Google Places type mapping
const CATEGORY_TYPE_MAP: Record<string, string> = {
  restaurant: "restaurant",
  bar: "bar",
  coffee: "cafe",
  park: "park",
  things_to_do: "tourist_attraction",
  shopping: "shopping_mall",
};

export interface PlaceAutocompleteResult {
  placeId: string;
  name: string;
  address: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  description: string;
}

/**
 * Autocomplete search near a location using the New Google Places API.
 */
export async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  category?: string
): Promise<PlaceAutocompleteResult[]> {
  const body: Record<string, unknown> = {
    input: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 15000,
      },
    },
  };

  if (category && CATEGORY_TYPE_MAP[category]) {
    body.includedPrimaryTypes = [CATEGORY_TYPE_MAP[category]];
  }

  const res = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Places autocomplete error:", res.status, text);
    return [];
  }

  const data = await res.json();
  const suggestions = data.suggestions || [];

  return suggestions
    .filter((s: Record<string, unknown>) => s.placePrediction)
    .map((s: { placePrediction: {
      placeId: string;
      structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      text?: { text?: string };
    }}) => {
      const prediction = s.placePrediction;
      return {
        placeId: prediction.placeId,
        name: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
        address: prediction.structuredFormat?.secondaryText?.text || "",
      };
    });
}

/**
 * Get place details by placeId using the New Google Places API.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const res = await fetch(`${BASE_URL}/places/${placeId}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "displayName,formattedAddress,rating,location,photos,editorialSummary",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places details error: ${res.status} ${text}`);
  }

  const data = await res.json();

  let photoUrl: string | null = null;
  if (data.photos && data.photos.length > 0) {
    photoUrl = getPhotoUrl(data.photos[0].name, 400);
  }

  return {
    placeId,
    name: data.displayName?.text || "",
    address: data.formattedAddress || "",
    rating: data.rating ?? null,
    latitude: data.location?.latitude ?? 0,
    longitude: data.location?.longitude ?? 0,
    photoUrl,
    description: data.editorialSummary?.text || "",
  };
}

/**
 * Get a photo URL for a place photo reference.
 */
export function getPhotoUrl(photoName: string, maxWidth: number): string {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

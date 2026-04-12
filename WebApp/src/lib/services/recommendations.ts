import { ExternalRecommendation } from "@/types";

interface RecommendationProvider {
  getRecommendations(
    lat: number,
    lng: number,
    categories: string[]
  ): Promise<ExternalRecommendation[]>;
}

const mockData: Record<string, ExternalRecommendation[]> = {
  restaurant: [
    { name: "The Local Kitchen", category: "restaurant", address: "123 Main St", description: "Farm-to-table dining with seasonal menus" },
    { name: "Bella Italia", category: "restaurant", address: "456 Oak Ave", description: "Authentic Italian cuisine and wood-fired pizzas" },
    { name: "Sunrise Diner", category: "restaurant", address: "789 Elm Rd", description: "Classic American breakfast and brunch" },
  ],
  coffee: [
    { name: "Bean & Brew", category: "coffee", address: "101 Coffee Ln", description: "Specialty coffee and fresh pastries" },
    { name: "Morning Ritual", category: "coffee", address: "202 Cafe Blvd", description: "Artisan roasters with cozy atmosphere" },
  ],
  grocery: [
    { name: "Fresh Market", category: "grocery", address: "303 Market St", description: "Organic produce and local goods" },
    { name: "QuickStop Grocery", category: "grocery", address: "404 Shop Way", description: "Everyday essentials and snacks" },
  ],
  attraction: [
    { name: "Heritage Museum", category: "attraction", address: "505 History Dr", description: "Local history and art exhibitions" },
    { name: "Riverside Park", category: "attraction", address: "606 Park Ave", description: "Walking trails, playground, and picnic areas" },
    { name: "Downtown Gallery Walk", category: "attraction", address: "707 Art St", description: "Collection of local art galleries" },
  ],
  emergency: [
    { name: "City Urgent Care", category: "emergency", address: "808 Health Blvd", description: "Walk-in clinic, open 7am-10pm daily" },
    { name: "Community Hospital ER", category: "emergency", address: "909 Hospital Rd", description: "24/7 emergency room" },
  ],
  transportation: [
    { name: "City Cab Co.", category: "transportation", address: "Call: 555-0100", description: "Local taxi service, 24/7 availability" },
    { name: "Metro Bus Stop", category: "transportation", address: "Corner of Main & 1st", description: "Public transit, routes every 15 min" },
  ],
};

class MockRecommendationProvider implements RecommendationProvider {
  async getRecommendations(
    _lat: number,
    _lng: number,
    categories: string[]
  ): Promise<ExternalRecommendation[]> {
    const results: ExternalRecommendation[] = [];
    for (const cat of categories) {
      const items = mockData[cat] || [];
      results.push(...items);
    }
    return results;
  }
}

const ALL_CATEGORIES = [
  "restaurant",
  "coffee",
  "grocery",
  "attraction",
  "emergency",
  "transportation",
];

export function getRecommendationProvider(): RecommendationProvider {
  return new MockRecommendationProvider();
}

export { ALL_CATEGORIES };

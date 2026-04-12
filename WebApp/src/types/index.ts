export interface PropertyWithCounts {
  id: string;
  name: string;
  city: string;
  state: string;
  photoUrl: string | null;
  activeGuest: string | null;
  deviceCount: number;
  stayCount: number;
}

export interface DisplayPayload {
  property: {
    name: string;
    photoUrl: string | null;
    wifiName: string | null;
    wifiPassword: string | null;
    checkoutInstructions: string | null;
    houseRules: string | null;
  };
  guest: {
    name: string;
    welcomeMessage: string;
    checkOut: string;
    occasion: string | null;
  } | null;
  weather: {
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  } | null;
  recommendations: {
    name: string;
    category: string;
    address: string;
    description: string;
  }[];
  settings: {
    showWeather: boolean;
    showRecommendations: boolean;
    showWifi: boolean;
    showCheckout: boolean;
    accentColor: string;
    theme: string;
  };
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface ExternalRecommendation {
  name: string;
  category: string;
  address: string;
  description: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  alt?: number;
}

export interface PlacemarkGeometry {
  type: 'Point' | 'LineString' | 'Polygon';
  coordinates: Coordinates | Coordinates[] | Coordinates[][];
}

export interface Placemark {
  id: string;
  name: string;
  description?: string;
  styleUrl?: string;
  geometry: PlacemarkGeometry;
  properties?: Record<string, any>;
}

export interface KMZData {
  name: string;
  description?: string;
  placemarks: Placemark[];
  styles?: Record<string, any>;
  folders?: KMZFolder[];
}

export interface KMZFolder {
  name: string;
  description?: string;
  placemarks: Placemark[];
  folders?: KMZFolder[];
}

export interface ParsedKMZResult {
  success: boolean;
  data?: KMZData;
  error?: string;
} 
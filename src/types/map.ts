export interface GreenSpace {
  id: string;
  type: 'park' | 'forest' | 'trail' | 'garden' | 'nature_reserve';
  name: string;
  description?: string;
  area?: number;
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point';
    coordinates: number[][][] | number[][] | number[];
  };
  properties: {
    amenity?: string;
    leisure?: string;
    natural?: string;
    landuse?: string;
    highway?: string;
    name?: string;
    description?: string;
    opening_hours?: string;
    website?: string;
    phone?: string;
  };
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface MapState {
  center: [number, number];
  zoom: number;
  bounds?: MapBounds;
  showGreenSpaces: boolean;
  userLocation?: UserLocation;
  isLocating: boolean;
}

export interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: Array<{
    type: string;
    ref: number;
    role: string;
  }>;
  tags: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export interface OSMResponse {
  version: number;
  generator: string;
  elements: OSMElement[];
}
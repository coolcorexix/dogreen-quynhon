import { MapBounds, UserLocation, GreenSpace } from '../types/map';

// Default city center (Quy Nhon City)
export const DEFAULT_CENTER: [number, number] = [13.7563, 109.2297];
export const DEFAULT_ZOOM = 12;

export const DEFAULT_BOUNDS: MapBounds = {
  south: 13.6,
  west: 109.1,
  north: 13.9,
  east: 109.4
};

export const mapUtils = {
  /**
   * Calculate bounds from center point and zoom level
   */
  getBoundsFromCenter(center: [number, number], zoom: number): MapBounds {
    const [lat, lng] = center;
    const latDelta = 0.5 / Math.pow(2, zoom - 10);
    const lngDelta = 0.5 / Math.pow(2, zoom - 10);
    
    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };
  },

  /**
   * Check if a point is within bounds
   */
  isWithinBounds(point: [number, number], bounds: MapBounds): boolean {
    const [lat, lng] = point;
    return lat >= bounds.south && 
           lat <= bounds.north && 
           lng >= bounds.west && 
           lng <= bounds.east;
  },

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Format area in appropriate units
   */
  formatArea(area: number): string {
    if (area < 10000) {
      return `${area.toFixed(0)} m²`;
    } else {
      return `${(area / 10000).toFixed(1)} ha`;
    }
  },

  /**
   * Get color for green space type
   */
  getGreenSpaceColor(type: GreenSpace['type']): string {
    const colors = {
      park: '#10b981', // emerald-500
      forest: '#059669', // emerald-600
      trail: '#14b8a6', // teal-500
      garden: '#84cc16', // lime-500
      nature_reserve: '#16a34a' // green-600
    };
    return colors[type] || colors.park;
  },

  /**
   * Get display name for green space type
   */
  getGreenSpaceTypeName(type: GreenSpace['type']): string {
    const names = {
      park: 'Công viên',
      forest: 'Khu rừng',
      trail: 'Đường mòn',
      garden: 'Vườn',
      nature_reserve: 'Khu bảo tồn thiên nhiên'
    };
    return names[type] || names.park;
  },

  /**
   * Validate and sanitize coordinates
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  },

  /**
   * Get optimal zoom level for bounds
   */
  getOptimalZoom(bounds: MapBounds, mapSize: { width: number; height: number }): number {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    
    const latZoom = Math.log2(360 / latDiff);
    const lngZoom = Math.log2(360 / lngDiff);
    
    const zoom = Math.min(latZoom, lngZoom) - 1; // Add padding
    return Math.max(8, Math.min(18, Math.floor(zoom)));
  },

  /**
   * Check if location is within default city bounds
   */
  isWithinCity(location: UserLocation): boolean {
    return this.isWithinBounds([location.lat, location.lng], DEFAULT_BOUNDS);
  },

  /**
   * Generate bounds from array of coordinates
   */
  getBoundsFromCoordinates(coordinates: number[][]): MapBounds {
    if (coordinates.length === 0) {
      return DEFAULT_BOUNDS;
    }
    
    let north = coordinates[0][1];
    let south = coordinates[0][1];
    let east = coordinates[0][0];
    let west = coordinates[0][0];
    
    coordinates.forEach(([lng, lat]) => {
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    });
    
    // Add padding
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;
    
    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  }
};
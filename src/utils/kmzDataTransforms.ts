import { KMZData, Placemark, Coordinates, KMZFolder } from '../types/kmz';

export interface LocationCluster {
  id: string;
  center: Coordinates;
  placemarks: Placemark[];
  radius: number; // in kilometers
}

export interface RouteAnalysis {
  id: string;
  name: string;
  totalDistance: number; // in kilometers
  coordinates: Coordinates[];
  waypoints: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface LocationStats {
  totalPlacemarks: number;
  pointCount: number;
  lineStringCount: number;
  polygonCount: number;
  averageCoordinates: Coordinates;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  clusters: LocationCluster[];
  routes: RouteAnalysis[];
}

export class KMZDataTransformer {
  /**
   * Transform KMZ data into comprehensive location statistics
   */
  static analyzeKMZData(kmzData: KMZData): LocationStats {
    const allPlacemarks = this.getAllPlacemarks(kmzData);
    
    const stats: LocationStats = {
      totalPlacemarks: allPlacemarks.length,
      pointCount: 0,
      lineStringCount: 0,
      polygonCount: 0,
      averageCoordinates: { lat: 0, lng: 0 },
      bounds: {
        north: -90,
        south: 90,
        east: -180,
        west: 180
      },
      clusters: [],
      routes: []
    };

    if (allPlacemarks.length === 0) {
      return stats;
    }

    // Count geometry types and calculate bounds
    let totalLat = 0;
    let totalLng = 0;
    let coordinateCount = 0;

    allPlacemarks.forEach(placemark => {
      switch (placemark.geometry.type) {
        case 'Point':
          stats.pointCount++;
          const point = placemark.geometry.coordinates as Coordinates;
          totalLat += point.lat;
          totalLng += point.lng;
          coordinateCount++;
          this.updateBounds(stats.bounds, point);
          break;
        
        case 'LineString':
          stats.lineStringCount++;
          const lineCoords = placemark.geometry.coordinates as Coordinates[];
          lineCoords.forEach(coord => {
            totalLat += coord.lat;
            totalLng += coord.lng;
            coordinateCount++;
            this.updateBounds(stats.bounds, coord);
          });
          break;
        
        case 'Polygon':
          stats.polygonCount++;
          const polygonCoords = placemark.geometry.coordinates as Coordinates[][];
          polygonCoords[0].forEach(coord => {
            totalLat += coord.lat;
            totalLng += coord.lng;
            coordinateCount++;
            this.updateBounds(stats.bounds, coord);
          });
          break;
      }
    });

    // Calculate average coordinates
    if (coordinateCount > 0) {
      stats.averageCoordinates = {
        lat: totalLat / coordinateCount,
        lng: totalLng / coordinateCount
      };
    }

    // Generate clusters for point placemarks
    const pointPlacemarks = allPlacemarks.filter(p => p.geometry.type === 'Point');
    stats.clusters = this.createLocationClusters(pointPlacemarks);

    // Analyze routes (LineString placemarks)
    const routePlacemarks = allPlacemarks.filter(p => p.geometry.type === 'LineString');
    stats.routes = this.analyzeRoutes(routePlacemarks);

    return stats;
  }

  /**
   * Get all placemarks from KMZ data, including nested folders
   */
  static getAllPlacemarks(kmzData: KMZData): Placemark[] {
    const allPlacemarks: Placemark[] = [...kmzData.placemarks];
    
    const extractFromFolders = (folders: KMZFolder[]) => {
      folders.forEach(folder => {
        allPlacemarks.push(...folder.placemarks);
        if (folder.folders) {
          extractFromFolders(folder.folders);
        }
      });
    };

    if (kmzData.folders) {
      extractFromFolders(kmzData.folders);
    }

    return allPlacemarks;
  }

  /**
   * Create location clusters using simple distance-based clustering
   */
  static createLocationClusters(pointPlacemarks: Placemark[], maxDistance: number = 1): LocationCluster[] {
    const clusters: LocationCluster[] = [];
    const used = new Set<string>();

    pointPlacemarks.forEach(placemark => {
      if (used.has(placemark.id)) return;

      const point = placemark.geometry.coordinates as Coordinates;
      const cluster: LocationCluster = {
        id: `cluster_${clusters.length}`,
        center: point,
        placemarks: [placemark],
        radius: 0
      };

      used.add(placemark.id);

      // Find nearby points
      pointPlacemarks.forEach(otherPlacemark => {
        if (used.has(otherPlacemark.id)) return;

        const otherPoint = otherPlacemark.geometry.coordinates as Coordinates;
        const distance = this.calculateDistance(point, otherPoint);

        if (distance <= maxDistance) {
          cluster.placemarks.push(otherPlacemark);
          used.add(otherPlacemark.id);
        }
      });

      // Recalculate cluster center and radius
      if (cluster.placemarks.length > 1) {
        cluster.center = this.calculateCentroid(
          cluster.placemarks.map(p => p.geometry.coordinates as Coordinates)
        );
        cluster.radius = Math.max(
          ...cluster.placemarks.map(p => 
            this.calculateDistance(cluster.center, p.geometry.coordinates as Coordinates)
          )
        );
      }

      clusters.push(cluster);
    });

    return clusters.sort((a, b) => b.placemarks.length - a.placemarks.length);
  }

  /**
   * Analyze route data from LineString placemarks
   */
  static analyzeRoutes(routePlacemarks: Placemark[]): RouteAnalysis[] {
    return routePlacemarks.map((placemark, index) => {
      const coordinates = placemark.geometry.coordinates as Coordinates[];
      const totalDistance = this.calculateRouteDistance(coordinates);
      const bounds = this.calculateRouteBounds(coordinates);

      return {
        id: placemark.id || `route_${index}`,
        name: placemark.name,
        totalDistance,
        coordinates,
        waypoints: coordinates.length,
        bounds
      };
    }).sort((a, b) => b.totalDistance - a.totalDistance);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate total distance of a route
   */
  static calculateRouteDistance(coordinates: Coordinates[]): number {
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += this.calculateDistance(coordinates[i - 1], coordinates[i]);
    }
    return totalDistance;
  }

  /**
   * Calculate centroid of multiple coordinates
   */
  static calculateCentroid(coordinates: Coordinates[]): Coordinates {
    const totalLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const totalLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
    
    return {
      lat: totalLat / coordinates.length,
      lng: totalLng / coordinates.length
    };
  }

  /**
   * Calculate bounds for a route
   */
  static calculateRouteBounds(coordinates: Coordinates[]) {
    const bounds = {
      north: -90,
      south: 90,
      east: -180,
      west: 180
    };

    coordinates.forEach(coord => {
      this.updateBounds(bounds, coord);
    });

    return bounds;
  }

  /**
   * Update bounds with a new coordinate
   */
  private static updateBounds(bounds: any, coord: Coordinates) {
    bounds.north = Math.max(bounds.north, coord.lat);
    bounds.south = Math.min(bounds.south, coord.lat);
    bounds.east = Math.max(bounds.east, coord.lng);
    bounds.west = Math.min(bounds.west, coord.lng);
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Export data to various formats
   */
  static exportToGeoJSON(kmzData: KMZData): any {
    const allPlacemarks = this.getAllPlacemarks(kmzData);
    
    return {
      type: 'FeatureCollection',
      features: allPlacemarks.map(placemark => ({
        type: 'Feature',
        id: placemark.id,
        properties: {
          name: placemark.name,
          description: placemark.description,
          styleUrl: placemark.styleUrl,
          ...placemark.properties
        },
        geometry: {
          type: placemark.geometry.type,
          coordinates: this.convertCoordinatesForGeoJSON(placemark.geometry)
        }
      }))
    };
  }

  /**
   * Convert coordinates to GeoJSON format (lng, lat order)
   */
  private static convertCoordinatesForGeoJSON(geometry: any): any {
    switch (geometry.type) {
      case 'Point':
        const point = geometry.coordinates as Coordinates;
        return [point.lng, point.lat];
      
      case 'LineString':
        const line = geometry.coordinates as Coordinates[];
        return line.map(coord => [coord.lng, coord.lat]);
      
      case 'Polygon':
        const polygon = geometry.coordinates as Coordinates[][];
        return polygon.map(ring => ring.map(coord => [coord.lng, coord.lat]));
      
      default:
        return geometry.coordinates;
    }
  }
} 
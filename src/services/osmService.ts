import { GreenSpace, MapBounds, OSMElement, OSMResponse } from '../types/map';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Default bounding box for Quy Nhon City
const DEFAULT_BOUNDS: MapBounds = {
  south: 13.6,
  west: 109.1,
  north: 13.9,
  east: 109.4
};

// Local landmarks and green spaces in Quy Nhon
const QUY_NHON_GREEN_SPACES: GreenSpace[] = [
  {
    id: 'vung-chua-mountain',
    type: 'nature_reserve',
    name: 'Núi Vũng Chua',
    description: 'Khu vực núi Vũng Chua với cảnh quan thiên nhiên tuyệt đẹp, nơi có thể ngắm nhìn toàn cảnh thành phố Quy Nhôn',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109.2180, 13.7850],
        [109.2220, 13.7850],
        [109.2250, 13.7800],
        [109.2280, 13.7750],
        [109.2250, 13.7700],
        [109.2200, 13.7720],
        [109.2150, 13.7780],
        [109.2180, 13.7850]
      ]]
    },
    properties: {
      natural: 'peak',
      name: 'Núi Vũng Chua',
      description: 'Điểm ngắm cảnh nổi tiếng của Quy Nhôn',
      opening_hours: '24/7'
    }
  },
  {
    id: 'xuan-van-mountain',
    type: 'nature_reserve',
    name: 'Núi Xuân Vân',
    description: 'Núi Xuân Vân - địa điểm du lịch sinh thái với không khí trong lành và cảnh quan núi rừng hùng vĩ',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109.1950, 13.8100],
        [109.2000, 13.8120],
        [109.2050, 13.8080],
        [109.2080, 13.8030],
        [109.2050, 13.7980],
        [109.2000, 13.7960],
        [109.1950, 13.8000],
        [109.1920, 13.8050],
        [109.1950, 13.8100]
      ]]
    },
    properties: {
      natural: 'peak',
      name: 'Núi Xuân Vân',
      description: 'Khu du lịch sinh thái núi rừng',
      opening_hours: '06:00-18:00'
    }
  },
  {
    id: 'quy-nhon-beach-park',
    type: 'park',
    name: 'Công viên Bãi biển Quy Nhôn',
    description: 'Khu vực công viên ven biển với cây xanh và không gian thư giãn',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109.2280, 13.7650],
        [109.2350, 13.7650],
        [109.2380, 13.7600],
        [109.2350, 13.7550],
        [109.2280, 13.7550],
        [109.2250, 13.7600],
        [109.2280, 13.7650]
      ]]
    },
    properties: {
      leisure: 'park',
      name: 'Công viên Bãi biển',
      amenity: 'park',
      opening_hours: '24/7'
    }
  },
  {
    id: 'ghenh-rang-forest',
    type: 'forest',
    name: 'Rừng Ghềnh Ráng',
    description: 'Khu rừng ven biển Ghềnh Ráng với hệ sinh thái đa dạng',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109.2450, 13.7400],
        [109.2520, 13.7420],
        [109.2550, 13.7380],
        [109.2580, 13.7330],
        [109.2550, 13.7280],
        [109.2480, 13.7300],
        [109.2420, 13.7350],
        [109.2450, 13.7400]
      ]]
    },
    properties: {
      natural: 'wood',
      landuse: 'forest',
      name: 'Rừng Ghềnh Ráng',
      description: 'Khu rừng ven biển'
    }
  },
  {
    id: 'thi-nai-lagoon',
    type: 'nature_reserve',
    name: 'Đầm Thị Nai',
    description: 'Đầm Thị Nai - hệ sinh thái đầm phá quan trọng với đa dạng sinh học phong phú',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [109.2600, 13.8200],
        [109.2800, 13.8250],
        [109.2900, 13.8200],
        [109.2950, 13.8100],
        [109.2900, 13.8000],
        [109.2750, 13.7950],
        [109.2600, 13.8000],
        [109.2550, 13.8100],
        [109.2600, 13.8200]
      ]]
    },
    properties: {
      natural: 'wetland',
      name: 'Đầm Thị Nai',
      description: 'Hệ sinh thái đầm phá',
      opening_hours: '24/7'
    }
  },
  {
    id: 'hoang-hau-beach-trail',
    type: 'trail',
    name: 'Đường mòn Bãi Hoàng Hậu',
    description: 'Đường mòn dọc bãi biển Hoàng Hậu với cảnh quan biển đẹp',
    geometry: {
      type: 'LineString',
      coordinates: [
        [109.2100, 13.7300],
        [109.2150, 13.7280],
        [109.2200, 13.7250],
        [109.2250, 13.7220],
        [109.2300, 13.7200],
        [109.2350, 13.7180]
      ]
    },
    properties: {
      highway: 'path',
      name: 'Đường mòn Bãi Hoàng Hậu',
      surface: 'sand',
      description: 'Đường mòn ven biển'
    }
  }
];

export class OSMService {
  private static instance: OSMService;
  private cache: Map<string, GreenSpace[]> = new Map();
  private requestQueue: Map<string, Promise<GreenSpace[]>> = new Map();

  static getInstance(): OSMService {
    if (!OSMService.instance) {
      OSMService.instance = new OSMService();
    }
    return OSMService.instance;
  }

  async fetchGreenSpaces(bounds: MapBounds = DEFAULT_BOUNDS): Promise<GreenSpace[]> {
    const cacheKey = this.getBoundsKey(bounds);
    
    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Return existing request if in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create new request
    const request = this.performFetch(bounds);
    this.requestQueue.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async performFetch(bounds: MapBounds): Promise<GreenSpace[]> {
    try {
      // First, get local Quy Nhon landmarks
      const localSpaces = this.getLocalGreenSpaces(bounds);
      
      // Then try to fetch from OSM
      const osmSpaces = await this.fetchFromOSM(bounds);
      
      // Combine and deduplicate
      const allSpaces = [...localSpaces, ...osmSpaces];
      const uniqueSpaces = this.deduplicateSpaces(allSpaces);
      
      console.log(`Loaded ${uniqueSpaces.length} green spaces for Quy Nhon:`, {
        local: localSpaces.length,
        osm: osmSpaces.length,
        total: uniqueSpaces.length
      });
      
      return uniqueSpaces;
    } catch (error) {
      console.error('Error fetching green spaces:', error);
      // Fallback to local spaces only
      return this.getLocalGreenSpaces(bounds);
    }
  }

  private getLocalGreenSpaces(bounds: MapBounds): GreenSpace[] {
    return QUY_NHON_GREEN_SPACES.filter(space => {
      if (space.geometry.type === 'Point') {
        const [lng, lat] = space.geometry.coordinates as number[];
        return lat >= bounds.south && lat <= bounds.north && 
               lng >= bounds.west && lng <= bounds.east;
      } else if (space.geometry.type === 'Polygon') {
        const coordinates = space.geometry.coordinates[0] as number[][];
        return coordinates.some(([lng, lat]) => 
          lat >= bounds.south && lat <= bounds.north && 
          lng >= bounds.west && lng <= bounds.east
        );
      } else if (space.geometry.type === 'LineString') {
        const coordinates = space.geometry.coordinates as number[][];
        return coordinates.some(([lng, lat]) => 
          lat >= bounds.south && lat <= bounds.north && 
          lng >= bounds.west && lng <= bounds.east
        );
      }
      return false;
    });
  }

  private async fetchFromOSM(bounds: MapBounds): Promise<GreenSpace[]> {
    const query = this.buildOverpassQuery(bounds);
    
    try {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OSMResponse = await response.json();
      return this.processOSMData(data);
    } catch (error) {
      console.warn('OSM fetch failed, using local data only:', error);
      return [];
    }
  }

  private buildOverpassQuery(bounds: MapBounds): string {
    const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
    
    return `
      [out:json][timeout:25];
      (
        way["leisure"~"^(park|garden|playground|nature_reserve|dog_park|pitch)$"](${bbox});
        way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"](${bbox});
        way["natural"~"^(wood|scrub|heath|grassland|wetland|beach)$"](${bbox});
        way["highway"~"^(path|footway|cycleway|track)$"]["surface"!="paved"](${bbox});
        relation["leisure"~"^(park|garden|nature_reserve)$"](${bbox});
        relation["landuse"~"^(forest|recreation_ground)$"](${bbox});
        relation["natural"~"^(wood|wetland)$"](${bbox});
      );
      out geom;
    `;
  }

  private processOSMData(data: OSMResponse): GreenSpace[] {
    const greenSpaces: GreenSpace[] = [];

    data.elements.forEach((element: OSMElement) => {
      try {
        const greenSpace = this.elementToGreenSpace(element);
        if (greenSpace) {
          greenSpaces.push(greenSpace);
        }
      } catch (error) {
        console.warn('Error processing OSM element:', element.id, error);
      }
    });

    return greenSpaces;
  }

  private elementToGreenSpace(element: OSMElement): GreenSpace | null {
    const { tags } = element;
    
    if (!tags || (!element.geometry && !element.nodes)) {
      return null;
    }

    const type = this.determineGreenSpaceType(tags);
    const name = tags.name || this.generateName(type, tags);
    
    let geometry;
    
    if (element.geometry) {
      // For ways and relations with geometry
      const coordinates = element.geometry.map(point => [point.lon, point.lat]);
      
      if (element.type === 'way' && coordinates.length > 2 && 
          coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
          coordinates[0][1] === coordinates[coordinates.length - 1][1]) {
        // Closed way - polygon
        geometry = {
          type: 'Polygon' as const,
          coordinates: [coordinates]
        };
      } else {
        // Open way - linestring
        geometry = {
          type: 'LineString' as const,
          coordinates
        };
      }
    } else if (element.lat && element.lon) {
      // For nodes
      geometry = {
        type: 'Point' as const,
        coordinates: [element.lon, element.lat]
      };
    } else {
      return null;
    }

    return {
      id: `osm-${element.type}-${element.id}`,
      type,
      name,
      description: tags.description,
      geometry,
      properties: tags
    };
  }

  private determineGreenSpaceType(tags: Record<string, string>): GreenSpace['type'] {
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground') {
      return 'park';
    }
    if (tags.landuse === 'forest' || tags.natural === 'wood') {
      return 'forest';
    }
    if (tags.highway && ['path', 'footway', 'cycleway', 'track'].includes(tags.highway)) {
      return 'trail';
    }
    if (tags.leisure === 'nature_reserve' || tags.natural === 'wetland') {
      return 'nature_reserve';
    }
    if (tags.leisure === 'garden') {
      return 'garden';
    }
    return 'park'; // default
  }

  private generateName(type: GreenSpace['type'], tags: Record<string, string>): string {
    const typeNames = {
      park: 'Công viên',
      forest: 'Khu rừng',
      trail: 'Đường mòn',
      garden: 'Vườn',
      nature_reserve: 'Khu bảo tồn'
    };
    
    const baseName = typeNames[type];
    if (tags.ref) {
      return `${baseName} ${tags.ref}`;
    }
    
    return `${baseName} không tên`;
  }

  private deduplicateSpaces(spaces: GreenSpace[]): GreenSpace[] {
    const seen = new Set<string>();
    return spaces.filter(space => {
      const key = `${space.name}-${space.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getBoundsKey(bounds: MapBounds): string {
    return `${bounds.south.toFixed(3)},${bounds.west.toFixed(3)},${bounds.north.toFixed(3)},${bounds.east.toFixed(3)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const osmService = OSMService.getInstance();
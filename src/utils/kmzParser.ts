import JSZip from 'jszip';
import { KMZData, Placemark, PlacemarkGeometry, Coordinates, ParsedKMZResult, KMZFolder } from '../types/kmz';

export class KMZParser {
  static async parseKMZFile(file: File): Promise<ParsedKMZResult> {
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Find the main KML file (usually doc.kml or the first .kml file)
      const kmlFiles = Object.keys(zipContents.files).filter(name => name.endsWith('.kml'));
      
      if (kmlFiles.length === 0) {
        return { success: false, error: 'No KML file found in KMZ archive' };
      }
      
      const mainKmlFile = kmlFiles.find(name => name === 'doc.kml') || kmlFiles[0];
      const kmlContent = await zipContents.files[mainKmlFile].async('string');
      
      const parsedData = this.parseKMLContent(kmlContent);
      
      return { success: true, data: parsedData };
    } catch (error) {
      return { success: false, error: `Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private static parseKMLContent(kmlContent: string): KMZData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML content in KML file');
    }

    const kml = xmlDoc.documentElement;
    const document = kml.querySelector('Document') || kml.querySelector('Folder') || kml;
    
    const kmzData: KMZData = {
      name: this.getTextContent(document.querySelector('name')) || 'Untitled',
      description: this.getTextContent(document.querySelector('description')) || undefined,
      placemarks: [],
      folders: []
    };

    // Parse placemarks directly in document
    const placemarks = document.querySelectorAll(':scope > Placemark');
    kmzData.placemarks = Array.from(placemarks)
      .map(placemark => this.parsePlacemark(placemark))
      .filter(Boolean) as Placemark[];

    // Parse folders
    const folders = document.querySelectorAll(':scope > Folder');
    kmzData.folders = Array.from(folders)
      .map(folder => this.parseFolder(folder))
      .filter(Boolean) as KMZFolder[];

    return kmzData;
  }

  private static parseFolder(folderElement: Element): KMZFolder {
    const folderData: KMZFolder = {
      name: this.getTextContent(folderElement.querySelector('name')) || 'Untitled Folder',
      description: this.getTextContent(folderElement.querySelector('description')) || undefined,
      placemarks: [],
      folders: []
    };

    // Parse placemarks in folder
    const placemarks = folderElement.querySelectorAll(':scope > Placemark');
    folderData.placemarks = Array.from(placemarks)
      .map(placemark => this.parsePlacemark(placemark))
      .filter(Boolean) as Placemark[];

    // Parse nested folders
    const subFolders = folderElement.querySelectorAll(':scope > Folder');
    folderData.folders = Array.from(subFolders)
      .map(folder => this.parseFolder(folder))
      .filter(Boolean) as KMZFolder[];

    return folderData;
  }

  private static parsePlacemark(placemarkElement: Element): Placemark | null {
    try {
      const name = this.getTextContent(placemarkElement.querySelector('name')) || 'Untitled Placemark';
      const description = this.getTextContent(placemarkElement.querySelector('description')) || undefined;
      const styleUrl = this.getTextContent(placemarkElement.querySelector('styleUrl')) || undefined;
      
      let geometry: PlacemarkGeometry | null = null;

      // Parse Point
      const pointElement = placemarkElement.querySelector('Point');
      if (pointElement) {
        const coordinates = this.parseCoordinates(pointElement.querySelector('coordinates'));
        if (coordinates.length > 0) {
          geometry = {
            type: 'Point',
            coordinates: coordinates[0]
          };
        }
      }
      
      // Parse LineString
      const lineStringElement = placemarkElement.querySelector('LineString');
      if (lineStringElement && !geometry) {
        const coordinates = this.parseCoordinates(lineStringElement.querySelector('coordinates'));
        if (coordinates.length > 0) {
          geometry = {
            type: 'LineString',
            coordinates: coordinates
          };
        }
      }
      
      // Parse Polygon
      const polygonElement = placemarkElement.querySelector('Polygon');
      if (polygonElement && !geometry) {
        const outerBoundary = polygonElement.querySelector('outerBoundaryIs LinearRing coordinates');
        if (outerBoundary) {
          const coordinates = this.parseCoordinates(outerBoundary);
          if (coordinates.length > 0) {
            geometry = {
              type: 'Polygon',
              coordinates: [coordinates]
            };
          }
        }
      }

      if (!geometry) {
        console.warn('No valid geometry found for placemark:', name);
        return null;
      }

      return {
        id: placemarkElement.getAttribute('id') || `placemark_${Date.now()}_${Math.random()}`,
        name,
        description,
        styleUrl,
        geometry,
        properties: {
          originalElement: placemarkElement.outerHTML
        }
      };
    } catch (error) {
      console.error('Error parsing placemark:', error);
      return null;
    }
  }

  private static parseCoordinates(coordinatesElement: Element | null): Coordinates[] {
    if (!coordinatesElement) return [];
    
    try {
      const coordStr = coordinatesElement.textContent?.trim();
      if (!coordStr) return [];

      return coordStr.split(/\s+/).map(coord => {
        const parts = coord.split(',');
        if (parts.length >= 2) {
          return {
            lng: parseFloat(parts[0]),
            lat: parseFloat(parts[1]),
            alt: parts[2] ? parseFloat(parts[2]) : undefined
          };
        }
        return null;
      }).filter(Boolean) as Coordinates[];
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return [];
    }
  }

  private static getTextContent(element: Element | null): string | null {
    if (!element) return null;
    const content = element.textContent?.trim();
    return content && content.length > 0 ? content : null;
  }
} 
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, LayersControl } from 'react-leaflet';
import { LatLngBounds, LatLng } from 'leaflet';
import { Placemark, Coordinates } from '../../types/kmz';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';

// Custom SVG icons for different marker types
const createCustomIcon = (svgContent: string, size: [number, number] = [32, 32]) => {
  return L.divIcon({
    html: svgContent,
    className: 'custom-marker-icon',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};

// Start point icon (Green flag)
const startIcon = createCustomIcon(`
  <div style="position: relative;">
    <svg width="32" height="32" viewBox="0 0 32 32" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">
      <circle cx="16" cy="26" r="3" fill="#10B981" stroke="white" stroke-width="2"/>
      <line x1="16" y1="23" x2="16" y2="8" stroke="#10B981" stroke-width="3"/>
      <path d="M16 8 L26 12 L16 16 Z" fill="#10B981" stroke="white" stroke-width="1"/>
      <text x="20" y="13" fill="white" font-size="8" font-weight="bold">S</text>
    </svg>
  </div>
`);

// End point icon (Red flag)
const endIcon = createCustomIcon(`
  <div style="position: relative;">
    <svg width="32" height="32" viewBox="0 0 32 32" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">
      <circle cx="16" cy="26" r="3" fill="#EF4444" stroke="white" stroke-width="2"/>
      <line x1="16" y1="23" x2="16" y2="8" stroke="#EF4444" stroke-width="3"/>
      <path d="M16 8 L26 12 L16 16 Z" fill="#EF4444" stroke="white" stroke-width="1"/>
      <text x="20" y="13" fill="white" font-size="8" font-weight="bold">E</text>
    </svg>
  </div>
`);

// Waypoint icon (Blue circle with dot)
const waypointIcon = createCustomIcon(`
  <div style="position: relative;">
    <svg width="24" height="24" viewBox="0 0 24 24" style="filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.3));">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  </div>
`, [24, 24]);

// Regular point icon (Purple pin)
const pointIcon = createCustomIcon(`
  <div style="position: relative;">
    <svg width="28" height="28" viewBox="0 0 28 28" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));">
      <path d="M14 2 C9 2 5 6 5 11 C5 16 14 26 14 26 S23 16 23 11 C23 6 19 2 14 2 Z" fill="#8B5CF6" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="11" r="4" fill="white"/>
      <circle cx="14" cy="11" r="2" fill="#8B5CF6"/>
    </svg>
  </div>
`);

// Landmark icon (Orange star)
const landmarkIcon = createCustomIcon(`
  <div style="position: relative;">
    <svg width="26" height="26" viewBox="0 0 26 26" style="filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.3));">
      <path d="M13 2 L15.5 9.5 L23 9.5 L17.25 14 L19.75 21.5 L13 17 L6.25 21.5 L8.75 14 L3 9.5 L10.5 9.5 Z" fill="#F59E0B" stroke="white" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="3" fill="white"/>
      <text x="13" y="15" text-anchor="middle" fill="#F59E0B" font-size="8" font-weight="bold">★</text>
    </svg>
  </div>
`);

// Add custom CSS for markers
const markerStyles = `
  .custom-marker-icon {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = markerStyles;
  document.head.appendChild(styleSheet);
}

interface KMZMapViewProps {
  placemarks: Placemark[];
  title: string;
  onClose: () => void;
}

// Tile layer configurations
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  osmWithLabels: {
    name: 'OSM with More Labels',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of OpenStreetMap France'
  },
  satellite: {
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  hybrid: {
    name: 'Hybrid with Labels (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
  },
  googleRoadmap: {
    name: 'Google Roadmap ⚠️',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google (Unofficial - Use at own risk)'
  },
  googleSatellite: {
    name: 'Google Satellite ⚠️',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google (Unofficial - Use at own risk)'
  },
  googleHybrid: {
    name: 'Google Hybrid ⚠️',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google (Unofficial - Use at own risk)'
  },
  googleTerrain: {
    name: 'Google Terrain ⚠️',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google (Unofficial - Use at own risk)'
  },
  esriTopo: {
    name: 'Esri World Topo (Free)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
  },
  esriStreet: {
    name: 'Esri World Street (Free)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  },
  esriGray: {
    name: 'Esri Light Gray (Free)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
  },
  terrain: {
    name: 'Terrain (Stamen)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartodb: {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartodbWithLabels: {
    name: 'CartoDB with POI Labels',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

export const KMZMapView: React.FC<KMZMapViewProps> = ({ placemarks, title, onClose }) => {
  const mapRef = useRef<any>(null);
  const [selectedTileLayer, setSelectedTileLayer] = useState<keyof typeof TILE_LAYERS>('googleRoadmap');
  const [coordinateOffset, setCoordinateOffset] = useState({ lat: 0, lng: 0 });
  const [showControls, setShowControls] = useState(false);

  // Apply coordinate offset to fix alignment issues
  const applyOffset = (coord: Coordinates): Coordinates => ({
    lat: coord.lat + coordinateOffset.lat,
    lng: coord.lng + coordinateOffset.lng
  });

  // Open Google Maps directions to the starting point of a route
  const openGoogleMapsDirections = (startPoint: Coordinates) => {
    const adjustedStart = applyOffset(startPoint);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${adjustedStart.lat},${adjustedStart.lng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  // Calculate bounds for all placemarks
  const getBounds = () => {
    if (placemarks.length === 0) return null;

    const bounds = new LatLngBounds([]);
    
    placemarks.forEach(placemark => {
      switch (placemark.geometry.type) {
        case 'Point':
          const point = applyOffset(placemark.geometry.coordinates as Coordinates);
          bounds.extend([point.lat, point.lng]);
          break;
        
        case 'LineString':
          const lineCoords = placemark.geometry.coordinates as Coordinates[];
          lineCoords.forEach(coord => {
            const adjustedCoord = applyOffset(coord);
            bounds.extend([adjustedCoord.lat, adjustedCoord.lng]);
          });
          break;
        
        case 'Polygon':
          const polygonCoords = placemark.geometry.coordinates as Coordinates[][];
          polygonCoords[0].forEach(coord => {
            const adjustedCoord = applyOffset(coord);
            bounds.extend([adjustedCoord.lat, adjustedCoord.lng]);
          });
          break;
      }
    });

    return bounds;
  };

  // Fit map to bounds when placemarks change
  useEffect(() => {
    if (mapRef.current && placemarks.length > 0) {
      const bounds = getBounds();
      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [placemarks, coordinateOffset]);

  const bounds = getBounds();
  const center: [number, number] = bounds && bounds.isValid() 
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [0, 0];

  const renderPlacemark = (placemark: Placemark) => {
    switch (placemark.geometry.type) {
      case 'Point':
        const point = applyOffset(placemark.geometry.coordinates as Coordinates);
        return (
          <Marker 
            key={placemark.id} 
            position={[point.lat, point.lng]}
            icon={pointIcon}
          >
            <Popup>
              <div className="max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📍</span>
                  <h3 className="font-semibold text-gray-900">{placemark.name}</h3>
                </div>
                {placemark.description && (
                  <p className="text-sm text-gray-600 mt-1">{placemark.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Original: {(placemark.geometry.coordinates as Coordinates).lat.toFixed(6)}, {(placemark.geometry.coordinates as Coordinates).lng.toFixed(6)}
                  {(coordinateOffset.lat !== 0 || coordinateOffset.lng !== 0) && (
                    <div>Adjusted: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      
      case 'LineString':
        const lineCoords = placemark.geometry.coordinates as Coordinates[];
        const lineLatLngs: [number, number][] = lineCoords.map(coord => {
          const adjusted = applyOffset(coord);
          return [adjusted.lat, adjusted.lng];
        });
        const startPoint = lineCoords[0]; // First point of the route
        const endPoint = lineCoords[lineCoords.length - 1]; // Last point of the route
        


        return (
          <React.Fragment key={placemark.id}>
            {/* Route line */}
            <Polyline
              positions={lineLatLngs}
              color="#3B82F6"
              weight={3}
              opacity={0.8}
            >
              <Popup>
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🛣️</span>
                    <h3 className="font-semibold text-gray-900">{placemark.name}</h3>
                  </div>
                  {placemark.description && (
                    <p className="text-sm text-gray-600 mt-1">{placemark.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2 mb-3">
                    Route with {lineCoords.length} points
                  </div>
                  
                  {/* Directions Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMapsDirections(startPoint);
                      }}
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-sm">🚩</span>
                      Get Directions to Start
                    </button>
                    
                    {lineCoords.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMapsDirections(endPoint);
                        }}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-sm">🏁</span>
                        Get Directions to End
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                    Start: {startPoint.lat.toFixed(4)}, {startPoint.lng.toFixed(4)}
                    {lineCoords.length > 1 && (
                      <div>End: {endPoint.lat.toFixed(4)}, {endPoint.lng.toFixed(4)}</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Start marker */}
            <Marker
              position={[applyOffset(startPoint).lat, applyOffset(startPoint).lng]}
              icon={startIcon}
            >
              <Popup>
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚩</span>
                    <h3 className="font-semibold text-green-700">Start Point</h3>
                  </div>
                  <p className="text-sm text-gray-600">Route: {placemark.name}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {applyOffset(startPoint).lat.toFixed(6)}, {applyOffset(startPoint).lng.toFixed(6)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openGoogleMapsDirections(startPoint);
                    }}
                    className="w-full mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Get Directions Here
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* End marker (only if different from start) */}
            {lineCoords.length > 1 && (
              <Marker
                position={[applyOffset(endPoint).lat, applyOffset(endPoint).lng]}
                icon={endIcon}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏁</span>
                      <h3 className="font-semibold text-red-700">End Point</h3>
                    </div>
                    <p className="text-sm text-gray-600">Route: {placemark.name}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {applyOffset(endPoint).lat.toFixed(6)}, {applyOffset(endPoint).lng.toFixed(6)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMapsDirections(endPoint);
                      }}
                      className="w-full mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Get Directions Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}


          </React.Fragment>
        );
      
      case 'Polygon':
        const polygonCoords = placemark.geometry.coordinates as Coordinates[][];
        const polygonLatLngs: [number, number][] = polygonCoords[0].map(coord => {
          const adjusted = applyOffset(coord);
          return [adjusted.lat, adjusted.lng];
        });
        
        // Calculate center point for landmark marker
        const centerLat = polygonLatLngs.reduce((sum, coord) => sum + coord[0], 0) / polygonLatLngs.length;
        const centerLng = polygonLatLngs.reduce((sum, coord) => sum + coord[1], 0) / polygonLatLngs.length;
        
        return (
          <React.Fragment key={placemark.id}>
            {/* Polygon area */}
            <Polygon
              positions={polygonLatLngs}
              color="#10B981"
              fillColor="#10B981"
              fillOpacity={0.3}
              weight={2}
            >
              <Popup>
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏞️</span>
                    <h3 className="font-semibold text-gray-900">{placemark.name}</h3>
                  </div>
                  {placemark.description && (
                    <p className="text-sm text-gray-600 mt-1">{placemark.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Area with {polygonCoords[0].length} vertices
                  </div>
                </div>
              </Popup>
            </Polygon>

            {/* Center landmark marker */}
            <Marker
              position={[centerLat, centerLng]}
              icon={landmarkIcon}
            >
              <Popup>
                <div className="max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⭐</span>
                    <h3 className="font-semibold text-orange-700">Area Landmark</h3>
                  </div>
                  <p className="text-sm text-gray-600">{placemark.name}</p>
                  {placemark.description && (
                    <p className="text-sm text-gray-600 mt-1">{placemark.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Center: {centerLat.toFixed(6)}, {centerLng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{placemarks.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            {showControls ? 'Hide' : 'Show'} Controls
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
          {/* Tile Layer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Map Style (Google maps show more landmarks & POIs)
            </label>
            <select
              value={selectedTileLayer}
              onChange={(e) => setSelectedTileLayer(e.target.value as keyof typeof TILE_LAYERS)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="🔥 Google Maps (Unofficial - Use at own risk)">
                <option value="googleRoadmap">Google Roadmap ⚠️ (Default)</option>
                <option value="googleSatellite">Google Satellite ⚠️</option>
                <option value="googleHybrid">Google Hybrid ⚠️</option>
                <option value="googleTerrain">Google Terrain ⚠️</option>
              </optgroup>
              <optgroup label="🏢 Legal Alternatives with POIs">
                <option value="cartodbWithLabels">CartoDB with POI Labels (Safe)</option>
                <option value="esriStreet">Esri World Street Map (Safe)</option>
                <option value="esriTopo">Esri World Topographic (Safe)</option>
                <option value="osmWithLabels">OSM with More Labels (Safe)</option>
              </optgroup>
              <optgroup label="🛰️ Satellite Views (Legal)">
                <option value="satellite">Satellite (Esri)</option>
                <option value="hybrid">Hybrid with Labels (Esri)</option>
              </optgroup>
              <optgroup label="🗺️ Other Safe Options">
                <option value="osm">OpenStreetMap (Basic)</option>
                <option value="cartodb">CartoDB Positron (Clean)</option>
                <option value="esriGray">Esri Light Gray Base</option>
                <option value="terrain">Terrain (Topographic)</option>
              </optgroup>
            </select>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-amber-600 font-medium">
                ⚠️ Google tiles: Unofficial access, may be blocked anytime
              </p>
              <p className="text-xs text-gray-500">
                💡 For production use, consider legal alternatives or official Google Maps API
              </p>
            </div>
          </div>

          {/* Coordinate Offset Adjustment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fine-tune Position (if markers appear offset)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600">Latitude Offset</label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinateOffset.lat}
                  onChange={(e) => setCoordinateOffset(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.0000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Longitude Offset</label>
                <input
                  type="number"
                  step="0.0001"
                  value={coordinateOffset.lng}
                  onChange={(e) => setCoordinateOffset(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.0000"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setCoordinateOffset({ lat: 0, lng: 0 })}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Reset
              </button>
              <button
                onClick={() => setCoordinateOffset({ lat: 0.0001, lng: 0.0001 })}
                className="px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
              >
                Try +0.0001
              </button>
              <button
                onClick={() => setCoordinateOffset({ lat: -0.0001, lng: -0.0001 })}
                className="px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
              >
                Try -0.0001
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        {placemarks.length > 0 && bounds && bounds.isValid() ? (
          <MapContainer
            ref={mapRef}
            center={center}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="rounded-none"
          >
            <TileLayer
              key={selectedTileLayer}
              url={TILE_LAYERS[selectedTileLayer].url}
              attribution={TILE_LAYERS[selectedTileLayer].attribution}
            />
            {placemarks.map(renderPlacemark)}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p>No valid coordinates found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
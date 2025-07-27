import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Polygon, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GreenSpace, MapBounds, UserLocation } from '../../types/map';
import { mapUtils, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../utils/mapUtils';
import { MapControls } from './MapControls';
import { MapPopup } from './MapPopup';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useGreenSpaces } from '../../hooks/useGreenSpaces';
import { Circle } from 'react-leaflet';
import places from '../../data/places.json';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GreenSpacesLayerProps {
  greenSpaces: GreenSpace[];
  showGreenSpaces: boolean;
  onFeatureClick: (greenSpace: GreenSpace) => void;
}

const GreenSpacesLayer: React.FC<GreenSpacesLayerProps> = ({ 
  greenSpaces, 
  showGreenSpaces, 
  onFeatureClick 
}) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    if (!showGreenSpaces || greenSpaces.length === 0) {
      console.log('Not showing green spaces:', { showGreenSpaces, count: greenSpaces.length });
      return;
    }

    console.log('Rendering green spaces:', greenSpaces.length);

    greenSpaces.forEach((greenSpace, index) => {
      try {
        const { geometry, type, name } = greenSpace;
        const color = mapUtils.getGreenSpaceColor(type);
        
        console.log(`Rendering green space ${index + 1}:`, { name, type, geometry: geometry.type });
        
        let layer: L.Layer | null = null;

        if (geometry.type === 'Polygon') {
          const coordinates = geometry.coordinates[0] as number[][];
          const latLngs = coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
          console.log('Polygon latLngs:', latLngs);
          layer = L.polygon(latLngs, {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            weight: 3,
            opacity: 0.8,
            className: 'green-space-highlight'
          });
        } else if (geometry.type === 'LineString') {
          const coordinates = geometry.coordinates as number[][];
          const latLngs = coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
          console.log('LineString latLngs:', latLngs);
          layer = L.polyline(latLngs, {
            color: color,
            weight: 4,
            opacity: 0.9,
            className: 'green-space-highlight'
          });
        } else if (geometry.type === 'Point') {
          const coordinates = geometry.coordinates as number[];
          const latLng = [coordinates[1], coordinates[0]] as [number, number];
          console.log('Point latLng:', latLng);
          layer = L.circleMarker(latLng, {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 12,
            weight: 3,
            className: 'green-space-highlight'
          });
        }

        if (layer) {
          // Add click handler
          layer.on('click', (e) => {
            console.log('Green space clicked:', name);
            L.DomEvent.stopPropagation(e);
            onFeatureClick(greenSpace);
          });

          // Add hover effects
          layer.on('mouseover', function(this: L.Path) {
            if (!this.options) return;
            this.setStyle({
              weight: (this.options.weight ?? 3) + 1,
              fillOpacity: ((this.options.fillOpacity ?? 0.4) + 0.2)
            });
          });

          layer.on('mouseout', function(this: L.Path) {
            if (!this.options) return;
            this.setStyle({
              weight: (this.options.weight ?? 3) - 1,
              fillOpacity: ((this.options.fillOpacity ?? 0.6) - 0.2)
            });
          });

          // Add tooltip
          layer.bindTooltip(name, {
            permanent: false,
            direction: 'top',
            className: 'green-space-tooltip'
          });

          layer.addTo(layerGroup);
          console.log(`Successfully added ${name} to map`);
        } else {
          console.warn(`Failed to create layer for ${name}`);
        }
      } catch (error) {
        console.error('Error rendering green space:', greenSpace.name, error);
      }
    });

    console.log(`Total layers added: ${layerGroup.getLayers().length}`);

    return () => {
      layerGroup.clearLayers();
    };
  }, [greenSpaces, showGreenSpaces, onFeatureClick, map]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
};

const vungChuaTrail = places.find(place => place.id === 'vung-chua-trail')?.geometry?.coordinates;

interface UserLocationMarkerProps {
  location: UserLocation | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ location }) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (location) {
      const { lat, lng, accuracy } = location;

      // Create or update marker
      if (!markerRef.current) {
        const icon = L.divIcon({
          html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
          className: 'user-location-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      // Create or update accuracy circle
      if (accuracy && accuracy < 1000) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.3
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(accuracy);
        }
      }
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    };
  }, [location, map]);

  return null;
};

interface MapEventHandlerProps {
  onBoundsChange: (bounds: MapBounds) => void;
}

const MapEventHandler: React.FC<MapEventHandlerProps> = ({ onBoundsChange }) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const mapBounds: MapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
      console.log('Map bounds changed:', mapBounds);
      onBoundsChange(mapBounds);
    }
  });

  // Center map to user location
  const centerToLocation = useCallback((location: UserLocation) => {
    map.setView([location.lat, location.lng], 16, {
      animate: true,
      duration: 1
    });
  }, [map]);

  // Expose centering function
  useEffect(() => {
    (map as any).centerToLocation = centerToLocation;
  }, [map, centerToLocation]);

  return null;
};

export const MapView: React.FC = () => {
  const [showGreenSpaces, setShowGreenSpaces] = useState(true);
  const [selectedGreenSpace, setSelectedGreenSpace] = useState<GreenSpace | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Custom hooks
  const {
    location: userLocation,
    error: locationError,
    isLoading: isLocating,
    getCurrentLocation,
    clearError: clearLocationError,
    isSupported: isLocationSupported
  } = useGeolocation();

  const {
    greenSpaces,
    isLoading: isLoadingGreenSpaces,
    error: greenSpacesError,
    fetchGreenSpaces,
    clearError: clearGreenSpacesError,
    retryFetch: retryGreenSpaces
  } = useGreenSpaces();

  // Tạo polygon vùng quanh vị trí hiện tại (bán kính 200m)
  let userAreaPolygon: [number, number][] | null = null;
  if (userLocation) {
    const { lat, lng } = userLocation;
    // Tạo polygon hình tròn quanh vị trí user (36 điểm)
    const radius = 0.002; // ~200m (1 độ lat ~ 111km)
    userAreaPolygon = Array.from({ length: 36 }, (_, i) => {
      const angle = (i / 36) * 2 * Math.PI;
      return [lat + radius * Math.cos(angle), lng + radius * Math.sin(angle)] as [number, number];
    });
  }

  // Handle bounds change and fetch green spaces
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    console.log('Bounds changed, fetching green spaces:', bounds);
    if (showGreenSpaces) {
      fetchGreenSpaces(bounds);
    }
  }, [showGreenSpaces, fetchGreenSpaces]);

  // Handle locate user
  const handleLocateUser = useCallback(async () => {
    clearLocationError();
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Failed to get user location:', error);
    }
  }, [getCurrentLocation, clearLocationError]);

  // Center map to user location when obtained
  useEffect(() => {
    if (userLocation && mapRef.current) {
      const map = mapRef.current as any;
      if (map.centerToLocation) {
        map.centerToLocation(userLocation);
      }
    }
  }, [userLocation]);

  // Handle toggle green spaces
  const handleToggleGreenSpaces = useCallback(() => {
    setShowGreenSpaces(prev => {
      const newValue = !prev;
      
      console.log('Green spaces layer toggled:', {
        enabled: newValue,
        currentSpaces: greenSpaces.length,
        timestamp: new Date().toISOString()
      });
      
      return newValue;
    });
    
    clearGreenSpacesError();
  }, [clearGreenSpacesError, greenSpaces.length]);

  // Handle feature click
  const handleFeatureClick = useCallback((greenSpace: GreenSpace) => {
    console.log('Feature clicked:', greenSpace.name);
    setSelectedGreenSpace(greenSpace);
  }, []);

  // Handle retry green spaces
  const handleRetryGreenSpaces = useCallback(() => {
    clearGreenSpacesError();
    retryGreenSpaces();
  }, [clearGreenSpacesError, retryGreenSpaces]);

  // Initial load of green spaces
  useEffect(() => {
    console.log('Initial effect - showGreenSpaces:', showGreenSpaces);
    if (showGreenSpaces) {
      const bounds = mapUtils.getBoundsFromCenter(DEFAULT_CENTER, DEFAULT_ZOOM);
      console.log('Fetching initial green spaces for bounds:', bounds);
      fetchGreenSpaces(bounds);
    }
  }, [showGreenSpaces, fetchGreenSpaces]);

  // Debug effect to log green spaces changes
  useEffect(() => {
    console.log('Green spaces updated:', {
      count: greenSpaces.length,
      spaces: greenSpaces.map(s => ({ name: s.name, type: s.type }))
    });
  }, [greenSpaces]);

  // Debug: log khi render MapView
  useEffect(() => {
    console.log('[DEBUG][MapView] showGreenSpaces:', showGreenSpaces);
    console.log('[DEBUG][MapView] greenSpaces:', greenSpaces);
    console.log('[DEBUG][MapView] isLoadingGreenSpaces:', isLoadingGreenSpaces);
    console.log('[DEBUG][MapView] greenSpacesError:', greenSpacesError);
  }, [showGreenSpaces, greenSpaces, isLoadingGreenSpaces, greenSpacesError]);

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        
        <MapEventHandler onBoundsChange={handleBoundsChange} />
        
        {/* Vùng tô màu quanh vị trí user */}
        {userAreaPolygon && (
          <Polygon
            positions={userAreaPolygon}
            pathOptions={{ color: '#f59e42', fillColor: '#f59e42', fillOpacity: 0.3, weight: 2 }}
          />
        )}
        {/* Hiển thị các địa danh từ places.json */}
        {places.filter(place => place.location && place.location.lat && place.location.lng).map(place => {
          const location = place.location!;
          return (
            <Marker key={place.id} position={[location.lat, location.lng]}>
              <Popup>
                <b>{place.name}</b><br />
                {place.description}
                <br />
                <a href={place.source} target="_blank" rel="noopener noreferrer">Xem trên Google Maps</a>
              </Popup>
            </Marker>
          );
        })}
        
        <GreenSpacesLayer
          greenSpaces={greenSpaces}
          showGreenSpaces={showGreenSpaces}
          onFeatureClick={handleFeatureClick}
        />
        
        <UserLocationMarker location={userLocation} />

        {/* Hiển thị lộ trình đi bộ Núi Vũng Chua */}
        <Polyline
          positions={vungChuaTrail?.map(p => {
            const [lng, lat] = p;
            return [lat, lng] as [number, number];
          }) ?? []}
          pathOptions={{ color: 'blue', weight: 4, opacity: 0.8 }}
        />
      </MapContainer>

      {/* Map Controls */}
      <MapControls
        showGreenSpaces={showGreenSpaces}
        onToggleGreenSpaces={handleToggleGreenSpaces}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        hasLocationError={!!locationError}
        isLocationSupported={isLocationSupported}
        isLoadingGreenSpaces={isLoadingGreenSpaces}
        hasGreenSpacesError={!!greenSpacesError}
        onRetryGreenSpaces={handleRetryGreenSpaces}
      />

      {/* Debug Info */}
      <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-1000">
        <div>Green Spaces: {greenSpaces.length}</div>
        <div>Show Layer: {showGreenSpaces ? 'Yes' : 'No'}</div>
        <div>Loading: {isLoadingGreenSpaces ? 'Yes' : 'No'}</div>
        <div>Error: {greenSpacesError || 'None'}</div>
      </div>

      {/* Error Messages */}
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-1000">
          <div className="flex items-center gap-2 text-red-800 text-sm">
            <span>⚠️ {locationError}</span>
          </div>
        </div>
      )}

      {greenSpacesError && !isLoadingGreenSpaces && (
        <div className="absolute bottom-4 left-4 right-4 bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-lg z-1000">
          <div className="flex items-center justify-between text-orange-800 text-sm">
            <span>⚠️ {greenSpacesError}</span>
            <button
              onClick={handleRetryGreenSpaces}
              className="ml-2 px-3 py-1 bg-orange-100 hover:bg-orange-200 rounded text-xs font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Success message when spaces are loaded */}
      {greenSpaces.length > 0 && showGreenSpaces && (
        <div className="absolute bottom-4 left-4 bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg z-1000">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <span>✅ Đã tải {greenSpaces.length} không gian xanh</span>
          </div>
        </div>
      )}

      {/* Popup */}
      {selectedGreenSpace && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-2000">
          <MapPopup
            greenSpace={selectedGreenSpace}
            onClose={() => setSelectedGreenSpace(null)}
          />
        </div>
      )}
    </div>
  );
};
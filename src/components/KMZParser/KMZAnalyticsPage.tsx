import React, { useState, useMemo } from 'react';
import { Upload, FileText, MapPin, Folder, AlertCircle, CheckCircle, BarChart3, Route, Download, Eye } from 'lucide-react';
import { KMZParser } from '../../utils/kmzParser';
import { KMZDataTransformer, LocationStats } from '../../utils/kmzDataTransforms';
import { KMZData, Placemark, KMZFolder } from '../../types/kmz';
import { KMZMapView } from './KMZMapView';

interface KMZAnalyticsPageProps {}

interface SelectedMapView {
  placemarks: Placemark[];
  title: string;
}

export const KMZAnalyticsPage: React.FC<KMZAnalyticsPageProps> = () => {
  const [kmzData, setKmzData] = useState<KMZData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'analytics' | 'export'>('data');
  const [selectedMapView, setSelectedMapView] = useState<SelectedMapView | null>(null);

  // Memoized analytics data
  const analytics = useMemo(() => {
    if (!kmzData) return null;
    return KMZDataTransformer.analyzeKMZData(kmzData);
  }, [kmzData]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.kmz')) {
      setError('Please select a KMZ file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await KMZParser.parseKMZFile(file);
      
      if (result.success && result.data) {
        setKmzData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to parse KMZ file');
        setKmzData(null);
      }
    } catch (err) {
      setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setKmzData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const downloadGeoJSON = () => {
    if (!kmzData) return;
    
    const geoJSON = KMZDataTransformer.exportToGeoJSON(kmzData);
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kmzData.name.replace(/\s+/g, '_')}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAnalytics = () => {
    if (!analytics) return;
    
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kmzData?.name.replace(/\s+/g, '_')}_analytics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showOnMap = (placemarks: Placemark[], title: string) => {
    setSelectedMapView({ placemarks, title });
  };

  const getAllFolderPlacemarks = (folder: KMZFolder): Placemark[] => {
    let allPlacemarks = [...folder.placemarks];
    if (folder.folders) {
      folder.folders.forEach(subFolder => {
        allPlacemarks = allPlacemarks.concat(getAllFolderPlacemarks(subFolder));
      });
    }
    return allPlacemarks;
  };

  const renderPlacemark = (placemark: Placemark) => (
    <div key={placemark.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-600 mt-1" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{placemark.name}</h4>
            {placemark.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{placemark.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {placemark.geometry.type}
              </span>
              {placemark.geometry.type === 'Point' && (
                <span>
                  {(placemark.geometry.coordinates as any).lat.toFixed(6)}, {(placemark.geometry.coordinates as any).lng.toFixed(6)}
                </span>
              )}
              {placemark.geometry.type === 'LineString' && (
                <span>
                  {(placemark.geometry.coordinates as any[]).length} points
                </span>
              )}
              {placemark.geometry.type === 'Polygon' && (
                <span>
                  {(placemark.geometry.coordinates as any[][])[0].length} vertices
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => showOnMap([placemark], placemark.name)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="View on map"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderFolder = (folder: KMZFolder, level: number = 0) => {
    const allFolderPlacemarks = getAllFolderPlacemarks(folder);
    
    return (
      <div key={folder.name} className={`${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">{folder.name}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {allFolderPlacemarks.length} items
            </span>
          </div>
          {allFolderPlacemarks.length > 0 && (
            <button
              onClick={() => showOnMap(allFolderPlacemarks, `${folder.name} (${allFolderPlacemarks.length} items)`)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View all items on map"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {folder.description && (
          <p className="text-sm text-gray-600 mb-3 ml-7">{folder.description}</p>
        )}
        
        <div className="ml-7">
          {folder.placemarks.map(renderPlacemark)}
          {folder.folders && folder.folders.map(subFolder => renderFolder(subFolder, level + 1))}
        </div>
      </div>
    );
  };

  const mainContent = (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Parse Complete</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{analytics?.totalPlacemarks}</div>
            <div className="text-sm text-gray-600">Total Placemarks</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{analytics?.pointCount}</div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{analytics?.lineStringCount}</div>
            <div className="text-sm text-gray-600">Routes</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{analytics?.polygonCount}</div>
            <div className="text-sm text-gray-600">Polygons</div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-2">{kmzData?.name}</h3>
          {kmzData?.description && (
            <p className="text-gray-600 text-sm">{kmzData.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('data')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Raw Data
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'data' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Parsed Data</h2>
              
              {/* Root Placemarks */}
              {kmzData && kmzData.placemarks.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Root Placemarks</h3>
                    <button
                      onClick={() => showOnMap(kmzData.placemarks, `Root Placemarks (${kmzData.placemarks.length} items)`)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View all on map
                    </button>
                  </div>
                  {kmzData.placemarks.map(renderPlacemark)}
                </div>
              )}

              {/* Folders */}
              {kmzData && kmzData.folders && kmzData.folders.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Folders</h3>
                  {kmzData.folders.map(folder => renderFolder(folder))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Geographic Bounds */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Geographic Bounds</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">North:</span>
                      <span className="font-mono ml-2">{analytics.bounds.north.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">South:</span>
                      <span className="font-mono ml-2">{analytics.bounds.south.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">East:</span>
                      <span className="font-mono ml-2">{analytics.bounds.east.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">West:</span>
                      <span className="font-mono ml-2">{analytics.bounds.west.toFixed(6)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Center:</span>
                    <span className="font-mono ml-2">
                      {analytics.averageCoordinates.lat.toFixed(6)}, {analytics.averageCoordinates.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Clusters */}
              {analytics.clusters.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Clusters</h3>
                  <div className="space-y-3">
                    {analytics.clusters.slice(0, 5).map(cluster => (
                      <div key={cluster.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Cluster {cluster.id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{cluster.placemarks.length} locations</span>
                            <button
                              onClick={() => showOnMap(cluster.placemarks, `Cluster ${cluster.id} (${cluster.placemarks.length} locations)`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="View cluster on map"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Center: {cluster.center.lat.toFixed(6)}, {cluster.center.lng.toFixed(6)}</div>
                          {cluster.radius > 0 && <div>Radius: {cluster.radius.toFixed(2)} km</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Route Analysis */}
              {analytics.routes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Analysis</h3>
                  <div className="space-y-3">
                    {analytics.routes.map(route => {
                      const routePlacemark = KMZDataTransformer.getAllPlacemarks(kmzData!).find(p => p.id === route.id);
                      return (
                        <div key={route.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Route className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{route.name}</span>
                            </div>
                            {routePlacemark && (
                              <button
                                onClick={() => showOnMap([routePlacemark], `Route: ${route.name}`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="View route on map"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>Distance: {route.totalDistance.toFixed(2)} km</div>
                            <div>Waypoints: {route.waypoints}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Export Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">GeoJSON Export</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export your KMZ data as GeoJSON format, compatible with most mapping libraries and GIS software.
                  </p>
                  <button
                    onClick={downloadGeoJSON}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download GeoJSON
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Export</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export the analytics data including clusters, routes, and statistical information.
                  </p>
                  <button
                    onClick={downloadAnalytics}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 p-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced KMZ Parser & Analytics</h1>
          <p className="text-gray-600">
            Upload and parse KMZ files exported from Google Maps with advanced analytics and data transformation features.
          </p>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload KMZ File
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your KMZ file here, or click to browse
            </p>
            <input
              type="file"
              accept=".kmz"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Select KMZ File
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Parsing KMZ file...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Success State with Data */}
        {kmzData && analytics && (
          <div className={selectedMapView ? "grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]" : ""}>
            {/* Main Content */}
            <div className={selectedMapView ? "overflow-y-auto" : ""}>
              {mainContent}
            </div>

            {/* Map View */}
            {selectedMapView && (
              <div className="h-full">
                <KMZMapView
                  placemarks={selectedMapView.placemarks}
                  title={selectedMapView.title}
                  onClose={() => setSelectedMapView(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { Upload, FileText, MapPin, Folder, AlertCircle, CheckCircle } from 'lucide-react';
import { KMZParser } from '../../utils/kmzParser';
import { KMZData, Placemark, KMZFolder } from '../../types/kmz';

interface KMZParserPageProps {}

export const KMZParserPage: React.FC<KMZParserPageProps> = () => {
  const [kmzData, setKmzData] = useState<KMZData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  const getTotalPlacemarks = (data: KMZData): number => {
    let total = data.placemarks.length;
    
    const countInFolders = (folders: KMZFolder[]): number => {
      return folders.reduce((count, folder) => {
        return count + folder.placemarks.length + (folder.folders ? countInFolders(folder.folders) : 0);
      }, 0);
    };

    total += countInFolders(data.folders || []);
    return total;
  };

  const renderPlacemark = (placemark: Placemark, index: number) => (
    <div key={placemark.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <div className="flex items-start gap-3">
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
    </div>
  );

  const renderFolder = (folder: KMZFolder, level: number = 0) => (
    <div key={folder.name} className={`${level > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Folder className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">{folder.name}</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {folder.placemarks.length} items
        </span>
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KMZ File Parser</h1>
          <p className="text-gray-600">
            Upload and parse KMZ files exported from Google Maps to extract and visualize location data.
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
        {kmzData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Parse Complete</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{getTotalPlacemarks(kmzData)}</div>
                  <div className="text-sm text-gray-600">Total Placemarks</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{(kmzData.folders || []).length}</div>
                  <div className="text-sm text-gray-600">Folders</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{kmzData.placemarks.length}</div>
                  <div className="text-sm text-gray-600">Root Placemarks</div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">{kmzData.name}</h3>
                {kmzData.description && (
                  <p className="text-gray-600 text-sm">{kmzData.description}</p>
                )}
              </div>
            </div>

            {/* Data Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Parsed Data</h2>
              
              {/* Root Placemarks */}
              {kmzData.placemarks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Root Placemarks</h3>
                  {kmzData.placemarks.map(renderPlacemark)}
                </div>
              )}

              {/* Folders */}
              {kmzData.folders && kmzData.folders.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Folders</h3>
                  {kmzData.folders.map(folder => renderFolder(folder))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
import React from 'react';
import { MapPin, Layers, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

interface MapControlsProps {
  showGreenSpaces: boolean;
  onToggleGreenSpaces: () => void;
  onLocateUser: () => void;
  isLocating: boolean;
  hasLocationError: boolean;
  isLocationSupported: boolean;
  isLoadingGreenSpaces: boolean;
  hasGreenSpacesError: boolean;
  onRetryGreenSpaces: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showGreenSpaces,
  onToggleGreenSpaces,
  onLocateUser,
  isLocating,
  hasLocationError,
  isLocationSupported,
  isLoadingGreenSpaces,
  hasGreenSpacesError,
  onRetryGreenSpaces
}) => {
  return (
    <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      {/* Green Spaces Toggle */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <button
          onClick={onToggleGreenSpaces}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
            transition-colors duration-200
            ${showGreenSpaces 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          disabled={isLoadingGreenSpaces}
        >
          {isLoadingGreenSpaces ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Layers className="w-5 h-5" />
          )}
          <span className="whitespace-nowrap">
            {isLoadingGreenSpaces ? 'Đang tải...' : 'Không gian xanh'}
          </span>
        </button>
        
        {hasGreenSpacesError && (
          <div className="px-4 py-2 border-t border-gray-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Không tải được dữ liệu</span>
              <button
                onClick={onRetryGreenSpaces}
                className="ml-auto p-1 hover:bg-red-100 rounded"
                title="Thử lại"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Locate User Button */}
      {isLocationSupported && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <button
            onClick={onLocateUser}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
              transition-colors duration-200
              ${hasLocationError
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }
            `}
            disabled={isLocating}
            title={hasLocationError ? 'Lỗi định vị - Click để thử lại' : 'Định vị tôi'}
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasLocationError ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
            <span className="whitespace-nowrap">
              {isLocating ? 'Đang định vị...' : 'Định vị tôi'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
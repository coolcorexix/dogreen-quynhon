import React from 'react';
import { X, MapPin, Clock, Phone, Globe, Info } from 'lucide-react';
import { GreenSpace } from '../../types/map';
import { mapUtils } from '../../utils/mapUtils';

interface MapPopupProps {
  greenSpace: GreenSpace;
  onClose: () => void;
}

export const MapPopup: React.FC<MapPopupProps> = ({ greenSpace, onClose }) => {
  const { name, type, description, properties } = greenSpace;
  const typeName = mapUtils.getGreenSpaceTypeName(type);
  const color = mapUtils.getGreenSpaceColor(type);

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {typeName}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {(description || properties.description) && (
          <div className="flex gap-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 leading-relaxed">
              {description || properties.description}
            </p>
          </div>
        )}

        {/* Location info for trails */}
        {type === 'trail' && (
          <div className="flex gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <span>Đường mòn / Lối đi</span>
              {properties.surface && (
                <span className="text-gray-500"> • Mặt {properties.surface}</span>
              )}
            </div>
          </div>
        )}

        {/* Opening hours */}
        {properties.opening_hours && (
          <div className="flex gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <div className="font-medium">Giờ mở cửa</div>
              <div className="text-gray-500 mt-1">
                {formatOpeningHours(properties.opening_hours)}
              </div>
            </div>
          </div>
        )}

        {/* Contact info */}
        {properties.phone && (
          <div className="flex gap-3">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <a 
              href={`tel:${properties.phone}`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {properties.phone}
            </a>
          </div>
        )}

        {/* Website */}
        {properties.website && (
          <div className="flex gap-3">
            <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <a 
              href={properties.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors break-all"
            >
              Xem thông tin chi tiết
            </a>
          </div>
        )}

        {/* Additional tags */}
        <div className="flex flex-wrap gap-1 pt-2">
          {properties.amenity && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {formatTag(properties.amenity)}
            </span>
          )}
          {properties.leisure && properties.leisure !== type && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {formatTag(properties.leisure)}
            </span>
          )}
          {properties.natural && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              {formatTag(properties.natural)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function formatOpeningHours(hours: string): string {
  // Simple formatting for common opening hours patterns
  if (hours === '24/7') return 'Mở cửa 24/7';
  if (hours.includes('Mo-Su')) return hours.replace('Mo-Su', 'Thứ 2 - Chủ nhật');
  if (hours.includes('Mo-Fr')) return hours.replace('Mo-Fr', 'Thứ 2 - Thứ 6');
  return hours;
}

function formatTag(tag: string): string {
  // Convert common OSM tags to Vietnamese
  const translations: Record<string, string> = {
    'parking': 'Bãi đỗ xe',
    'playground': 'Sân chơi',
    'toilets': 'Nhà vệ sinh',
    'bench': 'Ghế ngồi',
    'fountain': 'Đài nước',
    'picnic_table': 'Bàn picnic',
    'sports_centre': 'Trung tâm thể thao',
    'swimming_pool': 'Hồ bơi',
    'wood': 'Rừng',
    'grass': 'Cỏ',
    'water': 'Nước',
    'scrub': 'Bụi rậm'
  };

  return translations[tag] || tag.replace(/_/g, ' ');
}
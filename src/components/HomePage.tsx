import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, ExternalLink } from 'lucide-react';
import { OutdoorActivity, parseMarkdownActivities, fallbackActivities } from '../utils/markdownParser';

const HomePage: React.FC = () => {
  const [activities, setActivities] = useState<OutdoorActivity[]>(fallbackActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch('/data/outdoor-activities.md');
        if (response.ok) {
          const markdownContent = await response.text();
          const parsedActivities = parseMarkdownActivities(markdownContent);
          setActivities(parsedActivities);
        } else {
          console.warn('Could not load markdown file, using fallback data');
          setActivities(fallbackActivities);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities(fallbackActivities);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 p-4 flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
          <h2 className="text-2xl font-bold text-black">Đang tải dữ liệu...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
          <h1 className="text-5xl font-black text-black mb-4 tracking-tight">
            HOẠT ĐỘNG NGOÀI TRỜI QUY NHƠN
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Khám phá những hoạt động ngoài trời tuyệt vời tại Quy Nhơn và khu vực lân cận
          </p>
          <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-300 rounded">
            <p className="text-sm text-blue-800">
                             💡 <strong>Mẹo:</strong> Dữ liệu được tải từ file markdown. Bạn có thể chỉnh sửa file 
               <code className="bg-blue-200 px-2 py-1 rounded mx-1">public/data/outdoor-activities.md</code> 
               để thêm/bớt/chỉnh sửa các hoạt động!
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">BỘ LỌC</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Tất cả ({activities.length})
            </button>
            <button className="bg-white border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Leo núi ({activities.filter(a => a.category === 'Leo núi').length})
            </button>
            <button className="bg-white border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Đạp xe ({activities.filter(a => a.category === 'Đạp xe').length})
            </button>
            <button className="bg-white border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Thể thao nước ({activities.filter(a => a.category?.includes('Thể thao') || a.category?.includes('Lặn')).length})
            </button>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
            >
              {/* Activity Header */}
              <div className="bg-pink-300 border-b-4 border-black p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-black leading-tight">
                    {activity.name}
                  </h3>
                  {activity.difficulty && (
                    <span className={`${getDifficultyColor(activity.difficulty)} text-white px-3 py-1 text-sm font-bold border-2 border-black`}>
                      {activity.difficulty}
                    </span>
                  )}
                </div>
                {activity.category && (
                  <span className="bg-blue-300 text-black px-3 py-1 text-sm font-bold border-2 border-black">
                    {activity.category}
                  </span>
                )}
              </div>

              {/* Activity Content */}
              <div className="p-6">
                {activity.description && (
                  <p className="text-gray-700 mb-4 font-medium">
                    {activity.description}
                  </p>
                )}

                {/* Time Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-gray-600">Thời gian trong ngày:</p>
                      <p className="text-black font-semibold">{activity.dailyTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-gray-600">Thời gian trong năm:</p>
                      <p className="text-black font-semibold">{activity.seasonalTime}</p>
                    </div>
                  </div>
                </div>

                {/* Location and Action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-600">
                      {activity.coordinates.lat.toFixed(4)}, {activity.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                  <button
                    onClick={() => openInMaps(activity.coordinates.lat, activity.coordinates.lng)}
                    className="bg-orange-400 border-2 border-black px-4 py-2 font-bold text-black hover:bg-orange-500 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem bản đồ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-purple-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 mt-8">
          <h2 className="text-2xl font-bold text-black mb-4">LƯU Ý QUAN TRỌNG</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-black p-4">
              <h3 className="font-bold text-black mb-2">🌤️ Thời tiết</h3>
              <p className="text-sm">Kiểm tra dự báo thời tiết trước khi tham gia hoạt động</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <h3 className="font-bold text-black mb-2">🛡️ An toàn</h3>
              <p className="text-sm">Mang theo thiết bị bảo hộ và dụng cụ cần thiết</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <h3 className="font-bold text-black mb-2">💧 Nước uống</h3>
              <p className="text-sm">Mang đủ nước uống cho hoạt động ngoài trời</p>
            </div>
            <div className="bg-white border-2 border-black p-4">
              <h3 className="font-bold text-black mb-2">📱 Liên lạc</h3>
              <p className="text-sm">Thông báo cho người thân về lịch trình của bạn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
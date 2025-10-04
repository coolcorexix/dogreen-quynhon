import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../components/Auth/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, Gift, Calendar, Leaf, Eye } from 'lucide-react'
import environmentalActivities from '../data/environmentalActivities.json'

interface Activity {
  day: number
  activityName: string
  isCheckpointForGift: boolean
}

export function EnvironmentalActivitiesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])

  // Load activities from JSON - read-only mode
  useEffect(() => {
    setActivities(environmentalActivities)
  }, [])

  const totalCount = activities.length
  const giftCheckpoints = activities.filter(activity => activity.isCheckpointForGift).length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Hoạt động bảo vệ môi trường
                </h1>
                <p className="text-gray-600 mt-1">
                  Thử thách 30 ngày vì một hành tinh xanh
                </p>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Tổng số hoạt động</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {totalCount}
                </div>
                <div className="text-sm text-blue-700">
                  hoạt động bảo vệ môi trường
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Điểm thưởng</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {giftCheckpoints}
                </div>
                <div className="text-sm text-purple-700">
                  hoạt động có điểm nhận quà
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Danh sách hoạt động
                </h2>
              </div>
              <p className="text-gray-600">
                Danh sách các hoạt động bảo vệ môi trường trong 30 ngày (chế độ xem)
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div 
                  key={activity.day}
                  className={`p-6 ${
                    activity.isCheckpointForGift ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Day Number */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-blue-100 text-blue-700">
                        {activity.day}
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg text-gray-900">
                            {activity.activityName}
                          </p>
                          
                          {activity.isCheckpointForGift && (
                            <div className="flex items-center gap-1 mt-2">
                              <Gift className="w-4 h-4 text-purple-500" />
                              <span className="text-sm text-purple-600 font-medium">
                                Điểm nhận quà
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Read-only indicator */}
                        <div className="flex-shrink-0 p-2 text-gray-400">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Information Message */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-100 to-green-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Leaf className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">
                  Danh sách hoạt động bảo vệ môi trường
                </h3>
              </div>
              <p className="text-gray-700 mb-3">
                Đây là danh sách các hoạt động bảo vệ môi trường trong 30 ngày. 
                Bạn có thể tham khảo để thực hiện các hoạt động này trong cuộc sống hàng ngày.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-200 rounded-full"></div>
                  <span>Điểm nhận quà</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Chế độ xem</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

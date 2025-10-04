import React, { useState } from 'react'
import { ActivityManager } from './ActivityManager'
import { ProgramManager } from './ProgramManager'
import { UserProgressManager } from './UserProgressManager'

type AdminTab = 'activities' | 'programs' | 'progress'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('activities')

  const tabs = [
    { id: 'activities' as AdminTab, name: 'Activities', icon: '🌱' },
    { id: 'programs' as AdminTab, name: 'Programs', icon: '📋' },
    { id: 'progress' as AdminTab, name: 'User Progress', icon: '👥' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activities':
        return <ActivityManager />
      case 'programs':
        return <ProgramManager />
      case 'progress':
        return <UserProgressManager />
      default:
        return <ActivityManager />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage activities, programs, and user progress for the environmental challenge platform.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

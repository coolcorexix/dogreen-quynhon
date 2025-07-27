import React, { useState } from 'react';
import { MapView } from './components/Map/MapView';
import { KMZAnalyticsPage } from './components/KMZParser/KMZAnalyticsPage';
import HomePage from './components/HomePage';
import { Map, FileUp, Home } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'home' | 'map' | 'kmz'>('home');

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">DoGreen Project</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveView('home')}
              className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
                activeView === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </button>
            <button
              onClick={() => setActiveView('kmz')}
              className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
                activeView === 'kmz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              KMZ Parser
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
                activeView === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Map className="w-4 h-4" />
              Map View
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeView === 'home' ? (
          <HomePage />
        ) : activeView === 'kmz' ? (
          <KMZAnalyticsPage />
        ) : (
          <MapView />
        )}
      </main>
    </div>
  );
}

export default App;
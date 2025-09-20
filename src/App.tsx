import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapView } from './components/Map/MapView';
import { KMZAnalyticsPage } from './components/KMZParser/KMZAnalyticsPage';
import HomePage from './components/HomePage';
import HeroPage from './components/HeroPage';
import { Map, FileUp, Home, Mountain } from 'lucide-react';
import { HomePage2 } from './pages/HomePage2';
import { AuthProvider } from './contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10 hidden">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Do Green</h1>
        <nav className="flex gap-2">
          <Link
            to="/"
            className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
              location.pathname === '/'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
          <Link
            to="/hero"
            className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
              location.pathname === '/hero'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mountain className="w-4 h-4" />
            Hero
          </Link>
          <Link
            to="/kmz"
            className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
              location.pathname === '/kmz'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileUp className="w-4 h-4" />
            KMZ Parser
          </Link>
          <Link
            to="/map"
            className={`px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2 ${
              location.pathname === '/map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Map className="w-4 h-4" />
            Map View
          </Link>
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="w-full min-h-screen flex flex-col">
          {/* <Navigation /> */}
          
          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path='/dogreen' element={<HomePage2 />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/hero" element={<HeroPage />} />
              <Route path="/kmz" element={<KMZAnalyticsPage />} />
              <Route path="/map" element={<MapView />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
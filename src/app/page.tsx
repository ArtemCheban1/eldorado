"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { ArchaeologicalSite } from '@/types';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import FilterPanel from '@/components/FilterPanel';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

const GeoreferenceView = dynamic(() => import('@/components/GeoreferenceView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading georeference view...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [allSites, setAllSites] = useState<ArchaeologicalSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<ArchaeologicalSite[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mode, setMode] = useState<'map' | 'georeference'>('map');

  // Fetch sites from API
  const fetchSites = useCallback(async () => {
    try {
      const response = await axios.get('/api/sites');
      const sites = response.data.sites || [];
      setAllSites(sites);
      setFilteredSites(sites);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setAllSites([]);
      setFilteredSites([]);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    <>
      {mode === 'georeference' ? (
        // Georeference Mode - Full screen split view
        <GeoreferenceView onBackToMap={() => setMode('map')} />
      ) : (
        // Map Mode - Three panel layout
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Left Sidebar - Tools & Navigation */}
          <LeftSidebar
            onShowFilters={() => setShowFilters(!showFilters)}
            onModeChange={setMode}
            currentMode={mode}
          />

          {/* Filter Panel Overlay */}
          {showFilters && (
            <div className="fixed left-20 top-4 bottom-4 w-80 z-[1000] overflow-hidden">
              <FilterPanel sites={allSites} onFilteredSitesChange={setFilteredSites} />
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Main Map View */}
          <main className="flex-1 relative">
            <MapView key={filteredSites.length} sites={filteredSites} onSitesChange={fetchSites} />
          </main>

          {/* Right Sidebar - Details & Information */}
          <RightSidebar />
        </div>
      )}
    </>
  );
}

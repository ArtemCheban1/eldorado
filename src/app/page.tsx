"use client";

import dynamic from 'next/dynamic';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import { MapLayersProvider } from '@/context/MapLayersContext';

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

export default function Home() {
  return (
    <MapLayersProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Left Sidebar - Tools & Navigation */}
        <LeftSidebar />

        {/* Main Map View */}
        <main className="flex-1 relative">
          <MapView />
        </main>

        {/* Right Sidebar - Details & Information */}
        <RightSidebar />
      </div>
    </MapLayersProvider>
  );
}

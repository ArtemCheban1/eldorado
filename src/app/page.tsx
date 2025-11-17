"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header with Project Switcher */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools & Navigation */}
        <LeftSidebar onDataRefresh={handleDataRefresh} />

        {/* Main Map View */}
        <main className="flex-1 relative">
          <MapView refreshTrigger={refreshTrigger} />
        </main>

        {/* Right Sidebar - Details & Information */}
        <RightSidebar />
      </div>
    </div>
  );
}

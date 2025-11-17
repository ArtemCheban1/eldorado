"use client";

import dynamic from 'next/dynamic';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import AuthButton from '@/components/AuthButton';

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
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header with Auth */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">El Dorado</h1>
          <span className="text-sm text-gray-400">Archaeological Map Management</span>
        </div>
        <AuthButton />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools & Navigation */}
        <LeftSidebar />

        {/* Main Map View */}
        <main className="flex-1 relative">
          <MapView />
        </main>

        {/* Right Sidebar - Details & Information */}
        <RightSidebar />
      </div>
    </div>
  );
}

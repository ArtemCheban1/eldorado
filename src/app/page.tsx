"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Header } from '@/components/Header';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import GeoreferencingTool from '@/components/GeoreferencingTool';
import { MapLayersProvider } from '@/context/MapLayersContext';
import { GeoreferencedLayer } from '@/types';

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
  const [georeferencedLayers, setGeoreferencedLayers] = useState<GeoreferencedLayer[]>([]);
  const [showGeoreferencingTool, setShowGeoreferencingTool] = useState(false);
  const [mapClickCallback, setMapClickCallback] = useState<((lat: number, lng: number) => void) | null>(null);

  // Load georeferenced layers on mount
  useEffect(() => {
    loadGeoreferencedLayers();
  }, []);

  const loadGeoreferencedLayers = async () => {
    try {
      const response = await axios.get('/api/georeferenced-layers');
      setGeoreferencedLayers(response.data.layers || []);
    } catch (error) {
      console.error('Failed to load georeferenced layers:', error);
    }
  };

  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLayerToggle = (layerId: string, visible: boolean) => {
    setGeoreferencedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible } : layer
      )
    );

    // Also update in backend
    const layer = georeferencedLayers.find(l => l.id === layerId);
    if (layer) {
      axios.put(`/api/georeferenced-layers/${layerId}`, {
        ...layer,
        visible
      }).catch(error => {
        console.error('Failed to update layer visibility:', error);
      });
    }
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    setGeoreferencedLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );

    // Also update in backend
    const layer = georeferencedLayers.find(l => l.id === layerId);
    if (layer) {
      axios.put(`/api/georeferenced-layers/${layerId}`, {
        ...layer,
        opacity
      }).catch(error => {
        console.error('Failed to update layer opacity:', error);
      });
    }
  };

  const handleMapClick = useCallback((callback: (lat: number, lng: number) => void) => {
    setMapClickCallback(() => callback);
  }, []);

  const handleMapClickEvent = useCallback((lat: number, lng: number) => {
    if (mapClickCallback) {
      mapClickCallback(lat, lng);
      setMapClickCallback(null);
    }
  }, [mapClickCallback]);

  return (
    <MapLayersProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {/* Header with Project Switcher */}
        <Header />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools & Navigation */}
          <LeftSidebar
            onDataRefresh={handleDataRefresh}
            georeferencedLayers={georeferencedLayers}
            onOpenGeoreferencingTool={() => setShowGeoreferencingTool(true)}
            onLayersUpdate={loadGeoreferencedLayers}
            onLayerToggle={handleLayerToggle}
            onLayerOpacityChange={handleLayerOpacityChange}
          />

          {/* Main Map View */}
          <main className="flex-1 relative">
            <MapView
              refreshTrigger={refreshTrigger}
              georeferencedLayers={georeferencedLayers.filter(l => l.visible)}
              onMapClick={handleMapClickEvent}
            />
          </main>

          {/* Right Sidebar - Details & Information */}
          <RightSidebar />
        </div>

        {/* Georeferencing Tool Modal */}
        {showGeoreferencingTool && (
          <GeoreferencingTool
            onClose={() => setShowGeoreferencingTool(false)}
            onSave={(layer) => {
              setGeoreferencedLayers(prev => [...prev, layer]);
              setShowGeoreferencingTool(false);
            }}
            onMapClick={handleMapClick}
          />
        )}
      </div>
    </MapLayersProvider>
  );
}

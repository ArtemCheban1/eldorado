'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ImageViewer from '@/components/ImageViewer';
import { ReferencePoint } from '@/types';

// Dynamically import map component to avoid SSR issues
const GeoreferenceMap = dynamic(() => import('@/components/GeoreferenceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function GeoreferencePage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [referencePoints, setReferencePoints] = useState<ReferencePoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>();
  const [mode, setMode] = useState<'image' | 'map'>('image');
  const [pendingImageCoordinates, setPendingImageCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.9028, 12.4964]); // Default to Rome

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setReferencePoints([]); // Clear points when new image is uploaded
    }
  };

  const handleImageClick = (x: number, y: number) => {
    if (mode === 'image') {
      // Store the image coordinates and wait for map click
      setPendingImageCoordinates({ x, y });
      setMode('map');
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === 'map' && pendingImageCoordinates) {
      // Create a new reference point
      const newPoint: ReferencePoint = {
        id: `point-${Date.now()}`,
        imageCoordinates: pendingImageCoordinates,
        mapCoordinates: { lat, lng },
        label: `Point ${referencePoints.length + 1}`,
      };
      setReferencePoints([...referencePoints, newPoint]);
      setPendingImageCoordinates(null);
      setMode('image');
    }
  };

  const handleDeletePoint = (pointId: string) => {
    setReferencePoints(referencePoints.filter((p) => p.id !== pointId));
    if (selectedPointId === pointId) {
      setSelectedPointId(undefined);
    }
  };

  const handleClearAllPoints = () => {
    if (confirm('Are you sure you want to clear all reference points?')) {
      setReferencePoints([]);
      setSelectedPointId(undefined);
    }
  };

  const handleExport = () => {
    const data = {
      imageUrl,
      referencePoints,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `georeference-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              title="Back to main map"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Georeference Tool</h1>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'image' ? 'Click on the image to select a point' : 'Click on the map to match the point'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!imageUrl ? (
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <>
                <label className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleClearAllPoints}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={referencePoints.length === 0}
                >
                  Clear All Points
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={referencePoints.length === 0}
                >
                  Export Data
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {imageUrl && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${mode === 'image' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className={mode === 'image' ? 'font-semibold text-blue-700' : 'text-gray-600'}>
                Image Selection
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${mode === 'map' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className={mode === 'map' ? 'font-semibold text-green-700' : 'text-gray-600'}>
                Map Selection
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Reference Points:</span>
              <span className="font-semibold text-gray-800">{referencePoints.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!imageUrl ? (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Image Loaded</h2>
              <p className="text-gray-500 mb-6">Upload a historical map or aerial image to begin georeferencing</p>
              <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            {/* Left Side - Image Viewer */}
            <div className="flex-1 border-r border-gray-300 relative">
              <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md px-3 py-2">
                <h3 className="text-sm font-semibold text-gray-700">Historical Image</h3>
              </div>
              <ImageViewer
                imageUrl={imageUrl}
                referencePoints={referencePoints}
                onImageClick={handleImageClick}
                selectedPointId={selectedPointId}
              />
            </div>

            {/* Right Side - Map Viewer */}
            <div className="flex-1 relative">
              <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow-md px-3 py-2">
                <h3 className="text-sm font-semibold text-gray-700">Map View</h3>
              </div>
              <GeoreferenceMap
                referencePoints={referencePoints}
                onMapClick={handleMapClick}
                selectedPointId={selectedPointId}
                center={mapCenter}
              />
            </div>
          </>
        )}
      </div>

      {/* Reference Points Panel */}
      {imageUrl && referencePoints.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Reference Points</h3>
          <div className="flex gap-2 overflow-x-auto">
            {referencePoints.map((point) => (
              <div
                key={point.id}
                className={`flex-shrink-0 border rounded-lg px-3 py-2 cursor-pointer transition-all ${
                  selectedPointId === point.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedPointId(point.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{point.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePoint(point.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Image: ({Math.round(point.imageCoordinates.x)}, {Math.round(point.imageCoordinates.y)})
                  <br />
                  Map: ({point.mapCoordinates.lat.toFixed(4)}, {point.mapCoordinates.lng.toFixed(4)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

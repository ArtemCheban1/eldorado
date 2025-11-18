"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ImageViewer from '@/components/ImageViewer';

// Dynamically import GeoReferenceMap with no SSR to avoid window/leaflet issues
const GeoReferenceMap = dynamic(() => import('@/components/GeoReferenceMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-800">
      <div className="text-white">Loading map...</div>
    </div>
  ),
});

interface ControlPoint {
  id: string;
  imageX: number;
  imageY: number;
  lat?: number;
  lng?: number;
}

export default function GeoreferencePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (x: number, y: number) => {
    if (selectedPointId) {
      // Update existing point
      setControlPoints(prev =>
        prev.map(point =>
          point.id === selectedPointId
            ? { ...point, imageX: x, imageY: y }
            : point
        )
      );
      setSelectedPointId(null);
    } else {
      // Create new point
      const newPoint: ControlPoint = {
        id: `point-${Date.now()}`,
        imageX: x,
        imageY: y,
      };
      setControlPoints(prev => [...prev, newPoint]);
      setSelectedPointId(newPoint.id);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (selectedPointId) {
      // Update existing point with map coordinates
      setControlPoints(prev =>
        prev.map(point =>
          point.id === selectedPointId
            ? { ...point, lat, lng }
            : point
        )
      );
      setSelectedPointId(null);
    } else {
      // Create new point with only map coordinates
      const newPoint: ControlPoint = {
        id: `point-${Date.now()}`,
        imageX: 0,
        imageY: 0,
        lat,
        lng,
      };
      setControlPoints(prev => [...prev, newPoint]);
      setSelectedPointId(newPoint.id);
    }
  };

  const handlePointSelect = (pointId: string) => {
    setSelectedPointId(pointId === selectedPointId ? null : pointId);
  };

  const handlePointDelete = (pointId: string) => {
    setControlPoints(prev => prev.filter(point => point.id !== pointId));
    if (selectedPointId === pointId) {
      setSelectedPointId(null);
    }
  };

  const handleSaveGeoreference = () => {
    const validPoints = controlPoints.filter(point => point.lat !== undefined && point.lng !== undefined);

    if (validPoints.length < 3) {
      alert('You need at least 3 control points with both image and map coordinates to georeference.');
      return;
    }

    console.log('Saving georeference with points:', validPoints);
    alert('Georeference saved successfully! (This is a placeholder - implement actual save functionality)');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 shadow-lg border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Georeference Image</h1>
            <p className="text-sm text-gray-400 mt-1">
              Click on the image and map to create control points
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!uploadedImage && (
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded cursor-pointer transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {uploadedImage && (
              <>
                <label className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded cursor-pointer transition-colors text-sm">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleSaveGeoreference}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors font-medium"
                >
                  Save Georeference
                </button>
              </>
            )}

            <a
              href="/"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Back to Map
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {!uploadedImage ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No Image Uploaded</h2>
            <p className="mb-4">Upload an image to start georeferencing</p>
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded cursor-pointer transition-colors inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Image Viewer - Left Side */}
          <div className="flex-1 flex flex-col border-r border-gray-700">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-white font-semibold">Image</h2>
              {imageDimensions && (
                <p className="text-xs text-gray-400">
                  {imageDimensions.width} × {imageDimensions.height} px
                </p>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <ImageViewer
                imageUrl={uploadedImage}
                controlPoints={controlPoints}
                selectedPointId={selectedPointId}
                onImageClick={handleImageClick}
                onPointSelect={handlePointSelect}
                onPointDelete={handlePointDelete}
              />
            </div>
          </div>

          {/* Map Viewer - Right Side */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-white font-semibold">Map</h2>
              <p className="text-xs text-gray-400">
                Click to set coordinates for control points
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <GeoReferenceMap
                controlPoints={controlPoints}
                selectedPointId={selectedPointId}
                onMapClick={handleMapClick}
                onPointSelect={handlePointSelect}
                onPointDelete={handlePointDelete}
              />
            </div>
          </div>

          {/* Control Points Panel - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 max-h-48 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2">
              Control Points ({controlPoints.length})
            </h3>
            {controlPoints.length === 0 ? (
              <p className="text-gray-400 text-sm">No control points yet. Click on the image and map to add points.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {controlPoints.map((point) => (
                  <div
                    key={point.id}
                    className={`bg-gray-700 rounded p-2 text-sm cursor-pointer transition-colors ${
                      selectedPointId === point.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => handlePointSelect(point.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">
                        {point.id.split('-')[1].slice(-4)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePointDelete(point.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-gray-300 text-xs space-y-1">
                      <div>Image: ({Math.round(point.imageX)}, {Math.round(point.imageY)})</div>
                      <div>
                        {point.lat !== undefined && point.lng !== undefined
                          ? `Map: (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})`
                          : 'Map: Not set'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

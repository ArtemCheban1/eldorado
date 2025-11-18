"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamic import to avoid SSR issues with Leaflet
const GeoreferenceView = dynamic(() => import('@/components/GeoreferenceView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading georeferencing tool...</p>
      </div>
    </div>
  ),
});

export default function GeoreferencePage() {
  // For testing, using a sample archaeological map image
  // In production, this would come from a file upload or URL parameter
  const [imageUrl, setImageUrl] = useState<string>(
    // Sample archaeological map - replace with actual image URL or upload
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Forma_Urbis_Romae_1.jpg/1200px-Forma_Urbis_Romae_1.jpg'
  );
  const [imageName, setImageName] = useState<string>('Forma Urbis Romae');
  const [showUpload, setShowUpload] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setImageName(file.name);
          setShowUpload(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (showUpload || !imageUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Upload Archaeological Map</h1>
          <p className="text-gray-600 mb-6">
            Select an image file to georeference. You'll be able to add control points
            to align the image with real-world coordinates.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter image URL
            </label>
            <input
              type="text"
              placeholder="https://example.com/map.jpg"
              defaultValue={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              if (imageUrl) {
                setShowUpload(false);
              } else {
                alert('Please upload a file or enter an image URL');
              }
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Start Georeferencing
          </button>

          {imageUrl && (
            <button
              onClick={() => setShowUpload(false)}
              className="w-full mt-2 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <GeoreferenceView imageUrl={imageUrl} imageName={imageName} />
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-[2000]"
      >
        Change Image
      </button>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeoreferencePoint {
  imageX: number;
  imageY: number;
  lat: number;
  lng: number;
}

interface ImagePoint {
  x: number;
  y: number;
}

interface MapPoint {
  lat: number;
  lng: number;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface GeoreferenceViewProps {
  onBackToMap?: () => void;
}

export default function GeoreferenceView({ onBackToMap }: GeoreferenceViewProps = {}) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [georeferencePoints, setGeoreferencePoints] = useState<GeoreferencePoint[]>([]);
  const [pendingImagePoint, setPendingImagePoint] = useState<ImagePoint | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setPendingImagePoint({ x, y });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (pendingImagePoint) {
      const newPoint: GeoreferencePoint = {
        imageX: pendingImagePoint.x,
        imageY: pendingImagePoint.y,
        lat,
        lng,
      };
      setGeoreferencePoints(prev => [...prev, newPoint]);
      setPendingImagePoint(null);
    }
  }, [pendingImagePoint]);

  const handleClearPoints = useCallback(() => {
    setGeoreferencePoints([]);
    setPendingImagePoint(null);
  }, []);

  const handleRemoveLastPoint = useCallback(() => {
    setGeoreferencePoints(prev => prev.slice(0, -1));
  }, []);

  const mapPoints: MapPoint[] = georeferencePoints.map(p => ({ lat: p.lat, lng: p.lng }));

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Top Navigation Bar */}
      {onBackToMap && (
        <div className="absolute top-0 left-0 right-0 bg-gray-900 text-white p-3 z-[2000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMap}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Map
            </button>
            <h1 className="text-lg font-semibold">Georeference Image</h1>
          </div>
          <div className="text-sm text-gray-300">
            Points: {georeferencePoints.length}
          </div>
        </div>
      )}

      {/* Left Panel - Image Viewer */}
      <div className={`flex-1 flex flex-col overflow-hidden border-r border-gray-300 ${onBackToMap ? 'pt-14' : ''}`}>
        {/* Image Panel Header */}
        <div className="bg-gray-100 border-b border-gray-300 p-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Image View</h2>
            {imageDimensions && (
              <p className="text-xs text-gray-600">
                {imageDimensions.width} × {imageDimensions.height} px
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Image Container with Overflow Scroll */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {uploadedImage ? (
            <div className="relative inline-block min-w-full">
              <img
                ref={imageRef}
                src={uploadedImage}
                alt="Georeference"
                onClick={handleImageClick}
                className="cursor-crosshair block"
                style={{ maxWidth: 'none' }}
              />
              {/* Image Points Markers */}
              {georeferencePoints.map((point, idx) => {
                if (!imageRef.current) return null;
                const rect = imageRef.current.getBoundingClientRect();
                const scaleX = rect.width / imageRef.current.naturalWidth;
                const scaleY = rect.height / imageRef.current.naturalHeight;

                return (
                  <div
                    key={idx}
                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      left: `${point.imageX * scaleX}px`,
                      top: `${point.imageY * scaleY}px`,
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
              {/* Pending Point */}
              {pendingImagePoint && imageRef.current && (
                <div
                  className="absolute w-6 h-6 -ml-3 -mt-3 bg-yellow-500 border-2 border-white rounded-full shadow-lg animate-pulse"
                  style={{
                    left: `${pendingImagePoint.x * (imageRef.current.getBoundingClientRect().width / imageRef.current.naturalWidth)}px`,
                    top: `${pendingImagePoint.y * (imageRef.current.getBoundingClientRect().height / imageRef.current.naturalHeight)}px`,
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">Click "Upload Image" to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {uploadedImage && (
          <div className="bg-blue-50 border-t border-blue-200 p-3">
            <p className="text-sm text-blue-800">
              {pendingImagePoint
                ? "📍 Now click on the map to set the corresponding location"
                : "📌 Click on the image to mark a point, then click on the map to georeference it"
              }
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Points: {georeferencePoints.length}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel - Map Viewer */}
      <div className={`flex-1 flex flex-col overflow-hidden ${onBackToMap ? 'pt-14' : ''}`}>
        {/* Map Panel Header */}
        <div className="bg-gray-100 border-b border-gray-300 p-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Map View</h2>
          <div className="flex gap-2">
            {georeferencePoints.length > 0 && (
              <>
                <button
                  onClick={handleRemoveLastPoint}
                  className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                >
                  Remove Last
                </button>
                <button
                  onClick={handleClearPoints}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onMapClick={handleMapClick} />

            {/* Show markers for georeferenced points */}
            {mapPoints.map((point, idx) => (
              <Marker key={idx} position={[point.lat, point.lng]}>
                {/* You can add a popup here if needed */}
              </Marker>
            ))}
          </MapContainer>

          {/* Instruction overlay when pending */}
          {pendingImagePoint && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-lg z-[1000]">
              <p className="text-sm font-medium text-yellow-800">
                Click on the map to set the geographic location
              </p>
            </div>
          )}
        </div>

        {/* Map Info */}
        <div className="bg-gray-50 border-t border-gray-300 p-3">
          <p className="text-xs text-gray-600">
            Click on the map to georeference the selected image point
          </p>
        </div>
      </div>
    </div>
  );
}

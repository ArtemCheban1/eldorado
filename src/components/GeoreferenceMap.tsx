'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ReferencePoint } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeoreferenceMapProps {
  referencePoints: ReferencePoint[];
  onMapClick: (lat: number, lng: number) => void;
  selectedPointId?: string;
  center?: [number, number];
  zoom?: number;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function GeoreferenceMap({
  referencePoints,
  onMapClick,
  selectedPointId,
  center = [41.9028, 12.4964], // Default to Rome
  zoom = 13,
}: GeoreferenceMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Custom icons for different states
  const defaultIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const selectedIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDguMyAxMi41IDI4LjUgMTIuNSAyOC41czEyLjUtMjAuMiAxMi41LTI4LjVDMjUgNS42IDE5LjQgMCAxMi41IDB6bTAgMTcuNWMtMi44IDAtNS0yLjItNS01czIuMi01IDUtNSA1IDIuMiA1IDUtMi4yIDUtNSA1eiIgZmlsbD0iI2VmNDQ0NCIvPjwvc3ZnPg==',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs">
        <p className="font-semibold mb-1">Instructions:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on the map to add reference points</li>
          <li>• Zoom and pan to navigate</li>
          <li>• Match points with the image on the left</li>
        </ul>
      </div>

      {/* Points Counter */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold">
          Reference Points: <span className="text-blue-600">{referencePoints.length}</span>
        </p>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />

        {referencePoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.mapCoordinates.lat, point.mapCoordinates.lng]}
            icon={selectedPointId === point.id ? selectedIcon : defaultIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{point.label || `Point ${point.id}`}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Lat: {point.mapCoordinates.lat.toFixed(6)}
                  <br />
                  Lng: {point.mapCoordinates.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Image: ({Math.round(point.imageCoordinates.x)}, {Math.round(point.imageCoordinates.y)})
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

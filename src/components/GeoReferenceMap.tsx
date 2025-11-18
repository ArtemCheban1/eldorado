"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ControlPoint {
  id: string;
  imageX: number;
  imageY: number;
  lat?: number;
  lng?: number;
}

interface GeoReferenceMapProps {
  controlPoints: ControlPoint[];
  selectedPointId: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onPointSelect: (pointId: string) => void;
  onPointDelete: (pointId: string) => void;
}

export default function GeoReferenceMap({
  controlPoints,
  selectedPointId,
  onMapClick,
  onPointSelect,
  onPointDelete,
}: GeoReferenceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when control points change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const existingMarkers = markersRef.current;

    // Remove markers that no longer exist
    const currentPointIds = new Set(controlPoints.map(p => p.id));
    existingMarkers.forEach((marker, id) => {
      if (!currentPointIds.has(id)) {
        marker.remove();
        existingMarkers.delete(id);
      }
    });

    // Add or update markers
    controlPoints.forEach((point) => {
      if (point.lat === undefined || point.lng === undefined) {
        // Remove marker if coordinates are not set
        const marker = existingMarkers.get(point.id);
        if (marker) {
          marker.remove();
          existingMarkers.delete(point.id);
        }
        return;
      }

      let marker = existingMarkers.get(point.id);

      // Create custom icon based on selection state
      const isSelected = point.id === selectedPointId;
      const iconHtml = `
        <div style="
          width: ${isSelected ? '24px' : '16px'};
          height: ${isSelected ? '24px' : '16px'};
          background-color: ${isSelected ? '#facc15' : '#4ade80'};
          border: 3px solid ${isSelected ? '#ca8a04' : '#16a34a'};
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ${isSelected ? 'box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.3);' : ''}
          transform: translate(-50%, -50%);
        "></div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
        iconAnchor: [isSelected ? 12 : 8, isSelected ? 12 : 8],
      });

      if (marker) {
        // Update existing marker
        marker.setLatLng([point.lat, point.lng]);
        marker.setIcon(customIcon);
      } else {
        // Create new marker
        marker = L.marker([point.lat, point.lng], {
          icon: customIcon,
          draggable: false,
        }).addTo(map);

        // Bind popup
        const pointLabel = point.id.split('-')[1].slice(-4);
        marker.bindPopup(`
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Point ${pointLabel}</div>
            <div style="font-size: 12px; color: #666;">
              Image: (${Math.round(point.imageX)}, ${Math.round(point.imageY)})<br/>
              Map: (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})
            </div>
            <button
              onclick="window.dispatchEvent(new CustomEvent('delete-point', { detail: '${point.id}' }))"
              style="
                margin-top: 8px;
                padding: 4px 8px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
            >
              Delete Point
            </button>
          </div>
        `);

        // Handle marker clicks
        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onPointSelect(point.id);
        });

        existingMarkers.set(point.id, marker);
      }
    });

    // Center map on selected point if it exists
    if (selectedPointId) {
      const selectedPoint = controlPoints.find(p => p.id === selectedPointId);
      if (selectedPoint?.lat !== undefined && selectedPoint?.lng !== undefined) {
        map.setView([selectedPoint.lat, selectedPoint.lng], Math.max(map.getZoom(), 10), {
          animate: true,
        });
      }
    }
  }, [controlPoints, selectedPointId, onPointSelect]);

  // Handle delete point events from popup
  useEffect(() => {
    const handleDeletePoint = (e: Event) => {
      const customEvent = e as CustomEvent;
      onPointDelete(customEvent.detail);
    };

    window.addEventListener('delete-point', handleDeletePoint);

    return () => {
      window.removeEventListener('delete-point', handleDeletePoint);
    };
  }, [onPointDelete]);

  // Fit bounds to show all points
  const handleFitBounds = () => {
    if (!mapRef.current) return;

    const pointsWithCoords = controlPoints.filter(
      p => p.lat !== undefined && p.lng !== undefined
    );

    if (pointsWithCoords.length === 0) return;

    const bounds = L.latLngBounds(
      pointsWithCoords.map(p => [p.lat!, p.lng!])
    );

    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={handleFitBounds}
          className="block w-10 h-10 bg-white hover:bg-gray-100 text-gray-700 rounded transition-colors"
          title="Fit All Points"
          disabled={controlPoints.filter(p => p.lat !== undefined).length === 0}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 text-gray-800 text-sm p-3 rounded-lg shadow-lg max-w-xs z-[1000]">
        <div className="font-semibold mb-2">Controls:</div>
        <ul className="space-y-1 text-xs text-gray-700">
          <li>• <strong>Click</strong> on map to set coordinates</li>
          <li>• <strong>Click marker</strong> to select point</li>
          <li>• <strong>Scroll</strong> to zoom in/out</li>
          <li>• <strong>Drag</strong> to pan the map</li>
          <li>• <strong className="text-green-600">Green markers</strong> are control points</li>
          <li>• <strong className="text-yellow-600">Yellow marker</strong> is selected</li>
        </ul>
      </div>
    </div>
  );
}

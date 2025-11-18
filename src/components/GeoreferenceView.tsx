"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ControlPoint {
  id: string;
  imageX: number;
  imageY: number;
  lat?: number;
  lng?: number;
}

interface GeoreferenceViewProps {
  imageUrl: string;
  imageName?: string;
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

export default function GeoreferenceView({ imageUrl, imageName = "Archaeological Map" }: GeoreferenceViewProps) {
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [mode, setMode] = useState<'add' | 'select'>('add');
  const [awaitingMapClick, setAwaitingMapClick] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

  // Load image dimensions
  useEffect(() => {
    if (imageRef.current) {
      const updateDimensions = () => {
        if (imageRef.current) {
          setImageDimensions({
            width: imageRef.current.clientWidth,
            height: imageRef.current.clientHeight,
          });
        }
      };
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [imageUrl]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'add') {
      // Create new control point on image
      const newPoint: ControlPoint = {
        id: Date.now().toString(),
        imageX: x,
        imageY: y,
      };
      setControlPoints([...controlPoints, newPoint]);
      setSelectedPointId(newPoint.id);
      setAwaitingMapClick(newPoint.id);
    } else if (mode === 'select') {
      // Check if clicking near an existing point
      const clickedPoint = controlPoints.find(p => {
        const distance = Math.sqrt(Math.pow(p.imageX - x, 2) + Math.pow(p.imageY - y, 2));
        return distance < 15; // 15px tolerance
      });

      if (clickedPoint) {
        setSelectedPointId(clickedPoint.id);
      } else {
        setSelectedPointId(null);
      }
    }
  }, [mode, controlPoints]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (awaitingMapClick) {
      // Update the control point with map coordinates
      setControlPoints(points =>
        points.map(p =>
          p.id === awaitingMapClick
            ? { ...p, lat, lng }
            : p
        )
      );
      setAwaitingMapClick(null);
    } else if (mode === 'select') {
      // Allow selecting points on map too
      const clickedPoint = controlPoints.find(p => {
        if (!p.lat || !p.lng) return false;
        const distance = Math.sqrt(
          Math.pow(p.lat - lat, 2) + Math.pow(p.lng - lng, 2)
        );
        return distance < 0.001; // Small tolerance
      });

      if (clickedPoint) {
        setSelectedPointId(clickedPoint.id);
      }
    }
  }, [awaitingMapClick, mode, controlPoints]);

  const deleteSelectedPoint = useCallback(() => {
    if (selectedPointId) {
      setControlPoints(points => points.filter(p => p.id !== selectedPointId));
      setSelectedPointId(null);
      setAwaitingMapClick(null);
    }
  }, [selectedPointId]);

  const clearAllPoints = useCallback(() => {
    if (confirm('Are you sure you want to clear all control points?')) {
      setControlPoints([]);
      setSelectedPointId(null);
      setAwaitingMapClick(null);
    }
  }, []);

  const selectedPoint = controlPoints.find(p => p.id === selectedPointId);
  const completedPoints = controlPoints.filter(p => p.lat !== undefined && p.lng !== undefined);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Georeferencing: {imageName}</h1>
          <p className="text-sm text-gray-300">
            Control Points: {completedPoints.length} / {controlPoints.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode(mode === 'add' ? 'select' : 'add')}
            className={`px-4 py-2 rounded ${
              mode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {mode === 'add' ? 'Add Mode' : 'Select Mode'}
          </button>
          {selectedPointId && (
            <button
              onClick={deleteSelectedPoint}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
            >
              Delete Point
            </button>
          )}
          <button
            onClick={clearAllPoints}
            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Instructions */}
      {awaitingMapClick && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3">
          <p className="font-bold">Click on the map to set the geographic coordinates for this control point</p>
        </div>
      )}

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Image */}
        <div className="w-1/2 relative bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded shadow-lg z-10">
            <h3 className="font-bold text-sm">Archaeological Image</h3>
            <p className="text-xs text-gray-600">Click to add control points</p>
          </div>

          <div
            ref={imageContainerRef}
            className="relative cursor-crosshair"
            onClick={handleImageClick}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Archaeological map to georeference"
              className="max-w-full max-h-full object-contain"
              onLoad={() => {
                if (imageRef.current) {
                  setImageDimensions({
                    width: imageRef.current.clientWidth,
                    height: imageRef.current.clientHeight,
                  });
                }
              }}
            />

            {/* Control points on image */}
            {controlPoints.map(point => (
              <div
                key={point.id}
                className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  point.id === selectedPointId
                    ? 'bg-yellow-400 border-yellow-600 text-yellow-900'
                    : point.lat && point.lng
                    ? 'bg-green-400 border-green-600 text-green-900'
                    : 'bg-red-400 border-red-600 text-red-900'
                }`}
                style={{
                  left: `${point.imageX}px`,
                  top: `${point.imageY}px`,
                  transform: 'translate(-50%, -50%)',
                  cursor: mode === 'select' ? 'pointer' : 'default',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'select') {
                    setSelectedPointId(point.id);
                  }
                }}
              >
                {controlPoints.indexOf(point) + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Map */}
        <div className="w-1/2 relative">
          <div className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded shadow-lg z-[1000]">
            <h3 className="font-bold text-sm">Geographic Map</h3>
            <p className="text-xs text-gray-600">Click to set coordinates</p>
          </div>

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

            {/* Control points on map */}
            {controlPoints
              .filter(p => p.lat !== undefined && p.lng !== undefined)
              .map(point => (
                <Marker
                  key={point.id}
                  position={[point.lat!, point.lng!]}
                  eventHandlers={{
                    click: () => {
                      if (mode === 'select') {
                        setSelectedPointId(point.id);
                      }
                    },
                  }}
                >
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Point Info Panel */}
      {selectedPoint && (
        <div className="bg-gray-100 border-t border-gray-300 p-4">
          <h3 className="font-bold mb-2">
            Control Point #{controlPoints.indexOf(selectedPoint) + 1}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Image Coordinates:</p>
              <p className="font-mono">
                X: {selectedPoint.imageX.toFixed(2)}, Y: {selectedPoint.imageY.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Geographic Coordinates:</p>
              {selectedPoint.lat && selectedPoint.lng ? (
                <p className="font-mono">
                  Lat: {selectedPoint.lat.toFixed(6)}, Lng: {selectedPoint.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-orange-600 italic">Not set - click on map</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

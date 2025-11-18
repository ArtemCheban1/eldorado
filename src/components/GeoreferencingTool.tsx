"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ControlPoint, GeoreferencedLayer } from '@/types';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fit map bounds when control points change
function MapBoundsFitter({ controlPoints }: { controlPoints: ControlPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (controlPoints.length > 0) {
      const bounds = L.latLngBounds(
        controlPoints.map(cp => cp.mapCoords as [number, number])
      );

      // Add padding to the bounds
      const paddedBounds = bounds.pad(0.2);

      // Fit the map to show all control points
      map.fitBounds(paddedBounds, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [controlPoints, map]);

  return null;
}

export default function GeoreferencingTool() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [layerName, setLayerName] = useState('');
  const [layerDescription, setLayerDescription] = useState('');
  const [waitingForMap, setWaitingForMap] = useState(false);
  const [waitingForImage, setWaitingForImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Default map center
  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = url;

      // Reset control points when new image is uploaded
      setControlPoints([]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (waitingForImage && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to normalized coordinates (0-1)
      const normalizedX = x / rect.width;
      const normalizedY = y / rect.height;

      setWaitingForImage(false);
      setWaitingForMap(true);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (waitingForMap && imageRef.current) {
      // We need to get the last clicked image coordinates
      // For this implementation, we'll store them temporarily
      const rect = imageRef.current.getBoundingClientRect();

      // Since we can't easily access the last click, we'll add a visual indicator
      // For now, let's simplify: click image first, then map
      setControlPoints(prev => [
        ...prev,
        {
          imageCoords: [0, 0], // Will be set properly in the next iteration
          mapCoords: [lat, lng],
        }
      ]);
      setWaitingForMap(false);
    }
  }, [waitingForMap]);

  const addControlPoint = () => {
    setWaitingForImage(true);
    setWaitingForMap(false);
  };

  const addControlPointInteractive = (imageX: number, imageY: number) => {
    // Store temporary image coordinates
    const tempImageCoords: [number, number] = [imageX, imageY];

    // Show instruction to click on map
    setWaitingForMap(true);

    // Store in a ref or state to use when map is clicked
    (window as any).__tempImageCoords = tempImageCoords;
  };

  const handleMapClickWithTemp = useCallback((lat: number, lng: number) => {
    if (waitingForMap) {
      const tempCoords = (window as any).__tempImageCoords as [number, number] | undefined;

      if (tempCoords) {
        setControlPoints(prev => [
          ...prev,
          {
            imageCoords: tempCoords,
            mapCoords: [lat, lng],
          }
        ]);

        delete (window as any).__tempImageCoords;
        setWaitingForMap(false);
      }
    }
  }, [waitingForMap]);

  const handleImageClickNew = (e: React.MouseEvent<HTMLImageElement>) => {
    if (waitingForImage && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to image pixel coordinates
      const imageX = (x / rect.width) * (imageDimensions?.width || rect.width);
      const imageY = (y / rect.height) * (imageDimensions?.height || rect.height);

      // Store for next step
      addControlPointInteractive(imageX, imageY);
      setWaitingForImage(false);
    }
  };

  const removeControlPoint = (index: number) => {
    setControlPoints(prev => prev.filter((_, i) => i !== index));
  };

  const calculateBounds = (): [[number, number], [number, number]] | undefined => {
    if (controlPoints.length < 2) return undefined;

    const lats = controlPoints.map(cp => cp.mapCoords[0]);
    const lngs = controlPoints.map(cp => cp.mapCoords[1]);

    return [
      [Math.min(...lats), Math.min(...lngs)], // Southwest
      [Math.max(...lats), Math.max(...lngs)], // Northeast
    ];
  };

  const handleSave = async () => {
    if (!layerName.trim()) {
      alert('Please enter a layer name');
      return;
    }

    if (controlPoints.length < 3) {
      alert('Please add at least 3 control points for accurate georeferencing');
      return;
    }

    if (!imageFile) {
      alert('Please upload an image');
      return;
    }

    setSaving(true);

    try {
      // In a real implementation, you would upload the image to a storage service
      // For now, we'll use a placeholder URL
      const imageUrl = URL.createObjectURL(imageFile);

      const bounds = calculateBounds();

      const layerData: Partial<GeoreferencedLayer> = {
        name: layerName,
        description: layerDescription,
        imageUrl: imageUrl,
        controlPoints: controlPoints,
        bounds: bounds,
        opacity: 0.7,
        enabled: true,
      };

      await axios.post('/api/layers', layerData);

      alert('Georeferenced layer saved successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error saving layer:', error);
      alert('Failed to save layer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer Name *
            </label>
            <input
              type="text"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Historical Map 1850"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={layerDescription}
              onChange={(e) => setLayerDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imageFile ? 'Change Image' : 'Upload Image'}
            </label>
          </div>

          <button
            onClick={addControlPoint}
            disabled={!imageUrl || waitingForImage || waitingForMap}
            className={`px-4 py-2 rounded transition-colors ${
              waitingForImage || waitingForMap
                ? 'bg-yellow-500 text-white'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {waitingForImage
              ? '1. Click on Image...'
              : waitingForMap
              ? '2. Click on Map...'
              : 'Add Control Point'}
          </button>

          <div className="text-sm text-gray-600">
            Control Points: {controlPoints.length} (minimum 3 recommended)
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || controlPoints.length < 3 || !layerName.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Layer'}
            </button>
          </div>
        </div>

        {(waitingForImage || waitingForMap) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            {waitingForImage && '👆 Click on a point in the image (left)'}
            {waitingForMap && '👆 Click on the corresponding location on the map (right)'}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Image Panel */}
        <div className="flex-1 bg-gray-100 border-r overflow-auto">
          <div className="h-full flex flex-col">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
              Historical Image
            </div>
            <div
              ref={imageContainerRef}
              className="flex-1 flex items-center justify-center p-4 relative"
            >
              {imageUrl ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Uploaded map"
                    className={`max-w-full max-h-full object-contain ${
                      waitingForImage ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                    onClick={handleImageClickNew}
                  />
                  {/* Draw control points on image */}
                  {controlPoints.map((cp, index) => {
                    if (!imageRef.current || !imageDimensions) return null;

                    const rect = imageRef.current.getBoundingClientRect();
                    const containerRect = imageContainerRef.current?.getBoundingClientRect();

                    if (!containerRect) return null;

                    const x = (cp.imageCoords[0] / imageDimensions.width) * rect.width;
                    const y = (cp.imageCoords[1] / imageDimensions.height) * rect.height;

                    return (
                      <div
                        key={index}
                        className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:bg-red-600"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Remove this control point?')) {
                            removeControlPoint(index);
                          }
                        }}
                        title={`Control Point ${index + 1}\nClick to remove`}
                      >
                        {index + 1}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg">No image uploaded</p>
                  <p className="text-sm mt-2">Upload a historical map to begin georeferencing</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map Panel */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
              Map View {waitingForMap && '- Click to place control point'}
            </div>
            <div className="flex-1">
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

                <MapClickHandler onClick={handleMapClickWithTemp} />
                <MapBoundsFitter controlPoints={controlPoints} />

                {/* Render control point markers */}
                {controlPoints.map((cp, index) => (
                  <Marker
                    key={index}
                    position={cp.mapCoords as [number, number]}
                    icon={L.divIcon({
                      html: `<div style="background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                      className: '',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })}
                    eventHandlers={{
                      click: () => {
                        if (confirm(`Remove control point ${index + 1}?`)) {
                          removeControlPoint(index);
                        }
                      },
                    }}
                  />
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Control Points List */}
      {controlPoints.length > 0 && (
        <div className="bg-white border-t px-6 py-3 max-h-32 overflow-y-auto">
          <div className="text-sm font-medium text-gray-700 mb-2">Control Points:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {controlPoints.map((cp, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border"
              >
                <span className="font-bold text-red-600">#{index + 1}</span>
                <span className="text-gray-600">
                  Img: ({Math.round(cp.imageCoords[0])}, {Math.round(cp.imageCoords[1])})
                </span>
                <span className="text-gray-600">
                  Map: ({cp.mapCoords[0].toFixed(4)}, {cp.mapCoords[1].toFixed(4)})
                </span>
                <button
                  onClick={() => removeControlPoint(index)}
                  className="ml-auto text-red-600 hover:text-red-800"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

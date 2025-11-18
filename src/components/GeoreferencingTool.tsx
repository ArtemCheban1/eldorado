'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint, GeoreferencedLayer } from '@/types';
import { calculateImageBounds, calculateResidualError } from '@/lib/georeferencing';
import axios from 'axios';

interface GeoreferencingToolProps {
  onClose: () => void;
  onSave: (layer: GeoreferencedLayer) => void;
  onMapClick?: (callback: (lat: number, lng: number) => void) => void;
}

type PlacementMode = 'none' | 'image' | 'map';

export default function GeoreferencingTool({
  onClose,
  onSave,
  onMapClick
}: GeoreferencingToolProps) {
  const [layerName, setLayerName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [placementMode, setPlacementMode] = useState<PlacementMode>('none');
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
        setUploadedImage(e.target?.result as string);
        setError(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle click on image to place control point
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (placementMode !== 'image' || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageWidth / rect.width;
    const scaleY = imageHeight / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (currentPointId) {
      // Update existing point
      setControlPoints(prev =>
        prev.map(p =>
          p.id === currentPointId
            ? { ...p, imageCoordinates: { x, y } }
            : p
        )
      );
      setPlacementMode('map');
    }
  };

  // Add a new control point
  const addControlPoint = () => {
    if (controlPoints.length >= 6) {
      setError('Maximum 6 control points allowed');
      return;
    }

    const newPoint: ControlPoint = {
      id: `cp-${Date.now()}`,
      imageCoordinates: { x: 0, y: 0 },
      mapCoordinates: { lat: 0, lng: 0 }
    };

    setControlPoints(prev => [...prev, newPoint]);
    setCurrentPointId(newPoint.id);
    setPlacementMode('image');
    setError(null);
  };

  // Remove a control point
  const removeControlPoint = (id: string) => {
    setControlPoints(prev => prev.filter(p => p.id !== id));
    if (currentPointId === id) {
      setCurrentPointId(null);
      setPlacementMode('none');
    }
  };

  // Handle map click to set geographic coordinates
  useEffect(() => {
    if (placementMode === 'map' && currentPointId && onMapClick) {
      onMapClick((lat: number, lng: number) => {
        setControlPoints(prev =>
          prev.map(p =>
            p.id === currentPointId
              ? { ...p, mapCoordinates: { lat, lng } }
              : p
          )
        );
        setPlacementMode('none');
        setCurrentPointId(null);
      });
    }
  }, [placementMode, currentPointId, onMapClick]);

  // Save georeferenced layer
  const handleSave = async () => {
    // Validation
    if (!layerName.trim()) {
      setError('Please enter a layer name');
      return;
    }

    if (!uploadedImage) {
      setError('Please upload an image');
      return;
    }

    if (controlPoints.length < 3) {
      setError('Please add at least 3 control points');
      return;
    }

    // Check if all control points have been placed on both image and map
    const incompletePoints = controlPoints.filter(
      p => p.imageCoordinates.x === 0 && p.imageCoordinates.y === 0 ||
           p.mapCoordinates.lat === 0 && p.mapCoordinates.lng === 0
    );

    if (incompletePoints.length > 0) {
      setError('Please place all control points on both the image and map');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculate bounds
      const bounds = calculateImageBounds(imageWidth, imageHeight, controlPoints);

      // Create layer object
      const layer: Omit<GeoreferencedLayer, '_id' | 'dateCreated' | 'dateUpdated'> = {
        id: `layer-${Date.now()}`,
        name: layerName,
        description,
        imageUrl: uploadedImage,
        imageWidth,
        imageHeight,
        controlPoints,
        bounds,
        opacity,
        visible: true
      };

      // Save to backend
      const response = await axios.post('/api/georeferenced-layers', layer);

      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Failed to save georeferenced layer:', err);
      setError('Failed to save layer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPointStatus = (point: ControlPoint) => {
    const hasImageCoords = point.imageCoordinates.x !== 0 || point.imageCoordinates.y !== 0;
    const hasMapCoords = point.mapCoordinates.lat !== 0 || point.mapCoordinates.lng !== 0;

    if (hasImageCoords && hasMapCoords) return 'complete';
    if (hasImageCoords) return 'image-only';
    if (hasMapCoords) return 'map-only';
    return 'empty';
  };

  const residualError = controlPoints.length >= 3 ? calculateResidualError(controlPoints) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Georeference Map Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Image Upload and Preview */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layer Name *
                </label>
                <input
                  type="text"
                  value={layerName}
                  onChange={(e) => setLayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Historical Map 1920"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Map Image *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors text-gray-600 hover:text-blue-600"
                >
                  {uploadedImage ? 'Change Image' : 'Click to Upload Image'}
                </button>
              </div>

              {uploadedImage && (
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                    <p className="text-sm font-medium text-gray-700">
                      Click on image to place control points
                      {placementMode === 'image' && (
                        <span className="ml-2 text-blue-600">
                          (Click to place point {controlPoints.findIndex(p => p.id === currentPointId) + 1})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="relative bg-gray-50 p-4 max-h-96 overflow-auto">
                    <img
                      ref={imageRef}
                      src={uploadedImage}
                      alt="Map to georeference"
                      onClick={handleImageClick}
                      className={`max-w-full h-auto ${placementMode === 'image' ? 'cursor-crosshair' : 'cursor-default'}`}
                    />
                    {/* Show control points on image */}
                    {imageRef.current && controlPoints.map((point, index) => {
                      const rect = imageRef.current!.getBoundingClientRect();
                      const scaleX = rect.width / imageWidth;
                      const scaleY = rect.height / imageHeight;
                      const status = getPointStatus(point);

                      if (point.imageCoordinates.x === 0 && point.imageCoordinates.y === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={point.id}
                          className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg"
                          style={{
                            left: `${point.imageCoordinates.x * scaleX + 16}px`,
                            top: `${point.imageCoordinates.y * scaleY + 16}px`,
                            backgroundColor: status === 'complete' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layer Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right Column: Control Points */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Control Points</h3>
                <button
                  onClick={addControlPoint}
                  disabled={controlPoints.length >= 6 || !uploadedImage}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Add Point
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong>
                  <br />
                  1. Upload a map image
                  <br />
                  2. Click "Add Point" to create a control point
                  <br />
                  3. Click on the image to place the point
                  <br />
                  4. Click on the main map to set its geographic location
                  <br />
                  5. Repeat for at least 3 points (up to 6)
                  <br />
                  6. Click "Save Layer" when done
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {controlPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No control points yet. Click "Add Point" to start.
                  </div>
                ) : (
                  controlPoints.map((point, index) => {
                    const status = getPointStatus(point);
                    return (
                      <div
                        key={point.id}
                        className={`border rounded-md p-3 ${
                          currentPointId === point.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">Point {index + 1}</h4>
                          <button
                            onClick={() => removeControlPoint(point.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium">Image:</p>
                            <p className={`${status === 'empty' || status === 'map-only' ? 'text-gray-400' : 'text-gray-900'}`}>
                              {point.imageCoordinates.x === 0 && point.imageCoordinates.y === 0
                                ? 'Not set'
                                : `(${Math.round(point.imageCoordinates.x)}, ${Math.round(point.imageCoordinates.y)})`}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Map:</p>
                            <p className={`${status === 'empty' || status === 'image-only' ? 'text-gray-400' : 'text-gray-900'}`}>
                              {point.mapCoordinates.lat === 0 && point.mapCoordinates.lng === 0
                                ? 'Not set'
                                : `(${point.mapCoordinates.lat.toFixed(5)}, ${point.mapCoordinates.lng.toFixed(5)})`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          {status === 'complete' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Complete
                            </span>
                          )}
                          {status === 'image-only' && (
                            <button
                              onClick={() => {
                                setCurrentPointId(point.id);
                                setPlacementMode('map');
                              }}
                              className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
                            >
                              Click map to set location
                            </button>
                          )}
                          {status === 'map-only' && (
                            <button
                              onClick={() => {
                                setCurrentPointId(point.id);
                                setPlacementMode('image');
                              }}
                              className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
                            >
                              Click image to set position
                            </button>
                          )}
                          {status === 'empty' && (
                            <button
                              onClick={() => {
                                setCurrentPointId(point.id);
                                setPlacementMode('image');
                              }}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                            >
                              Start placing point
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {controlPoints.length >= 3 && residualError > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Residual Error (RMSE):</strong> {residualError.toFixed(2)} meters
                    <br />
                    <span className="text-xs text-gray-500">
                      Lower is better. Values under 10m are generally good.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || controlPoints.length < 3 || !layerName.trim() || !uploadedImage}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Layer'}
          </button>
        </div>
      </div>
    </div>
  );
}

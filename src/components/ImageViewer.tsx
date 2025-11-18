"use client";

import { useRef, useState, useEffect, useCallback } from 'react';

interface ControlPoint {
  id: string;
  imageX: number;
  imageY: number;
  lat?: number;
  lng?: number;
}

interface ImageViewerProps {
  imageUrl: string;
  controlPoints: ControlPoint[];
  selectedPointId: string | null;
  onImageClick: (x: number, y: number) => void;
  onPointSelect: (pointId: string) => void;
  onPointDelete: (pointId: string) => void;
}

export default function ImageViewer({
  imageUrl,
  controlPoints,
  selectedPointId,
  onImageClick,
  onPointSelect,
  onPointDelete,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Load image dimensions
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      // Reset view when new image loads
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Handle wheel event for zooming - FIX: Use non-passive event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta * 0.5), 5);

      // Zoom towards mouse position
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleRatio = newScale / scale;
      const newX = mouseX - (mouseX - position.x) * scaleRatio;
      const newY = mouseY - (mouseY - position.y) * scaleRatio;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    };

    // Add event listener with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse button or shift+left click for panning
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || e.shiftKey || e.button === 1 || e.button === 2) {
      return; // Don't add point if we were dragging or using pan mode
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !imageRef.current) return;

    // Calculate click position relative to the image
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Transform to image coordinates
    const imageX = (clickX - position.x) / scale;
    const imageY = (clickY - position.y) / scale;

    // Check if click is within image bounds
    if (imageX >= 0 && imageX <= imageDimensions.width && imageY >= 0 && imageY <= imageDimensions.height) {
      onImageClick(imageX, imageY);
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={handleZoomIn}
          className="block w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="block w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          className="block w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <div className="text-white text-xs text-center pt-2 border-t border-gray-700">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-crosshair relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="relative inline-block"
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Georeference target"
            onLoad={handleImageLoad}
            draggable={false}
            className="max-w-none select-none"
          />

          {/* Control Points */}
          {controlPoints.map((point) => (
            <div
              key={point.id}
              className={`absolute w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${
                selectedPointId === point.id
                  ? 'bg-yellow-400 border-yellow-600 ring-4 ring-yellow-400 ring-opacity-50 w-6 h-6'
                  : point.lat !== undefined && point.lng !== undefined
                  ? 'bg-green-400 border-green-600'
                  : 'bg-red-400 border-red-600'
              }`}
              style={{
                left: `${point.imageX}px`,
                top: `${point.imageY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPointSelect(point.id);
              }}
              title={`Point ${point.id.split('-')[1].slice(-4)}\nImage: (${Math.round(point.imageX)}, ${Math.round(point.imageY)})\nMap: ${
                point.lat !== undefined && point.lng !== undefined ? `(${point.lat.toFixed(6)}, ${point.lng.toFixed(6)})` : 'Not set'
              }`}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {point.id.split('-')[1].slice(-4)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
        <div className="font-semibold mb-2">Controls:</div>
        <ul className="space-y-1 text-xs text-gray-300">
          <li>• <strong>Click</strong> to add/edit control point</li>
          <li>• <strong>Scroll</strong> to zoom in/out</li>
          <li>• <strong>Shift+Drag</strong> or <strong>Middle-Click+Drag</strong> to pan</li>
          <li>• <strong className="text-green-400">Green points</strong> have map coordinates</li>
          <li>• <strong className="text-red-400">Red points</strong> need map coordinates</li>
          <li>• <strong className="text-yellow-400">Yellow point</strong> is selected</li>
        </ul>
      </div>
    </div>
  );
}

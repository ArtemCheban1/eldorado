'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ReferencePoint } from '@/types';

interface ImageViewerProps {
  imageUrl: string;
  referencePoints: ReferencePoint[];
  onImageClick: (x: number, y: number) => void;
  selectedPointId?: string;
}

export default function ImageViewer({
  imageUrl,
  referencePoints,
  onImageClick,
  selectedPointId,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
  }, [imageUrl]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
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

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDragging && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      onImageClick(x, y);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={zoomIn}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={resetZoom}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs"
          title="Reset Zoom"
        >
          1:1
        </button>
        <button
          onClick={zoomOut}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-semibold">
        {Math.round(scale * 100)}%
      </div>

      {/* Image Container */}
      <div
        className="w-full h-full flex items-center justify-center cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            position: 'relative',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Historical map"
            className="max-w-none cursor-crosshair"
            style={{ userSelect: 'none', pointerEvents: 'auto' }}
            onClick={handleImageClick}
            draggable={false}
          />

          {/* Reference Points */}
          {referencePoints.map((point) => (
            <div
              key={point.id}
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 ${
                selectedPointId === point.id
                  ? 'bg-red-500 border-white'
                  : 'bg-blue-500 border-white'
              } shadow-lg cursor-pointer hover:scale-150 transition-transform`}
              style={{
                left: `${point.imageCoordinates.x}px`,
                top: `${point.imageCoordinates.y}px`,
              }}
              title={point.label || `Point ${point.id}`}
            >
              {point.label && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                  {point.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs">
        <p className="font-semibold mb-1">Instructions:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on the image to add reference points</li>
          <li>• Scroll to zoom in/out</li>
          <li>• Drag to pan the image</li>
        </ul>
      </div>
    </div>
  );
}

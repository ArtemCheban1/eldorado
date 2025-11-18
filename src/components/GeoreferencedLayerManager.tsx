'use client';

import React, { useState, useEffect } from 'react';
import { GeoreferencedLayer } from '@/types';
import axios from 'axios';

interface GeoreferencedLayerManagerProps {
  layers: GeoreferencedLayer[];
  onLayersUpdate: () => void;
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

export default function GeoreferencedLayerManager({
  layers,
  onLayersUpdate,
  onLayerToggle,
  onLayerOpacityChange
}: GeoreferencedLayerManagerProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [deletingLayer, setDeletingLayer] = useState<string | null>(null);

  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const handleDeleteLayer = async (layerId: string) => {
    if (!confirm('Are you sure you want to delete this georeferenced layer?')) {
      return;
    }

    setDeletingLayer(layerId);
    try {
      await axios.delete(`/api/georeferenced-layers/${layerId}`);
      onLayersUpdate();
    } catch (error) {
      console.error('Failed to delete layer:', error);
      alert('Failed to delete layer. Please try again.');
    } finally {
      setDeletingLayer(null);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No georeferenced layers yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {layers.map((layer) => {
        const isExpanded = expandedLayers.has(layer.id);
        const isDeleting = deletingLayer === layer.id;

        return (
          <div
            key={layer.id}
            className="border border-gray-300 rounded-md bg-white overflow-hidden"
          >
            {/* Layer Header */}
            <div className="flex items-center gap-2 p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <button
                onClick={() => toggleLayerExpanded(layer.id)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-900 text-sm">{layer.name}</span>
              </button>
              <button
                onClick={() => handleDeleteLayer(layer.id)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                title="Delete layer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Layer Details (Expanded) */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-3 bg-gray-50 space-y-3">
                {layer.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Description</p>
                    <p className="text-sm text-gray-800">{layer.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Opacity: {Math.round(layer.opacity * 100)}%
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => onLayerOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Control Points</p>
                    <p className="font-medium text-gray-900">{layer.controlPoints.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Image Size</p>
                    <p className="font-medium text-gray-900">
                      {layer.imageWidth} × {layer.imageHeight}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(layer.dateCreated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

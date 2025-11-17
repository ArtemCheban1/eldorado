"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMapLayers } from '@/context/MapLayersContext';
import { GeoreferencedLayer } from '@/types';
import GeoreferencedLayerManager from './GeoreferencedLayerManager';
import ImportKMLModal from './ImportKMLModal';

interface LeftSidebarProps {
  onDataRefresh?: () => void;
  georeferencedLayers: GeoreferencedLayer[];
  onOpenGeoreferencingTool: () => void;
  onLayersUpdate: () => void;
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

export default function LeftSidebar({
  onDataRefresh,
  georeferencedLayers,
  onOpenGeoreferencingTool,
  onLayersUpdate,
  onLayerToggle,
  onLayerOpacityChange
}: LeftSidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const { layers, toggleLayerVisibility, setLayerOpacity } = useMapLayers();
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-16'
      } flex flex-col shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isExpanded && (
          <h2 className="text-xl font-bold">Tools</h2>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Tools Section */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Tools</h3>

            {/* Map Layers */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Map Layers</h4>
              <div className="space-y-4">
                {layers.map((layer) => (
                  <div key={layer.id} className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => toggleLayerVisibility(layer.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{layer.name}</span>
                    </label>
                    {layer.visible && (
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Opacity</span>
                          <span>{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={layer.opacity * 100}
                          onChange={(e) =>
                            setLayerOpacity(layer.id, parseInt(e.target.value) / 100)
                          }
                          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Point Categories */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm">Archaeological Sites</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span className="text-sm">Findings</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm">Points of Interest</span>
                </label>
              </div>
            </div>

            {/* Georeferenced Layers */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Georeferenced Layers</h4>
                <button
                  onClick={onOpenGeoreferencingTool}
                  className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                  title="Add georeferenced map"
                >
                  + Add
                </button>
              </div>
              <GeoreferencedLayerManager
                layers={georeferencedLayers}
                onLayersUpdate={onLayersUpdate}
                onLayerToggle={onLayerToggle}
                onLayerOpacityChange={onLayerOpacityChange}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={onOpenGeoreferencingTool}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
              >
                Georeference Map
              </button>
              <button
                onClick={() => router.push('/georeference')}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
              >
                Georeference (Separate Page)
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
              >
                Import KML File
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium">
                Add New Site
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium">
                Upload Photos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Icons */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          <button className="p-3 hover:bg-gray-800 rounded transition-colors" title="Layers">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="p-3 hover:bg-gray-800 rounded transition-colors"
            title="Import KML"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      )}

      {/* Import Modal */}
      <ImportKMLModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          onDataRefresh?.();
        }}
      />
    </aside>
  );
}

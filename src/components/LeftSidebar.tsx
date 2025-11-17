"use client";

import { useState } from 'react';

interface LeftSidebarProps {
  onShowFilters: () => void;
}

export default function LeftSidebar({ onShowFilters }: LeftSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-16'
      } flex flex-col shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isExpanded && (
          <h2 className="text-xl font-bold">El Dorado</h2>
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
              <h4 className="text-sm font-medium mb-2">Map Layers</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">OpenStreetMap</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Google Maps</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Historical Overlay</span>
                </label>
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

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={onShowFilters}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters & Search
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium">
                Import Points
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
          <button className="p-3 hover:bg-gray-800 rounded transition-colors" title="Import">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}

"use client";

import { useState } from 'react';

interface SiteDetail {
  name: string;
  type: string;
  coordinates: string;
  description: string;
  dateDiscovered?: string;
  artifacts?: number;
  photos?: string[];
}

export default function RightSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSite, setSelectedSite] = useState<SiteDetail | null>({
    name: 'Archaeological Site Alpha',
    type: 'Archaeological Area',
    coordinates: '41.9028°N, 12.4964°E',
    description: 'Ancient Roman ruins discovered in 2023. This site contains well-preserved structures from the Imperial period, including what appears to be a forum and several residential buildings.',
    dateDiscovered: '2023-06-15',
    artifacts: 47,
    photos: [],
  });

  return (
    <aside
      className={`bg-white border-l border-gray-200 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-16'
      } flex flex-col shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {isExpanded && (
          <h2 className="text-lg font-bold text-gray-900">Details</h2>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          {selectedSite ? (
            <div className="space-y-6">
              {/* Site Name */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedSite.name}
                </h3>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {selectedSite.type}
                </span>
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase">Coordinates</p>
                  <p className="text-gray-900">{selectedSite.coordinates}</p>
                </div>

                {selectedSite.dateDiscovered && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase">Date Discovered</p>
                    <p className="text-gray-900">{selectedSite.dateDiscovered}</p>
                  </div>
                )}

                {selectedSite.artifacts !== undefined && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase">Artifacts Found</p>
                    <p className="text-gray-900">{selectedSite.artifacts}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</p>
                <p className="text-gray-700 leading-relaxed">
                  {selectedSite.description}
                </p>
              </div>

              {/* Photos Section */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase mb-3">Photos</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No photos uploaded yet</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                    Upload Photos
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors">
                  Edit Details
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                  Export Data
                </button>
                <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors">
                  Delete Site
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p>Select a site on the map to view details</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          <button className="p-3 hover:bg-gray-100 rounded transition-colors" title="Details">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}

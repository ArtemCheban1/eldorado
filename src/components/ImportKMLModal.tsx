'use client';

import { useState } from 'react';
import axios from 'axios';

interface PreviewData {
  total: number;
  pointsCount: number;
  areasCount: number;
  preview: Array<{
    name: string;
    type: 'point' | 'area';
    coordinates: [number, number];
    radius?: number;
    description?: string;
  }>;
}

interface DuplicateInfo {
  count: number;
  items: Array<{
    newSite: {
      name: string;
      coordinates: [number, number];
      type: string;
    };
    existingSite: {
      name: string;
      coordinates: [number, number];
      type: string;
    };
    distance: number;
  }>;
}

interface ImportKMLModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function ImportKMLModal({ isOpen, onClose, onImportComplete }: ImportKMLModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateInfo | null>(null);
  const [uniqueCount, setUniqueCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.kml')) {
        setError('Please select a .kml file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPreviewData(null);
      setDuplicates(null);
      setSuccessMessage(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreviewData(response.data.preview);
      setDuplicates(response.data.duplicates);
      setUniqueCount(response.data.uniqueCount);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to preview KML file');
      } else {
        setError('Failed to preview KML file');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', skipDuplicates.toString());

      const response = await axios.post('/api/import/execute', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(response.data.message);

      // Reset state after successful import
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to import KML file');
      } else {
        setError('Failed to import KML file');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setDuplicates(null);
    setError(null);
    setSuccessMessage(null);
    setSkipDuplicates(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Import KML File</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select KML File
            </label>
            <input
              type="file"
              accept=".kml"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          {/* Preview Button */}
          {file && !previewData && (
            <button
              onClick={handlePreview}
              disabled={isLoading}
              className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading Preview...' : 'Preview Import'}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sites</p>
                  <p className="text-2xl font-bold text-blue-600">{previewData.total}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Points</p>
                  <p className="text-2xl font-bold text-orange-600">{previewData.pointsCount}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Areas</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.areasCount}</p>
                </div>
              </div>

              {/* Duplicates Warning */}
              {duplicates && duplicates.count > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {duplicates.count} Potential Duplicate{duplicates.count > 1 ? 's' : ''} Found
                      </h3>
                      <p className="mt-2 text-sm text-yellow-700">
                        Found {duplicates.count} site{duplicates.count > 1 ? 's' : ''} within 10 meters of existing locations.
                        {uniqueCount > 0 && ` ${uniqueCount} unique site${uniqueCount > 1 ? 's' : ''} will be imported.`}
                      </p>
                      <div className="mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={skipDuplicates}
                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-yellow-800">
                            Skip duplicate sites (recommended)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Preview (First 10 Rows)
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Radius
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.preview.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.type === 'area'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.coordinates[0].toFixed(6)}, {item.coordinates[1].toFixed(6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.radius ? `${item.radius}m` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.total > 10 && (
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Showing 10 of {previewData.total} total sites
                  </p>
                )}
              </div>

              {/* Import Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : `Import ${skipDuplicates ? uniqueCount : previewData.total} Site${(skipDuplicates ? uniqueCount : previewData.total) !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

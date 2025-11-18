"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArchaeologicalSite, PointerType, GeoreferencedLayer } from '@/types';
import PointerForm from './PointerForm';
import GeoreferencedImageOverlay from './GeoreferencedImageOverlay';
import axios from 'axios';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom colored icons for different pointer types
const createColoredIcon = (color: string) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="${color}" stroke="#000" stroke-width="1" d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.97-4.03-9-9-9zm0 12.75c-2.07 0-3.75-1.68-3.75-3.75S9.93 5.25 12 5.25s3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z"/>
    </svg>
  `;
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
};

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapViewProps {
  sites: ArchaeologicalSite[];
  onSitesChange: () => void;
}

export default function MapView({ sites, onSitesChange }: MapViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPointer, setSelectedPointer] = useState<ArchaeologicalSite | null>(null);
  const [clickedCoordinates, setClickedCoordinates] = useState<[number, number] | null>(null);
  const [isAddMode, setIsAddMode] = useState(true); // Toggle to enable/disable adding pointers
  const [georeferencedLayers, setGeoreferencedLayers] = useState<GeoreferencedLayer[]>([]);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Default center (you can change this)
  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

  // Fetch georeferenced layers
  const fetchLayers = useCallback(async () => {
    try {
      const response = await axios.get('/api/layers');
      const layers = response.data.layers || [];
      setGeoreferencedLayers(layers);
    } catch (error) {
      console.error('Error fetching layers:', error);
    }
  }, []);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  const toggleLayerVisibility = async (layerId: string) => {
    const layer = georeferencedLayers.find(l => l.id === layerId || l._id === layerId);
    if (!layer) return;

    const updatedEnabled = !layer.enabled;

    try {
      await axios.put(`/api/layers/${layer._id || layer.id}`, {
        enabled: updatedEnabled,
      });

      setGeoreferencedLayers(prev =>
        prev.map(l =>
          (l.id === layerId || l._id === layerId)
            ? { ...l, enabled: updatedEnabled }
            : l
        )
      );
    } catch (error) {
      console.error('Error updating layer:', error);
    }
  };

  const updateLayerOpacity = async (layerId: string, opacity: number) => {
    const layer = georeferencedLayers.find(l => l.id === layerId || l._id === layerId);
    if (!layer) return;

    try {
      await axios.put(`/api/layers/${layer._id || layer.id}`, {
        opacity,
      });

      setGeoreferencedLayers(prev =>
        prev.map(l =>
          (l.id === layerId || l._id === layerId)
            ? { ...l, opacity }
            : l
        )
      );
    } catch (error) {
      console.error('Error updating layer opacity:', error);
    }
  };

  const deleteLayer = async (layerId: string) => {
    if (!confirm('Are you sure you want to delete this layer?')) return;

    const layer = georeferencedLayers.find(l => l.id === layerId || l._id === layerId);
    if (!layer) return;

    try {
      await axios.delete(`/api/layers/${layer._id || layer.id}`);
      setGeoreferencedLayers(prev =>
        prev.filter(l => l.id !== layerId && l._id !== layerId)
      );
    } catch (error) {
      console.error('Error deleting layer:', error);
      alert('Failed to delete layer');
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddMode) {
      setClickedCoordinates([lat, lng]);
      setSelectedPointer(null);
      setShowForm(true);
    }
  };

  const handleMarkerClick = (site: ArchaeologicalSite) => {
    setSelectedPointer(site);
    setClickedCoordinates(site.coordinates);
    setShowForm(true);
  };

  const handleSavePointer = async (pointerData: Partial<ArchaeologicalSite>) => {
    try {
      if (selectedPointer?._id) {
        // Update existing pointer
        await axios.put(`/api/sites/${selectedPointer._id}`, pointerData);
      } else {
        // Create new pointer
        await axios.post('/api/sites', pointerData);
      }
      onSitesChange();
      setShowForm(false);
      setSelectedPointer(null);
      setClickedCoordinates(null);
    } catch (error) {
      console.error('Error saving pointer:', error);
      alert('Failed to save pointer. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedPointer(null);
    setClickedCoordinates(null);
  };

  const getColor = (type: PointerType) => {
    switch (type) {
      case 'info_pointer':
        return '#3b82f6'; // Blue
      case 'findings_pointer':
        return '#f59e0b'; // Orange
      case 'search_location':
        return '#8b5cf6'; // Purple
      case 'archaeological_area':
        return '#ef4444'; // Red
      case 'finding':
        return '#f59e0b'; // Orange
      case 'point_of_interest':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  const getPointerTypeLabel = (type: PointerType) => {
    const labels: Record<PointerType, string> = {
      info_pointer: 'Info',
      findings_pointer: 'Findings',
      search_location: 'Search Location',
      archaeological_area: 'Archaeological Area',
      finding: 'Finding',
      point_of_interest: 'Point of Interest',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="h-full w-full relative">
        {/* Control Panel */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Add Mode Toggle */}
          <div className="bg-white rounded-lg shadow-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAddMode}
                onChange={(e) => setIsAddMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                {isAddMode ? 'Click to Add Pointers' : 'View Only Mode'}
              </span>
            </label>
          </div>

          {/* Layers Toggle */}
          <button
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span className="text-sm font-medium">Layers ({georeferencedLayers.length})</span>
          </button>
        </div>

        {/* Layers Panel */}
        {showLayersPanel && (
          <div className="absolute top-4 right-4 mt-32 z-[1000] w-80 bg-white rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col">
            <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Georeferenced Layers</h3>
              <button
                onClick={() => setShowLayersPanel(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {georeferencedLayers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No georeferenced layers yet</p>
                  <a
                    href="/georeferencing"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Create your first layer →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {georeferencedLayers.map((layer) => (
                    <div
                      key={layer._id || layer.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={layer.enabled}
                          onChange={() => toggleLayerVisibility(layer._id || layer.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{layer.name}</div>
                          {layer.description && (
                            <div className="text-xs text-gray-600 truncate">{layer.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {layer.controlPoints.length} control points
                          </div>
                        </div>
                        <button
                          onClick={() => deleteLayer(layer._id || layer.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete layer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {layer.enabled && (
                        <div className="mt-2">
                          <label className="text-xs text-gray-600 block mb-1">
                            Opacity: {Math.round((layer.opacity || 0.7) * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(layer.opacity || 0.7) * 100}
                            onChange={(e) =>
                              updateLayerOpacity(
                                layer._id || layer.id,
                                parseInt(e.target.value) / 100
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {/* Render georeferenced image overlays */}
          {georeferencedLayers
            .filter(layer => layer.enabled)
            .map((layer) => (
              <GeoreferencedImageOverlay
                key={layer._id || layer.id}
                layer={layer}
              />
            ))}

          {sites.map((site) => {
            const color = getColor(site.type);
            const customIcon = createColoredIcon(color);

            return (
              <div key={site.id || site._id}>
                {site.type === 'archaeological_area' && site.radius > 100 ? (
                  <Circle
                    center={site.coordinates}
                    radius={site.radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.3,
                    }}
                    eventHandlers={{
                      click: () => handleMarkerClick(site),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {getPointerTypeLabel(site.type)}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{site.name}</h3>

                        {site.timespan && (
                          <p className="text-xs text-gray-600 mb-1">
                            Period: {site.timespan.period}
                            {site.timespan.startYear && site.timespan.endYear &&
                              ` (${site.timespan.startYear} - ${site.timespan.endYear})`
                            }
                          </p>
                        )}

                        {site.categories && site.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {site.categories.map(cat => (
                              <span
                                key={cat.id}
                                className="px-2 py-0.5 rounded-full text-xs text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {site.tags && site.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {site.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mb-1">{site.description || site.info}</p>

                        {site.findings && site.findings.length > 0 && (
                          <p className="text-xs text-gray-500">Findings: {site.findings.length}</p>
                        )}

                        <p className="text-xs text-gray-500">Radius: {site.radius}m</p>

                        <button
                          onClick={() => handleMarkerClick(site)}
                          className="mt-2 w-full bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Edit Details
                        </button>
                      </div>
                    </Popup>
                  </Circle>
                ) : (
                  <Marker
                    position={site.coordinates}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => handleMarkerClick(site),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {getPointerTypeLabel(site.type)}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{site.name}</h3>

                        {site.timespan && (
                          <p className="text-xs text-gray-600 mb-1">
                            Period: {site.timespan.period}
                            {site.timespan.startYear && site.timespan.endYear &&
                              ` (${site.timespan.startYear} - ${site.timespan.endYear})`
                            }
                          </p>
                        )}

                        {site.categories && site.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {site.categories.map(cat => (
                              <span
                                key={cat.id}
                                className="px-2 py-0.5 rounded-full text-xs text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {site.tags && site.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {site.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mb-1">{site.description || site.info}</p>

                        {site.searchPriority && (
                          <p className="text-xs text-gray-600 mb-1">
                            Search Priority: <span className="font-medium">{site.searchPriority}</span>
                          </p>
                        )}

                        {site.findings && site.findings.length > 0 && (
                          <p className="text-xs text-gray-500 mb-1">Findings: {site.findings.length}</p>
                        )}

                        <button
                          onClick={() => handleMarkerClick(site)}
                          className="mt-2 w-full bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Edit Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </div>
            );
          })}
        </MapContainer>
      </div>

      {showForm && clickedCoordinates && (
        <PointerForm
          pointer={selectedPointer}
          coordinates={clickedCoordinates}
          onSave={handleSavePointer}
          onCancel={handleCancelForm}
        />
      )}
    </>
  );
}

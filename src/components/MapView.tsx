"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useMapLayers } from '@/context/MapLayersContext';
import { useProject } from '@/contexts/ProjectContext';
import { ArchaeologicalSite } from '@/types';

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

// Component to control map view when project changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

interface MapViewProps {
  refreshTrigger?: number;
}

export default function MapView({ refreshTrigger }: MapViewProps) {
  const { activeProject, isLoading: isProjectLoading } = useProject();
  const { getVisibleLayers } = useMapLayers();
  const [sites, setSites] = useState<ArchaeologicalSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const visibleLayers = getVisibleLayers();

  // Default center and zoom
  const defaultCenter: [number, number] = activeProject?.defaultCenter || [41.9028, 12.4964];
  const defaultZoom = activeProject?.defaultZoom || 13;

  useEffect(() => {
    const loadSites = async () => {
      if (!activeProject) {
        setSites([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`/api/sites?projectId=${activeProject.id}`);
        setSites(response.data.sites);
      } catch (error) {
        console.error('Error loading sites:', error);
        setSites([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSites();
  }, [activeProject, refreshTrigger]);

  const getColor = (type: ArchaeologicalSite['type']) => {
    switch (type) {
      case 'archaeological_area':
        return '#ef4444'; // Red
      case 'finding':
        return '#f59e0b'; // Orange
      case 'point_of_interest':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  // Show loading state or message when no project is active
  if (isProjectLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No project selected</p>
          <p className="text-gray-500 text-sm mt-2">Create or select a project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <MapController center={defaultCenter} zoom={defaultZoom} />
      {visibleLayers.map((layer) => (
        <TileLayer
          key={layer.id}
          attribution={layer.attribution}
          url={layer.url}
          opacity={layer.opacity}
          maxZoom={layer.maxZoom}
        />
      ))}

      {sites.map((site) => (
        <div key={site.id}>
          {site.type === 'archaeological_area' ? (
            <Circle
              center={site.coordinates}
              radius={site.radius}
              pathOptions={{
                color: getColor(site.type),
                fillColor: getColor(site.type),
                fillOpacity: 0.3,
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{site.name}</h3>
                  <p className="text-sm text-gray-600">{site.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Radius: {site.radius}m</p>
                </div>
              </Popup>
            </Circle>
          ) : (
            <Marker position={site.coordinates}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{site.name}</h3>
                  <p className="text-sm text-gray-600">{site.description}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </div>
      ))}
    </MapContainer>
  );
}

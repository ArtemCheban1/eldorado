"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapLayers } from '@/context/MapLayersContext';

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

interface ArchaeologicalSite {
  id: string;
  name: string;
  coordinates: [number, number];
  radius: number;
  type: 'archaeological_area' | 'finding' | 'point_of_interest';
  description?: string;
  photos?: string[];
}

export default function MapView() {
  const [sites, setSites] = useState<ArchaeologicalSite[]>([]);
  const { getVisibleLayers } = useMapLayers();

  // Default center (you can change this)
  const defaultCenter: [number, number] = [41.9028, 12.4964]; // Rome, Italy

  const visibleLayers = getVisibleLayers();

  useEffect(() => {
    // Mock data - replace with API call later
    const mockSites: ArchaeologicalSite[] = [
      {
        id: '1',
        name: 'Archaeological Site Alpha',
        coordinates: [41.9028, 12.4964],
        radius: 500,
        type: 'archaeological_area',
        description: 'Ancient Roman ruins discovered in 2023',
      },
      {
        id: '2',
        name: 'Finding Point Beta',
        coordinates: [41.9100, 12.5000],
        radius: 100,
        type: 'finding',
        description: 'Pottery fragments found here',
      },
      {
        id: '3',
        name: 'Point of Interest Gamma',
        coordinates: [41.8950, 12.4800],
        radius: 50,
        type: 'point_of_interest',
        description: 'Historical landmark',
      },
    ];

    setSites(mockSites);
  }, []);

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

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
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

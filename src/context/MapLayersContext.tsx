'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  visible: boolean;
  opacity: number;
  maxZoom?: number;
}

export interface MapLayersContextType {
  layers: MapLayer[];
  toggleLayerVisibility: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  getVisibleLayers: () => MapLayer[];
}

const MapLayersContext = createContext<MapLayersContextType | undefined>(undefined);

// Predefined map tile sources
const INITIAL_LAYERS: MapLayer[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    visible: true,
    opacity: 1,
    maxZoom: 19,
  },
  {
    id: 'google-satellite',
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    visible: false,
    opacity: 1,
    maxZoom: 20,
  },
  {
    id: 'google-hybrid',
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    visible: false,
    opacity: 1,
    maxZoom: 20,
  },
  {
    id: 'esri-satellite',
    name: 'ESRI Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    visible: false,
    opacity: 1,
    maxZoom: 19,
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    visible: false,
    opacity: 1,
    maxZoom: 17,
  },
  {
    id: 'cartodb-positron',
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    visible: false,
    opacity: 1,
    maxZoom: 19,
  },
];

export function MapLayersProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);

  const toggleLayerVisibility = (id: string) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === id ? { ...layer, opacity } : layer
      )
    );
  };

  const getVisibleLayers = () => {
    return layers.filter((layer) => layer.visible);
  };

  return (
    <MapLayersContext.Provider
      value={{
        layers,
        toggleLayerVisibility,
        setLayerOpacity,
        getVisibleLayers,
      }}
    >
      {children}
    </MapLayersContext.Provider>
  );
}

export function useMapLayers() {
  const context = useContext(MapLayersContext);
  if (context === undefined) {
    throw new Error('useMapLayers must be used within a MapLayersProvider');
  }
  return context;
}

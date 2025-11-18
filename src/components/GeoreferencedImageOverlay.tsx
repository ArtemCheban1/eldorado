"use client";

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoreferencedLayer } from '@/types';

interface GeoreferencedImageOverlayProps {
  layer: GeoreferencedLayer;
}

export default function GeoreferencedImageOverlay({ layer }: GeoreferencedImageOverlayProps) {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    if (!layer.bounds || !layer.imageUrl || !layer.enabled) {
      // Remove overlay if it exists
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
      return;
    }

    // Create bounds from the layer data
    const bounds = L.latLngBounds(layer.bounds);

    // Remove old overlay if it exists
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Create new image overlay
    const imageOverlay = L.imageOverlay(
      layer.imageUrl,
      bounds,
      {
        opacity: layer.opacity || 0.7,
        interactive: false,
        alt: layer.name,
      }
    );

    // Add to map
    imageOverlay.addTo(map);
    overlayRef.current = imageOverlay;

    // Cleanup function
    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [layer, map]);

  // Update opacity when it changes
  useEffect(() => {
    if (overlayRef.current && layer.opacity !== undefined) {
      overlayRef.current.setOpacity(layer.opacity);
    }
  }, [layer.opacity]);

  return null; // This component doesn't render anything directly
}

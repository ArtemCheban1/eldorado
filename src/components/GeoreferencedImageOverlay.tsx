'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoreferencedLayer } from '@/types';

interface GeoreferencedImageOverlayProps {
  layer: GeoreferencedLayer;
}

export default function GeoreferencedImageOverlay({ layer }: GeoreferencedImageOverlayProps) {
  const map = useMap();

  useEffect(() => {
    if (!layer.visible) return;

    // Create image overlay with bounds
    const imageOverlay = L.imageOverlay(
      layer.imageUrl,
      layer.bounds as L.LatLngBoundsExpression,
      {
        opacity: layer.opacity,
        interactive: false,
        alt: layer.name
      }
    );

    // Add to map
    imageOverlay.addTo(map);

    // Cleanup on unmount or when layer changes
    return () => {
      imageOverlay.remove();
    };
  }, [map, layer]);

  return null; // This component doesn't render anything directly
}

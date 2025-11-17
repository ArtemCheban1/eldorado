import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import { ArchaeologicalSite } from '@/types';

export interface ParsedKMLData {
  points: ArchaeologicalSite[];
  areas: ArchaeologicalSite[];
  total: number;
}

export interface KMLPreviewData {
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

/**
 * Calculate the radius of a polygon in meters
 * Uses the maximum distance from centroid to any vertex
 */
function calculatePolygonRadius(coordinates: number[][][]): number {
  if (!coordinates || !coordinates[0] || coordinates[0].length === 0) {
    return 50; // Default radius
  }

  const ring = coordinates[0];

  // Calculate centroid
  let latSum = 0;
  let lngSum = 0;
  ring.forEach(([lng, lat]) => {
    latSum += lat;
    lngSum += lng;
  });
  const centroidLat = latSum / ring.length;
  const centroidLng = lngSum / ring.length;

  // Find maximum distance from centroid to any vertex
  let maxDistance = 0;
  ring.forEach(([lng, lat]) => {
    const distance = getDistanceInMeters(centroidLat, centroidLng, lat, lng);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  });

  return Math.round(maxDistance);
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get centroid of a polygon
 */
function getPolygonCentroid(coordinates: number[][][]): [number, number] {
  if (!coordinates || !coordinates[0] || coordinates[0].length === 0) {
    return [0, 0];
  }

  const ring = coordinates[0];
  let latSum = 0;
  let lngSum = 0;

  ring.forEach(([lng, lat]) => {
    latSum += lat;
    lngSum += lng;
  });

  return [latSum / ring.length, lngSum / ring.length];
}

/**
 * Parse KML file content and convert to ArchaeologicalSite objects
 */
export function parseKML(kmlContent: string): ParsedKMLData {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
  const geojson = kml(kmlDoc);

  const points: ArchaeologicalSite[] = [];
  const areas: ArchaeologicalSite[] = [];

  if (!geojson.features || geojson.features.length === 0) {
    return { points, areas, total: 0 };
  }

  geojson.features.forEach((feature, index) => {
    const { geometry, properties } = feature;

    if (!geometry) return;

    const name = properties?.name || `Imported Site ${index + 1}`;
    const description = properties?.description || '';

    // Generate unique ID
    const id = `kml-import-${Date.now()}-${index}`;

    if (geometry.type === 'Point') {
      // Handle Point geometries
      const [lng, lat] = geometry.coordinates as number[];

      const site: ArchaeologicalSite = {
        id,
        name,
        coordinates: [lat, lng],
        radius: 50, // Default radius for points
        type: 'finding',
        description,
        category: properties?.category || 'Imported from KML',
        dateCreated: new Date(),
        dateUpdated: new Date(),
        metadata: {
          importedFrom: 'kml',
          originalProperties: properties,
        },
      };

      points.push(site);
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      // Handle Polygon geometries
      let coordinates: number[][][];

      if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates as number[][][];
      } else {
        // For MultiPolygon, use the first polygon
        coordinates = (geometry.coordinates as number[][][][])[0];
      }

      const centroid = getPolygonCentroid(coordinates);
      const radius = calculatePolygonRadius(coordinates);

      const site: ArchaeologicalSite = {
        id,
        name,
        coordinates: centroid,
        radius,
        type: 'archaeological_area',
        description,
        category: properties?.category || 'Imported from KML',
        dateCreated: new Date(),
        dateUpdated: new Date(),
        metadata: {
          importedFrom: 'kml',
          originalProperties: properties,
          originalGeometry: geometry,
        },
      };

      areas.push(site);
    } else if (geometry.type === 'LineString') {
      // Convert LineString to points (use start and end points)
      const coords = geometry.coordinates as number[][];
      coords.forEach((coord, idx) => {
        const [lng, lat] = coord;
        const site: ArchaeologicalSite = {
          id: `${id}-line-${idx}`,
          name: `${name} (Point ${idx + 1})`,
          coordinates: [lat, lng],
          radius: 50,
          type: 'point_of_interest',
          description: `${description} - Part of line feature`,
          category: properties?.category || 'Imported from KML',
          dateCreated: new Date(),
          dateUpdated: new Date(),
          metadata: {
            importedFrom: 'kml',
            originalProperties: properties,
            partOfLine: true,
          },
        };
        points.push(site);
      });
    }
  });

  return {
    points,
    areas,
    total: points.length + areas.length,
  };
}

/**
 * Generate preview data from parsed KML
 */
export function generatePreview(parsedData: ParsedKMLData, limit: number = 10): KMLPreviewData {
  const allSites = [...parsedData.points, ...parsedData.areas];
  const preview = allSites.slice(0, limit).map(site => ({
    name: site.name,
    type: site.type === 'archaeological_area' ? 'area' as const : 'point' as const,
    coordinates: site.coordinates,
    radius: site.radius,
    description: site.description,
  }));

  return {
    total: parsedData.total,
    pointsCount: parsedData.points.length,
    areasCount: parsedData.areas.length,
    preview,
  };
}

/**
 * Check for duplicate sites based on coordinates proximity
 * Two sites are considered duplicates if they are within 10 meters of each other
 */
export function findDuplicates(
  newSites: ArchaeologicalSite[],
  existingSites: ArchaeologicalSite[],
  thresholdMeters: number = 10
): {
  duplicates: Array<{
    newSite: ArchaeologicalSite;
    existingSite: ArchaeologicalSite;
    distance: number;
  }>;
  unique: ArchaeologicalSite[];
} {
  const duplicates: Array<{
    newSite: ArchaeologicalSite;
    existingSite: ArchaeologicalSite;
    distance: number;
  }> = [];
  const unique: ArchaeologicalSite[] = [];

  newSites.forEach(newSite => {
    let isDuplicate = false;

    for (const existingSite of existingSites) {
      const distance = getDistanceInMeters(
        newSite.coordinates[0],
        newSite.coordinates[1],
        existingSite.coordinates[0],
        existingSite.coordinates[1]
      );

      if (distance <= thresholdMeters) {
        duplicates.push({
          newSite,
          existingSite,
          distance: Math.round(distance),
        });
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(newSite);
    }
  });

  return { duplicates, unique };
}

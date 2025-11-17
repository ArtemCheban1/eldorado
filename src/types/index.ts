export interface ArchaeologicalSite {
  _id?: string;
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  radius: number; // in meters
  type: 'archaeological_area' | 'finding' | 'point_of_interest';
  category?: string;
  description?: string;
  dateDiscovered?: Date | string;
  dateCreated?: Date | string;
  dateUpdated?: Date | string;
  artifacts?: Artifact[];
  photos?: Photo[];
  metadata?: Record<string, any>;
}

export interface Artifact {
  id: string;
  name: string;
  description?: string;
  dateFound?: Date | string;
  photos?: Photo[];
  category?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  dateUploaded: Date | string;
  tags?: string[];
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'overlay';
  provider: 'osm' | 'google' | 'apple' | 'mapbox' | 'historical';
  url?: string;
  enabled: boolean;
  opacity?: number;
}

export interface Project {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  sites: ArchaeologicalSite[];
  layers: MapLayer[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  dateCreated: Date | string;
  dateUpdated: Date | string;
}

export interface ImportData {
  format: 'geojson' | 'kml' | 'csv' | 'gpx';
  data: any;
  options?: {
    defaultType?: ArchaeologicalSite['type'];
    defaultRadius?: number;
    category?: string;
  };
}

// Georeferencing types
export interface ReferencePoint {
  id: string;
  imageCoordinates: { x: number; y: number }; // Pixel coordinates on the image
  mapCoordinates: { lat: number; lng: number }; // Real-world coordinates
  label?: string;
}

export interface HistoricalImage {
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  dateUploaded: Date | string;
}

export interface GeoreferencingProject {
  _id?: string;
  id: string;
  name: string;
  image: HistoricalImage;
  referencePoints: ReferencePoint[];
  dateCreated: Date | string;
  dateUpdated: Date | string;
}

export interface User {
  _id?: string;
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string; // 'google', 'facebook', 'github', etc.
  emailVerified?: Date | string | null;
  dateCreated?: Date | string;
  dateUpdated?: Date | string;
}

export interface ArchaeologicalSite {
  _id?: string;
  id: string;
  userId: string; // Owner of this site
  projectId: string; // Reference to the project this site belongs to
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
  userId: string; // Owner of this project
  name: string;
  description?: string;
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

// Georeferencing types - Main georeferencing tool
export interface ControlPoint {
  id: string;
  imageCoordinates: { x: number; y: number }; // pixel coordinates on image
  mapCoordinates: { lat: number; lng: number }; // geographic coordinates
}

export interface GeoreferencedLayer {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  imageUrl: string; // URL to the uploaded image
  imageWidth: number; // original image dimensions
  imageHeight: number;
  controlPoints: ControlPoint[]; // minimum 3 points for affine transformation
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  opacity: number; // 0-1
  visible: boolean;
  dateCreated: Date | string;
  dateUpdated: Date | string;
  projectId?: string; // optional association with project
}

// Georeferencing types - Separate page georeference tool
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

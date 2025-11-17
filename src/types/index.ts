export type PointerType =
  | 'info_pointer'           // General information pointer
  | 'findings_pointer'       // Pointer with archaeological findings
  | 'search_location'        // Possible place to search
  | 'archaeological_area'    // Archaeological area (legacy)
  | 'finding'                // Finding (legacy)
  | 'point_of_interest';     // Point of interest (legacy)

export interface Timespan {
  period: string;            // e.g., "Cucuteni", "Middle Ages", "Bronze Age"
  startYear?: number;        // Optional start year (negative for BC)
  endYear?: number;          // Optional end year (negative for BC)
  description?: string;      // Additional context about the period
}

export interface Category {
  id: string;
  name: string;
  color?: string;            // Hex color for visual grouping
  icon?: string;             // Icon identifier
}

export interface ArchaeologicalSite {
  _id?: string;
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  radius: number; // in meters
  type: PointerType;

  // New fields for enhanced categorization
  categories?: Category[];   // Multiple categories for grouping
  tags?: string[];          // Tags for filtering (e.g., "neolithic", "pottery", "burial")
  timespan?: Timespan;      // Historical period information

  // Pointer-specific information
  info?: string;            // Additional information (for info_pointer)
  findings?: Finding[];     // Archaeological findings (for findings_pointer)
  searchPriority?: 'high' | 'medium' | 'low'; // Priority for search locations
  searchReason?: string;    // Why this location should be searched

  // Legacy fields
  category?: string;        // Keep for backward compatibility
  description?: string;
  dateDiscovered?: Date | string;
  dateCreated?: Date | string;
  dateUpdated?: Date | string;
  artifacts?: Artifact[];   // Legacy - use findings instead
  photos?: Photo[];
  metadata?: Record<string, any>;
}

export interface Finding {
  id: string;
  name: string;
  description?: string;
  type: 'artifact' | 'structure' | 'burial' | 'pottery' | 'tool' | 'other';
  dateFound?: Date | string;
  photos?: Photo[];
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  tags?: string[];
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

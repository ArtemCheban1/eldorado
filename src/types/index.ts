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

// User authentication types - Unified to support both email and username login
export interface User {
  _id?: string;
  id: string;
  email: string;
  username?: string;         // Optional username for username/password auth
  password?: string;         // Hashed password (for email/password auth)
  name?: string;
  image?: string;
  provider?: string;         // 'google', 'facebook', 'github', 'email', etc.
  role?: 'admin' | 'user' | 'researcher' | 'viewer';
  emailVerified?: Date | string | null;
  dateCreated?: Date | string;
  dateUpdated?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  role?: 'admin' | 'user' | 'researcher' | 'viewer';
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  username?: string;
  role?: 'admin' | 'user' | 'researcher' | 'viewer';
}

// Legacy type for backward compatibility with new auth implementation
export interface AuthTokenPayload {
  userId: string;
  username?: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username?: string;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface LoginRequest {
  username?: string;  // Can login with username
  email?: string;     // Or with email
  password: string;
}

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
  name?: string;
}

export interface ArchaeologicalSite {
  _id?: string;
  id: string;
  userId?: string; // Owner of this site
  projectId?: string; // Reference to the project this site belongs to
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
  createdBy?: string;       // User ID who created the site
  updatedBy?: string;       // User ID who last updated the site
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
  userId: string; // Owner of this project
  name: string;
  description?: string;
  sites?: ArchaeologicalSite[];
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

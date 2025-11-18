import { ControlPoint } from '@/types';

/**
 * Calculate affine transformation parameters from control points
 * Uses least squares fitting to find transformation matrix
 *
 * Transformation equations:
 * lat = a0 + a1*x + a2*y
 * lng = b0 + b1*x + b2*y
 */
export function calculateAffineTransformation(controlPoints: ControlPoint[]) {
  if (controlPoints.length < 3) {
    throw new Error('At least 3 control points are required for georeferencing');
  }

  const n = controlPoints.length;

  // Build matrices for least squares solution
  // For latitude transformation
  let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
  let sumLat = 0, sumLatX = 0, sumLatY = 0;

  // For longitude transformation
  let sumLng = 0, sumLngX = 0, sumLngY = 0;

  for (const point of controlPoints) {
    const x = point.imageCoordinates.x;
    const y = point.imageCoordinates.y;
    const lat = point.mapCoordinates.lat;
    const lng = point.mapCoordinates.lng;

    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;

    sumLat += lat;
    sumLatX += lat * x;
    sumLatY += lat * y;

    sumLng += lng;
    sumLngX += lng * x;
    sumLngY += lng * y;
  }

  // Solve system of equations using Cramer's rule
  const det = n * (sumXX * sumYY - sumXY * sumXY) -
              sumX * (sumX * sumYY - sumY * sumXY) +
              sumY * (sumX * sumXY - sumY * sumXX);

  if (Math.abs(det) < 1e-10) {
    throw new Error('Control points are collinear or too close together');
  }

  // Calculate transformation parameters for latitude
  const a0 = (sumLat * (sumXX * sumYY - sumXY * sumXY) -
              sumLatX * (sumX * sumYY - sumY * sumXY) +
              sumLatY * (sumX * sumXY - sumY * sumXX)) / det;

  const a1 = (n * (sumLatX * sumYY - sumLatY * sumXY) -
              sumLat * (sumX * sumYY - sumY * sumXY) +
              sumY * (sumX * sumLatY - sumY * sumLatX)) / det;

  const a2 = (n * (sumXX * sumLatY - sumXY * sumLatX) -
              sumX * (sumX * sumLatY - sumY * sumLatX) +
              sumLat * (sumX * sumXY - sumY * sumXX)) / det;

  // Calculate transformation parameters for longitude
  const b0 = (sumLng * (sumXX * sumYY - sumXY * sumXY) -
              sumLngX * (sumX * sumYY - sumY * sumXY) +
              sumLngY * (sumX * sumXY - sumY * sumXX)) / det;

  const b1 = (n * (sumLngX * sumYY - sumLngY * sumXY) -
              sumLng * (sumX * sumYY - sumY * sumXY) +
              sumY * (sumX * sumLngY - sumY * sumLngX)) / det;

  const b2 = (n * (sumXX * sumLngY - sumXY * sumLngX) -
              sumX * (sumX * sumLngY - sumY * sumLngX) +
              sumLng * (sumX * sumXY - sumY * sumXX)) / det;

  return {
    lat: { a0, a1, a2 },
    lng: { b0, b1, b2 }
  };
}

/**
 * Transform image coordinates to geographic coordinates using affine transformation
 */
export function imageToGeoCoords(
  x: number,
  y: number,
  transformation: ReturnType<typeof calculateAffineTransformation>
): { lat: number; lng: number } {
  const lat = transformation.lat.a0 + transformation.lat.a1 * x + transformation.lat.a2 * y;
  const lng = transformation.lng.b0 + transformation.lng.b1 * x + transformation.lng.b2 * y;

  return { lat, lng };
}

/**
 * Calculate bounds for the georeferenced image
 */
export function calculateImageBounds(
  imageWidth: number,
  imageHeight: number,
  controlPoints: ControlPoint[]
): [[number, number], [number, number]] {
  const transformation = calculateAffineTransformation(controlPoints);

  // Transform the four corners of the image
  const corners = [
    imageToGeoCoords(0, 0, transformation),
    imageToGeoCoords(imageWidth, 0, transformation),
    imageToGeoCoords(imageWidth, imageHeight, transformation),
    imageToGeoCoords(0, imageHeight, transformation)
  ];

  // Find min/max lat/lng
  const lats = corners.map(c => c.lat);
  const lngs = corners.map(c => c.lng);

  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  return [[south, west], [north, east]];
}

/**
 * Calculate residual error for control points (RMSE)
 * Useful for quality assessment
 */
export function calculateResidualError(controlPoints: ControlPoint[]): number {
  if (controlPoints.length < 3) return 0;

  const transformation = calculateAffineTransformation(controlPoints);
  let sumSquaredError = 0;

  for (const point of controlPoints) {
    const transformed = imageToGeoCoords(
      point.imageCoordinates.x,
      point.imageCoordinates.y,
      transformation
    );

    const latError = transformed.lat - point.mapCoordinates.lat;
    const lngError = transformed.lng - point.mapCoordinates.lng;

    // Convert to approximate meters (rough approximation)
    const latErrorMeters = latError * 111320; // degrees to meters
    const lngErrorMeters = lngError * 111320 * Math.cos(point.mapCoordinates.lat * Math.PI / 180);

    sumSquaredError += latErrorMeters * latErrorMeters + lngErrorMeters * lngErrorMeters;
  }

  return Math.sqrt(sumSquaredError / controlPoints.length);
}

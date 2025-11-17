# KML Import Feature Guide

## Overview

The KML Import feature allows you to import archaeological sites, findings, and points of interest from KML (Keyhole Markup Language) files into the El Dorado Archaeological Map Management System. The feature includes preview functionality, duplicate detection, and automatic conversion of KML geometries to the application's data model.

## Features

### 1. File Upload and Preview
- Upload `.kml` files through an intuitive modal interface
- Preview the first 10 rows of data before importing
- View statistics: total sites, points count, and areas count
- Support for Points, Polygons, and LineStrings

### 2. Duplicate Detection
- Automatic detection of sites within 10 meters of existing locations
- Visual warning when duplicates are found
- Option to skip duplicates during import (recommended)
- Detailed duplicate information showing distance between sites

### 3. Geometry Conversion
- **Points**: Imported as findings or points of interest
- **Polygons**: Converted to circular areas with calculated radius
- **LineStrings**: Split into individual points along the line

### 4. Real-time Map Updates
- Imported sites automatically appear on the map
- No page refresh required

## How to Use

### Step 1: Access the Import Feature
1. Click the "Import KML File" button in the left sidebar
2. Or click the import icon when the sidebar is collapsed

### Step 2: Select a KML File
1. Click "Select KML File" or drag and drop a `.kml` file
2. Only `.kml` files are accepted

### Step 3: Preview the Data
1. Click "Preview Import" to analyze the file
2. Review the statistics:
   - **Total Sites**: Total number of sites to be imported
   - **Points**: Number of point features (findings/POIs)
   - **Areas**: Number of polygon features (archaeological areas)
3. Check the preview table showing the first 10 rows with:
   - Name
   - Type (point/area)
   - Coordinates
   - Radius (for areas)

### Step 4: Handle Duplicates
If duplicates are detected:
- A yellow warning box will appear showing the number of duplicates
- Review duplicate information (name, coordinates, distance)
- **Recommended**: Keep "Skip duplicate sites" checked to avoid importing duplicates
- Uncheck to import all sites including duplicates

### Step 5: Import
1. Click the "Import X Sites" button
2. Wait for the import to complete
3. Success message will appear
4. The map will automatically refresh with new sites

## KML File Format

### Supported Geometries

#### 1. Point (Imported as Finding)
```xml
<Placemark>
  <name>Site Name</name>
  <description>Site description</description>
  <Point>
    <coordinates>longitude,latitude,altitude</coordinates>
  </Point>
</Placemark>
```

#### 2. Polygon (Imported as Archaeological Area)
```xml
<Placemark>
  <name>Area Name</name>
  <description>Area description</description>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>
          lon1,lat1,0
          lon2,lat2,0
          lon3,lat3,0
          lon1,lat1,0
        </coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
```

#### 3. LineString (Imported as Points of Interest)
```xml
<Placemark>
  <name>Line Name</name>
  <description>Line description</description>
  <LineString>
    <coordinates>
      lon1,lat1,0
      lon2,lat2,0
      lon3,lat3,0
    </coordinates>
  </LineString>
</Placemark>
```

### Properties Mapping

| KML Property | Database Field | Notes |
|-------------|----------------|-------|
| `<name>` | `name` | Site name |
| `<description>` | `description` | Site description |
| `<coordinates>` | `coordinates` | [latitude, longitude] |
| N/A (calculated) | `radius` | For polygons, calculated as max distance from centroid |
| Point | `type: 'finding'` | Point features |
| Polygon | `type: 'archaeological_area'` | Polygon features |
| LineString | `type: 'point_of_interest'` | Line vertices |

## Sample KML File

A sample KML file (`sample-archaeological-sites.kml`) is included in the project root with 12 archaeological sites in Rome, including:
- 9 point features (Colosseum, Roman Forum, Pantheon, etc.)
- 3 polygon features (Vatican City Archaeological Area, Palatine Hill, Baths of Caracalla)

You can use this file to test the import feature.

## Technical Details

### API Endpoints

#### POST /api/import/preview
- **Purpose**: Preview KML file content and check for duplicates
- **Input**: FormData with `file` (KML file)
- **Output**:
  ```json
  {
    "preview": {
      "total": 12,
      "pointsCount": 9,
      "areasCount": 3,
      "preview": [...]
    },
    "duplicates": {
      "count": 0,
      "items": []
    },
    "uniqueCount": 12
  }
  ```

#### POST /api/import/execute
- **Purpose**: Execute the import
- **Input**: FormData with:
  - `file`: KML file
  - `skipDuplicates`: "true" or "false"
- **Output**:
  ```json
  {
    "success": true,
    "message": "Successfully imported 12 site(s)",
    "imported": 12,
    "skipped": 0,
    "breakdown": {
      "points": 9,
      "areas": 3
    }
  }
  ```

### Duplicate Detection Algorithm

Two sites are considered duplicates if:
- They are within 10 meters of each other (configurable threshold)
- Distance calculated using Haversine formula for accuracy

### Polygon to Circle Conversion

For polygon features:
1. Calculate centroid (average of all vertices)
2. Find maximum distance from centroid to any vertex
3. Use centroid as center coordinates
4. Use maximum distance as radius

## Troubleshooting

### "No valid points or areas found in KML file"
- Check that your KML file contains valid Point, Polygon, or LineString geometries
- Ensure coordinates are in the format: `longitude,latitude,altitude`

### "Only .kml files are supported"
- Make sure your file has a `.kml` extension
- KMZ files (compressed KML) are not currently supported

### Import button is disabled
- Click "Preview Import" first to analyze the file
- Fix any errors shown in the error message

### Duplicates not detected
- Duplicate detection uses a 10-meter threshold
- Sites must have exact or very similar coordinates to be flagged

## Future Enhancements

Planned improvements:
- Support for KMZ (compressed KML) files
- Configurable duplicate detection threshold
- Import history and rollback
- Batch import from multiple files
- Custom category mapping from KML properties
- Import progress bar for large files

## Related Documentation

- [Main README](./README.md)
- [Database Schema](./src/types/index.ts)
- [API Documentation](./API.md) (coming soon)

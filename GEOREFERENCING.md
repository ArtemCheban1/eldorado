# Georeferencing Tool Documentation

## Overview

The georeferencing tool allows you to upload historical maps or aerial photos and align them with modern geographic coordinates by placing control points. Once georeferenced, these images are displayed as overlay layers on the interactive map.

## Features

### 1. Image Upload
- Upload map images in common formats (JPG, PNG, etc.)
- Images are stored as base64 data URLs in MongoDB
- Automatic image dimension detection

### 2. Control Point Placement
- Place 3-6 control points for accurate georeferencing
- Visual workflow:
  1. Click on the uploaded image to mark a location
  2. Click on the base map to set its geographic coordinates
  3. Repeat for each control point
- Color-coded point status:
  - 🟢 Green: Point is complete (both image and map coordinates set)
  - 🟠 Orange: Point is partially complete
  - ⚪ Gray: Point not yet placed

### 3. Affine Transformation
- Uses least squares fitting algorithm for optimal georeferencing
- Calculates transformation matrix from control points
- Supports rotation, scaling, and translation
- Displays residual error (RMSE) for quality assessment

### 4. Layer Management
- Save georeferenced images as named layers
- Toggle layer visibility
- Adjust layer opacity (0-100%)
- Delete unwanted layers
- View layer metadata (control points, dimensions, creation date)

## User Workflow

### Step-by-Step Guide

1. **Open the Georeferencing Tool**
   - Click the "Georeference Map" button in the left sidebar
   - Or click the "+ Add" button in the "Georeferenced Layers" section

2. **Enter Layer Information**
   - Name: Give your layer a descriptive name (required)
   - Description: Add optional details about the map

3. **Upload Your Map Image**
   - Click "Click to Upload Image"
   - Select an image file from your computer
   - The image will appear in the preview area

4. **Add Control Points**
   - Click "Add Point" to create a new control point
   - Click on the uploaded image where you want to place the point
   - Then click on the base map at the corresponding geographic location
   - Repeat for at least 3 points (up to 6 recommended for better accuracy)

5. **Review Quality**
   - Check the Residual Error (RMSE) shown below the control points
   - Values under 10 meters are generally good
   - Higher values may indicate:
     - Misplaced control points
     - Map distortion
     - Need for additional control points

6. **Adjust Opacity** (Optional)
   - Use the slider to set layer transparency (default: 70%)
   - This can be changed later in the layer manager

7. **Save the Layer**
   - Click "Save Layer" when all control points are placed
   - The layer will appear in the left sidebar and on the map

### Managing Saved Layers

**In the Left Sidebar:**
- ✅ **Toggle Visibility**: Check/uncheck to show/hide the layer
- 🔽 **Expand Details**: Click the arrow to see layer information
- 🎚️ **Adjust Opacity**: Use the slider when expanded
- 🗑️ **Delete**: Click the trash icon to remove the layer

## Technical Details

### Database Schema

```typescript
interface GeoreferencedLayer {
  _id?: string;                    // MongoDB ID
  id: string;                      // Custom ID
  name: string;                    // Layer name
  description?: string;            // Optional description
  imageUrl: string;                // Base64 encoded image
  imageWidth: number;              // Original dimensions
  imageHeight: number;
  controlPoints: ControlPoint[];   // Array of control points
  bounds: [[number, number], [number, number]];  // [[S, W], [N, E]]
  opacity: number;                 // 0-1
  visible: boolean;                // Show/hide
  dateCreated: Date | string;
  dateUpdated: Date | string;
  projectId?: string;              // Future: multi-project support
}

interface ControlPoint {
  id: string;
  imageCoordinates: { x: number; y: number };     // Pixels
  mapCoordinates: { lat: number; lng: number };   // Geographic
}
```

### API Endpoints

**GET /api/georeferenced-layers**
- Retrieves all georeferenced layers
- Returns: `{ layers: GeoreferencedLayer[] }`

**POST /api/georeferenced-layers**
- Creates a new georeferenced layer
- Body: GeoreferencedLayer object
- Returns: Created layer with `_id`

**GET /api/georeferenced-layers/[id]**
- Retrieves a specific layer by ID
- Returns: `{ layer: GeoreferencedLayer }`

**PUT /api/georeferenced-layers/[id]**
- Updates an existing layer
- Body: Partial GeoreferencedLayer object
- Returns: Updated layer

**DELETE /api/georeferenced-layers/[id]**
- Deletes a layer
- Returns: Success message

### Georeferencing Algorithm

The tool uses **affine transformation** to map image coordinates to geographic coordinates:

```
lat = a0 + a1*x + a2*y
lng = b0 + b1*x + b2*y
```

Where:
- `(x, y)` = pixel coordinates on the image
- `(lat, lng)` = geographic coordinates (WGS84)
- `a0, a1, a2, b0, b1, b2` = transformation parameters

**Calculation Method:**
1. Takes all control point pairs as input
2. Solves system of equations using least squares fitting
3. Finds optimal transformation parameters minimizing error
4. Applies transformation to image corners to calculate bounds

**Quality Metrics:**
- **RMSE (Root Mean Square Error)**: Measures average positioning error in meters
- Lower values indicate better accuracy
- Typical acceptable values: < 10 meters for archaeological applications

### Component Architecture

```
src/
├── components/
│   ├── GeoreferencingTool.tsx           # Main modal for georeferencing
│   ├── GeoreferencedLayerManager.tsx    # Layer list in sidebar
│   ├── GeoreferencedImageOverlay.tsx    # Leaflet overlay component
│   └── MapView.tsx                      # Updated with overlay support
├── lib/
│   └── georeferencing.ts                # Transformation algorithms
├── types/
│   └── index.ts                         # TypeScript interfaces
└── app/
    ├── api/
    │   └── georeferenced-layers/
    │       ├── route.ts                 # GET, POST endpoints
    │       └── [id]/route.ts            # GET, PUT, DELETE by ID
    └── page.tsx                         # Updated main page
```

## Best Practices

### Choosing Control Points

1. **Distribute Evenly**: Spread points across the entire image
2. **Use Distinctive Features**: Select clearly identifiable landmarks:
   - Building corners
   - Road intersections
   - River bends
   - Monument centers
3. **Avoid Moving Objects**: Don't use vehicles, temporary structures
4. **Use 4-6 Points**: 3 is minimum, 4-6 provides better accuracy
5. **Check Corners**: Include points near image edges when possible

### Accuracy Tips

- **Start with corners**: Place points at image corners first
- **Add center points**: Include points in the middle for better fit
- **Verify known locations**: Use landmarks you can confirm on modern maps
- **Check RMSE**: Re-adjust points if error is too high
- **Test visibility**: Toggle the layer on/off to verify alignment

### Performance Considerations

- **Image Size**: Large images (>5MB) may slow down the interface
  - Recommended: Resize images to 2000-3000 pixels max dimension
- **Number of Layers**: Many overlapping layers can affect map performance
  - Use layer visibility toggles to show only needed layers
- **Storage**: Base64 encoding increases data size by ~33%
  - Future enhancement: Use cloud storage (S3, Cloudinary)

## Troubleshooting

### Issue: "Control points are collinear or too close together"
**Solution**: Spread points across the image, don't place them in a line

### Issue: High RMSE (>50 meters)
**Possible Causes**:
- Map distortion or different projection
- Incorrectly placed control points
- Wrong corresponding locations

**Solutions**:
- Review each control point placement
- Add more control points
- Use more distinctive landmarks

### Issue: Image appears rotated or skewed
**Cause**: This is expected for non-north-aligned maps
**Note**: Affine transformation handles rotation automatically

### Issue: Layer not appearing on map
**Checklist**:
1. Is the layer visible? (checkbox in sidebar)
2. Is opacity above 0?
3. Are the geographic coordinates within the current map view?
4. Try zooming out to see the full extent

## Future Enhancements

### Planned Features
- [ ] Cloud storage integration (S3/Cloudinary)
- [ ] Advanced transformations (polynomial, spline)
- [ ] Batch georeferencing for multiple images
- [ ] Export georeferenced GeoTIFF
- [ ] Import existing georeferenced files
- [ ] Historical map timeline slider
- [ ] Mobile device support for field georeferencing
- [ ] Collaborative georeferencing (multiple users)
- [ ] Automatic feature detection for control points
- [ ] Integration with GPS devices

### Technical Improvements
- [ ] Optimize large image handling
- [ ] Progressive image loading
- [ ] WebGL acceleration for rendering
- [ ] Caching layer for faster loading
- [ ] Undo/redo for control point placement
- [ ] Keyboard shortcuts

## License

This georeferencing tool is part of the El Dorado Archaeological Map Management System.

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Consult the main project README
4. Contact the development team

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Author**: Claude Code Implementation

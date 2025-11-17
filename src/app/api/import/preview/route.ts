import { NextRequest, NextResponse } from 'next/server';
import { parseKML, generatePreview, findDuplicates } from '@/lib/kmlParser';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is KML
    if (!file.name.endsWith('.kml')) {
      return NextResponse.json(
        { error: 'Only .kml files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const kmlContent = await file.text();

    // Parse KML
    const parsedData = parseKML(kmlContent);

    if (parsedData.total === 0) {
      return NextResponse.json(
        { error: 'No valid points or areas found in KML file' },
        { status: 400 }
      );
    }

    // Get existing sites from database for duplicate checking
    const db = await getDatabase();
    const existingSites = await db
      .collection<ArchaeologicalSite>('sites')
      .find({})
      .toArray();

    // Check for duplicates
    const allNewSites = [...parsedData.points, ...parsedData.areas];
    const { duplicates, unique } = findDuplicates(allNewSites, existingSites);

    // Generate preview
    const previewData = generatePreview(parsedData, 10);

    return NextResponse.json({
      success: true,
      preview: previewData,
      duplicates: {
        count: duplicates.length,
        items: duplicates.map(d => ({
          newSite: {
            name: d.newSite.name,
            coordinates: d.newSite.coordinates,
            type: d.newSite.type,
          },
          existingSite: {
            name: d.existingSite.name,
            coordinates: d.existingSite.coordinates,
            type: d.existingSite.type,
          },
          distance: d.distance,
        })),
      },
      uniqueCount: unique.length,
      parsedData: {
        points: parsedData.points,
        areas: parsedData.areas,
      },
    });
  } catch (error) {
    console.error('Error previewing KML:', error);
    return NextResponse.json(
      { error: 'Failed to preview KML file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

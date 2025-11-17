import { NextRequest, NextResponse } from 'next/server';
import { parseKML, findDuplicates } from '@/lib/kmlParser';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const skipDuplicates = formData.get('skipDuplicates') === 'true';

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

    // Get existing sites from database
    const db = await getDatabase();
    const existingSites = await db
      .collection<ArchaeologicalSite>('sites')
      .find({})
      .toArray();

    // Check for duplicates
    const allNewSites = [...parsedData.points, ...parsedData.areas];
    const { duplicates, unique } = findDuplicates(allNewSites, existingSites);

    let sitesToImport: ArchaeologicalSite[];

    if (skipDuplicates) {
      // Only import unique sites
      sitesToImport = unique;
    } else {
      // Import all sites including duplicates
      sitesToImport = allNewSites;
    }

    if (sitesToImport.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new sites to import (all were duplicates)',
        imported: 0,
        skipped: duplicates.length,
      });
    }

    // Insert sites into database
    const result = await db
      .collection<ArchaeologicalSite>('sites')
      .insertMany(sitesToImport);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.insertedCount} site(s)`,
      imported: result.insertedCount,
      skipped: skipDuplicates ? duplicates.length : 0,
      duplicates: skipDuplicates ? duplicates.length : 0,
      breakdown: {
        points: parsedData.points.filter(p => sitesToImport.includes(p)).length,
        areas: parsedData.areas.filter(a => sitesToImport.includes(a)).length,
      },
    });
  } catch (error) {
    console.error('Error importing KML:', error);
    return NextResponse.json(
      { error: 'Failed to import KML file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

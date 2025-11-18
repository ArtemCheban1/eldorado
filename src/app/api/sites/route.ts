import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';
import { getAuthUser } from '@/lib/auth';

// GET /api/sites - Get all sites
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const sites = await db.collection<ArchaeologicalSite>('sites').find({}).toArray();

    return NextResponse.json({ sites }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

// POST /api/sites - Create a new site
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const db = await getDatabase();

    // Remove _id from body if it exists, MongoDB will generate it
    const { _id, ...siteData } = body;

    const newSite = {
      ...siteData,
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    const result = await db.collection('sites').insertOne(newSite);

    return NextResponse.json(
      { site: { ...newSite, _id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';

// GET /api/sites - Get all sites
export async function GET(request: NextRequest) {
  try {
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
    const body = await request.json();
    const db = await getDatabase();

    const newSite: ArchaeologicalSite = {
      ...body,
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    // MongoDB expects ObjectId for _id, so we omit it and let MongoDB generate it
    const { _id, ...siteData } = newSite;
    const result = await db.collection('sites').insertOne(siteData as any);

    return NextResponse.json(
      { site: { ...newSite, _id: result.insertedId } },
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

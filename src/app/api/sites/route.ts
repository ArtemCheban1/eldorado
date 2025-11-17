import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';

// GET /api/sites - Get all sites (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const db = await getDatabase();

    // Filter by projectId if provided
    const query = projectId ? { projectId } : {};
    const sites = await db.collection<ArchaeologicalSite>('sites').find(query).toArray();

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

    // Validate that projectId is provided
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newSite: Omit<ArchaeologicalSite, '_id'> = {
      ...body,
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    const result = await db.collection('sites').insertOne(newSite as any);

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

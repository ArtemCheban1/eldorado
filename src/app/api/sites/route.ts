import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';
import { requireAuth } from '@/lib/auth-middleware';

// GET /api/sites - Get all sites for the authenticated user (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const db = await getDatabase();

    // Always filter by userId for security, optionally also by projectId
    const query: any = { userId: auth.userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const sites = await db
      .collection<ArchaeologicalSite>('sites')
      .find(query)
      .toArray();

    return NextResponse.json({ sites }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

// POST /api/sites - Create a new site for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const body = await request.json();

    // Validate that projectId is provided
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id from body if it exists, let MongoDB generate it
    const { _id, ...siteData } = body;

    const newSite: Omit<ArchaeologicalSite, '_id'> = {
      ...siteData,
      userId: auth.userId, // Assign to authenticated user
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    const result = await db.collection('sites').insertOne(newSite as any);

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

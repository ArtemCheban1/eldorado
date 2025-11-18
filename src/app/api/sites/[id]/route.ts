import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ArchaeologicalSite } from '@/types';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/lib/middleware';

// GET /api/sites/[id] - Get a specific site
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid site ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const site = await db.collection('sites').findOne({
      _id: new ObjectId(id)
    }) as ArchaeologicalSite | null;

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ site }, { status: 200 });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id] - Update a site (requires authentication)
export const PUT = withAuth(async (
  request: NextRequest,
  { params, user }
) => {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid site ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = await getDatabase();

    // Remove _id from the update data if it exists
    const { _id, ...updateData } = body;

    const updatedSite = {
      ...updateData,
      dateUpdated: new Date().toISOString(),
      updatedBy: user.userId, // Add user who updated the site
    };

    const result = await db.collection('sites').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedSite },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ site: result }, { status: 200 });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
});

// DELETE /api/sites/[id] - Delete a site (requires authentication)
export const DELETE = withAuth(async (
  request: NextRequest,
  { params, user }
) => {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid site ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection('sites').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Site deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
});

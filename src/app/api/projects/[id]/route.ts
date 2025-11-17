import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { Project } from '@/types';
import { requireAuth } from '@/lib/auth-middleware';

// GET /api/projects/[id] - Get a specific project owned by the authenticated user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const db = await getDatabase();
    const project = await db
      .collection<Project>('projects')
      .findOne({ id: params.id, userId: auth.userId });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project owned by the authenticated user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const body = await request.json();
    const db = await getDatabase();

    const updateData = {
      ...body,
      dateUpdated: new Date().toISOString(),
    };

    const result = await db.collection('projects').findOneAndUpdate(
      { id: params.id, userId: auth.userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project: result }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project owned by the authenticated user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const db = await getDatabase();

    // First, delete all sites associated with this project and owned by the user
    await db.collection('sites').deleteMany({
      projectId: params.id,
      userId: auth.userId
    });

    // Then delete the project itself (only if owned by the user)
    const result = await db.collection('projects').deleteOne({
      id: params.id,
      userId: auth.userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

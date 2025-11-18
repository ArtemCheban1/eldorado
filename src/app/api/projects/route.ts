import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { Project } from '@/types';
import { requireAuth } from '@/lib/auth-middleware';

// GET /api/projects - Get all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const db = await getDatabase();
    const projects = await db
      .collection<Project>('projects')
      .find({ userId: auth.userId })
      .toArray();

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return auth.response;
    }

    const body = await request.json();
    const db = await getDatabase();

    const newProject: Omit<Project, '_id'> = {
      id: `project_${Date.now()}`,
      userId: auth.userId, // Assign to authenticated user
      name: body.name,
      description: body.description || '',
      layers: body.layers || [
        {
          id: 'osm',
          name: 'OpenStreetMap',
          type: 'base',
          provider: 'osm',
          enabled: true,
        },
      ],
      defaultCenter: body.defaultCenter || [41.9028, 12.4964], // Rome, Italy
      defaultZoom: body.defaultZoom || 13,
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    const result = await db.collection('projects').insertOne(newProject as any);

    return NextResponse.json(
      { project: { ...newProject, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

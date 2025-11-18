import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { GeoreferencedLayer } from '@/types';

// GET /api/layers - Get all georeferenced layers
export async function GET() {
  try {
    const db = await getDatabase();
    const layers = await db.collection('georeferenced_layers').find({}).toArray();

    return NextResponse.json({ layers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching layers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layers' },
      { status: 500 }
    );
  }
}

// POST /api/layers - Create a new georeferenced layer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const newLayer: Partial<GeoreferencedLayer> = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      imageUrl: body.imageUrl,
      thumbnailUrl: body.thumbnailUrl,
      controlPoints: body.controlPoints || [],
      bounds: body.bounds,
      opacity: body.opacity || 0.7,
      enabled: body.enabled !== undefined ? body.enabled : true,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };

    const result = await db.collection('georeferenced_layers').insertOne(newLayer);

    return NextResponse.json(
      { layer: { ...newLayer, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json(
      { error: 'Failed to create layer' },
      { status: 500 }
    );
  }
}

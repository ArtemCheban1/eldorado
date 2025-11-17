import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { GeoreferencedLayer } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('eldorado');

    const layers = await db
      .collection<GeoreferencedLayer>('georeferenced_layers')
      .find({})
      .toArray();

    return NextResponse.json({ layers }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch georeferenced layers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch georeferenced layers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('eldorado');

    const layer: GeoreferencedLayer = {
      ...body,
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    const result = await db
      .collection<GeoreferencedLayer>('georeferenced_layers')
      .insertOne(layer as any);

    return NextResponse.json(
      { ...layer, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create georeferenced layer:', error);
    return NextResponse.json(
      { error: 'Failed to create georeferenced layer' },
      { status: 500 }
    );
  }
}

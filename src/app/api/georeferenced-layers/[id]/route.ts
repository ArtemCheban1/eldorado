import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { GeoreferencedLayer } from '@/types';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('eldorado');

    const layer = await db
      .collection<GeoreferencedLayer>('georeferenced_layers')
      .findOne({ id: params.id });

    if (!layer) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }

    return NextResponse.json({ layer }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch georeferenced layer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch georeferenced layer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('eldorado');

    const updateData = {
      ...body,
      dateUpdated: new Date().toISOString(),
    };

    delete updateData._id; // Remove _id from update data

    const result = await db
      .collection<GeoreferencedLayer>('georeferenced_layers')
      .findOneAndUpdate(
        { id: params.id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }

    return NextResponse.json({ layer: result }, { status: 200 });
  } catch (error) {
    console.error('Failed to update georeferenced layer:', error);
    return NextResponse.json(
      { error: 'Failed to update georeferenced layer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('eldorado');

    const result = await db
      .collection<GeoreferencedLayer>('georeferenced_layers')
      .deleteOne({ id: params.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Layer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete georeferenced layer:', error);
    return NextResponse.json(
      { error: 'Failed to delete georeferenced layer' },
      { status: 500 }
    );
  }
}

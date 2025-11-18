import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET /api/layers/[id] - Get a specific layer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const layer = await db.collection('georeferenced_layers').findOne({
      $or: [
        { _id: new ObjectId(params.id) },
        { id: params.id }
      ]
    });

    if (!layer) {
      return NextResponse.json(
        { error: 'Layer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ layer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching layer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layer' },
      { status: 500 }
    );
  }
}

// PUT /api/layers/[id] - Update a layer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const updateData = {
      ...body,
      dateUpdated: new Date(),
    };

    // Remove _id from update data if present
    delete updateData._id;

    const result = await db.collection('georeferenced_layers').findOneAndUpdate(
      {
        $or: [
          { _id: new ObjectId(params.id) },
          { id: params.id }
        ]
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Layer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ layer: result }, { status: 200 });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { error: 'Failed to update layer' },
      { status: 500 }
    );
  }
}

// DELETE /api/layers/[id] - Delete a layer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();

    const result = await db.collection('georeferenced_layers').deleteOne({
      $or: [
        { _id: new ObjectId(params.id) },
        { id: params.id }
      ]
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Layer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Layer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json(
      { error: 'Failed to delete layer' },
      { status: 500 }
    );
  }
}

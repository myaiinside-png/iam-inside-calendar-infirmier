import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('iam_inside')

    const update: Record<string, any> = {}
    if (body.statut !== undefined) update.statut = body.statut
    if (body.details !== undefined) update.details = body.details

    await db.collection('disponibilites').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await clientPromise
    const db = client.db('iam_inside')

    await db.collection('disponibilites').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

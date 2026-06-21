import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('iam_inside')

    const slots = await db
      .collection('disponibilites')
      .find({})
      .sort({ date: 1, periode: 1 })
      .toArray()

    return NextResponse.json(slots)
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('iam_inside')

    const result = await db.collection('disponibilites').insertOne({
      date: body.date,
      periode: body.periode,
      statut: body.statut || 'disponible',
      details: body.details || null,
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

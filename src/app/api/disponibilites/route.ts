import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('iam_inside')
    const slots = await db.collection('disponibilites').find({}).toArray()
    return NextResponse.json(slots)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erreur serveur', detail: String(e?.message || e) }, { status: 500 })
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
  } catch (e: any) {
    return NextResponse.json({ error: 'Erreur serveur', detail: String(e?.message || e) }, { status: 500 })
  }
}

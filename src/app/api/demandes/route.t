import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('iam_inside')
    const demandes = await db.collection('demandes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(demandes)
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('iam_inside')
    
    await db.collection('demandes').insertOne({
      ...body,
      statut: 'attente',
      createdAt: new Date()
    })
    
    await db.collection('disponibilites').updateOne(
      { _id: body.slot_id },
      { $set: { statut: 'attente' } }
    )
    
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

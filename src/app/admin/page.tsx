'use client'

import { useState, useEffect } from 'react'

interface Slot {
  _id: string
  date: string
  periode: 'matin' | 'apres-midi'
  statut: 'disponible' | 'reserve' | 'attente'
  details?: {
    horaires?: string
    patients?: number
    types_soins?: string[]
    commentaire?: string
  }
}

interface Demande {
  _id: string
  slot_id: string
  nom: string
  email: string
  telephone: string
  date: string
  periode: string
  statut: 'attente' | 'validee' | 'refusee'
  createdAt: string
  horaires?: string
  nb_patients?: number
  soins?: string[]
  commentaires?: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'slots' | 'demandes'>('slots')
  const [slots, setSlots] = useState<Slot[]>([])
  const [demandes, setDemandes] = useState<Demande[]>([])

  const [newSlot, setNewSlot] = useState({
    date: '',
    periode: 'matin' as 'matin' | 'apres-midi',
    horaires: '',
    patients: '',
    soins: '',
    commentaire: ''
  })

  useEffect(() => {
    fetch('/api/admin/session')
      .then(res => setAuthenticated(res.ok))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchData()
    }
  }, [authenticated])

  async function fetchData() {
    const [slotsRes, demandesRes] = await Promise.all([
      fetch('/api/disponibilites'),
      fetch('/api/demandes')
    ])
    setSlots(await slotsRes.json())
    setDemandes(await demandesRes.json())
  }

  async function checkPassword() {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (res.ok) {
      setAuthenticated(true)
    } else {
      alert('Mot de passe incorrect')
    }
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault()

    const details: any = {}
    if (newSlot.horaires) details.horaires = newSlot.horaires
    if (newSlot.patients) details.patients = parseInt(newSlot.patients)
    if (newSlot.soins) details.types_soins = newSlot.soins.split(',').map(s => s.trim()).filter(s => s)
    if (newSlot.commentaire) details.commentaire = newSlot.commentaire

    await fetch('/api/disponibilites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: newSlot.date,
        periode: newSlot.periode,
        statut: 'disponible',
        details: Object.keys(details).length > 0 ? details : null
      })
    })

    setNewSlot({ date: '', periode: 'matin', horaires: '', patients: '', soins: '', commentaire: '' })
    fetchData()
  }

  async function updateSlotStatus(id: string, statut: string) {
    await fetch(`/api/disponibilites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut })
    })
    fetchData()
  }

  async function deleteSlot(id: string) {
    if (!confirm('Supprimer cette disponibilité ?')) return
    await fetch(`/api/disponibilites/${id}`, { method: 'DELETE' })
    fetchData()
  }

  if (checking) {
    return null
  }

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>🔐 Accès Admin</h2>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe"
          style={{ width: '100%', padding: '0.75rem', margin: '1rem 0', border: '2px solid #ddd', borderRadius: 8 }}
          onKeyPress={e => e.key === 'Enter' && checkPassword()}
        />
        <button
          onClick={checkPassword}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: 'none',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Connexion
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <h1>📅 Dashboard Admin</h1>

      <div style={{ display: 'flex', gap: '1rem', margin: '2rem 0', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('slots')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'slots' ? '3px solid #667eea' : 'none',
            color: activeTab === 'slots' ? '#667eea' : '#666',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Disponibilités
        </button>
        <button
          onClick={() => setActiveTab('demandes')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'demandes' ? '3px solid #667eea' : 'none',
            color: activeTab === 'demandes' ? '#667eea' : '#666',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Demandes ({demandes.filter(d => d.statut === 'attente').length})
        </button>
      </div>

      {activeTab === 'slots' && (
        <div>
          <div style={{ background: 'white', padding: '2rem', borderRadius: 12, marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3>➕ Ajouter une disponibilité</h3>
            <form onSubmit={addSlot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={newSlot.date}

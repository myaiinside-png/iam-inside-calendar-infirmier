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
                  onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
              <div>
                <label>Période</label>
                <select
                  value={newSlot.periode}
                  onChange={e => setNewSlot({...newSlot, periode: e.target.value as 'matin' | 'apres-midi'})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  <option value="matin">Matin</option>
                  <option value="apres-midi">Après-midi</option>
                </select>
              </div>
              <div>
                <label>Horaires</label>
                <input
                  type="text"
                  value={newSlot.horaires}
                  onChange={e => setNewSlot({...newSlot, horaires: e.target.value})}
                  placeholder="08h00 - 14h00"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
              <div>
                <label>Patients estimé</label>
                <input
                  type="number"
                  value={newSlot.patients}
                  onChange={e => setNewSlot({...newSlot, patients: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Types de soins (séparés par virgule)</label>
                <input
                  type="text"
                  value={newSlot.soins}
                  onChange={e => setNewSlot({...newSlot, soins: e.target.value})}
                  placeholder="BSI, AMI, Pansements..."
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Commentaire / Aperçu tournée</label>
                <textarea
                  value={newSlot.commentaire}
                  onChange={e => setNewSlot({...newSlot, commentaire: e.target.value})}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#4CAF50',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>

          <div>
            <h3>Disponibilités actuelles</h3>
            {slots.length === 0 ? (
              <p>Aucune disponibilité.</p>
            ) : (
              slots.map(slot => {
                const dateObj = new Date(slot.date + 'T12:00:00')
                return (
                  <div key={slot._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    margin: '0.5rem 0',
                    background: 'white',
                    borderRadius: 8,
                    borderLeft: `4px solid ${
                      slot.statut === 'disponible' ? '#4CAF50' :
                      slot.statut === 'attente' ? '#FF9800' : '#f44336'
                    }`
                  }}>
                    <div>
                      <strong>{dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                      {' - '}
                      {slot.periode === 'matin' ? 'Matin' : 'Après-midi'}
                      {slot.details?.horaires && ` | ${slot.details.horaires}`}
                      {slot.details?.patients && ` | ${slot.details.patients} patients`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {slot.statut === 'attente' && (
                        <>
                          <button
                            onClick={() => updateSlotStatus(slot._id, 'reserve')}
                            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 4, background: '#4CAF50', color: 'white', cursor: 'pointer' }}
                          >
                            ✅ Valider
                          </button>
                          <button
                            onClick={() => updateSlotStatus(slot._id, 'disponible')}
                            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 4, background: '#f44336', color: 'white', cursor: 'pointer' }}
                          >
                            ❌ Refuser
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteSlot(slot._id)}
                        style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 4, background: '#eee', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'demandes' && (
        <div>
          <h3>Demandes reçues</h3>
          {demandes.length === 0 ? (
            <p>Aucune demande.</p>
          ) : (
            demandes.map(d => (
              <div key={d._id} style={{
                background: 'white',
                padding: '1.5rem',
                margin: '1rem 0',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <strong>{d.nom}</strong>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    background: d.statut === 'attente' ? '#fff3e0' : d.statut === 'validee' ? '#e8f5e9' : '#ffebee',
                    color: d.statut === 'attente' ? '#e65100' : d.statut === 'validee' ? '#2e7d32' : '#c62828'
                  }}>
                    {d.statut === 'attente' ? 'En attente' : d.statut === 'validee' ? 'Validée' : 'Refusée'}
                  </span>
                </div>
                <p>📧 {d.email} | 📞 {d.telephone}</p>
                <p>📅 {new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR')} - {d.periode === 'matin' ? 'Matin' : 'Après-midi'}</p>
                {d.horaires && <p>🕐 Horaires: {d.horaires}</p>}
                {d.nb_patients && <p>👥 Patients: {d.nb_patients}</p>}
                {d.soins && d.soins.length > 0 && <p>💉 Soins: {Array.isArray(d.soins) ? d.soins.join(', ') : d.soins}</p>}
                {d.commentaires && <p>📝 {d.commentaires}</p>}
                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                  Demande reçue le {new Date(d.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

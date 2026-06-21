'use client'

import { useState, useEffect, useMemo } from 'react'

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

const STATUT_COLORS: Record<string, string> = {
  disponible: '#4CAF50',
  attente: '#FF9800',
  reserve: '#f44336',
}

const STATUT_CYCLE: Record<string, 'disponible' | 'attente' | 'reserve'> = {
  disponible: 'attente',
  attente: 'reserve',
  reserve: 'disponible',
}

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toLocalDateStr(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'slots' | 'demandes'>('slots')
  const [slots, setSlots] = useState<Slot[]>([])
  const [demandes, setDemandes] = useState<Demande[]>([])

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const [editing, setEditing] = useState<{ date: string; periode: 'matin' | 'apres-midi' } | null>(null)
  const [formDetails, setFormDetails] = useState({ horaires: '', patients: '', soins: '', commentaire: '' })

  const [multiMode, setMultiMode] = useState(false)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [multiPeriode, setMultiPeriode] = useState<'matin' | 'apres-midi'>('matin')
  const [multiForm, setMultiForm] = useState({ horaires: '', patients: '', soins: '', commentaire: '' })
  const [applying, setApplying] = useState(false)

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

  const slotIndex = useMemo(() => {
    const idx = new Map<string, Slot>()
    for (const s of slots) {
      idx.set(`${s.date}_${s.periode}`, s)
    }
    return idx
  }, [slots])

  function buildDetailsPayload(d: { horaires: string; patients: string; soins: string; commentaire: string }) {
    const details: any = {}
    if (d.horaires) details.horaires = d.horaires
    if (d.patients) details.patients = parseInt(d.patients)
    if (d.soins) details.types_soins = d.soins.split(',').map(s => s.trim()).filter(Boolean)
    if (d.commentaire) details.commentaire = d.commentaire
    return Object.keys(details).length > 0 ? details : null
  }

  async function createSlot(date: string, periode: 'matin' | 'apres-midi', details: any) {
    await fetch('/api/disponibilites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, periode, statut: 'disponible', details })
    })
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
    await fetch(`/api/disponibilites/${id}`, { method: 'DELETE' })
    fetchData()
  }

  function handleCellClick(dateStr: string, periode: 'matin' | 'apres-midi') {
    if (multiMode) {
      setSelectedDays(prev => {
        const next = new Set(prev)
        if (next.has(dateStr)) {
          next.delete(dateStr)
        } else {
          next.add(dateStr)
        }
        return next
      })
      return
    }

    const existing = slotIndex.get(`${dateStr}_${periode}`)
    if (existing) {
      updateSlotStatus(existing._id, STATUT_CYCLE[existing.statut])
    } else {
      setEditing({ date: dateStr, periode })
      setFormDetails({ horaires: '', patients: '', soins: '', commentaire: '' })
    }
  }

  async function submitEditForm(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    await createSlot(editing.date, editing.periode, buildDetailsPayload(formDetails))
    setEditing(null)
    fetchData()
  }

  async function applyMultiSelection() {
    if (selectedDays.size === 0) return
    setApplying(true)
    const details = buildDetailsPayload(multiForm)
    try {
      await Promise.all(
        Array.from(selectedDays).map(dateStr => {
          const existing = slotIndex.get(`${dateStr}_${multiPeriode}`)
          if (existing) return Promise.resolve()
          return createSlot(dateStr, multiPeriode, details)
        })
      )
      setSelectedDays(new Set())
      setMultiForm({ horaires: '', patients: '', soins: '', commentaire: '' })
      setMultiMode(false)
      await fetchData()
    } finally {
      setApplying(false)
    }
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setViewMonth(m)
    setViewYear(y)
  }

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7

    const cells: (number | null)[] = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  if (checking) return null

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
          style={{ width: '100%', padding: '0.75rem', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
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
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'slots' ? '3px solid #667eea' : 'none', color: activeTab === 'slots' ? '#667eea' : '#666', fontWeight: 600, cursor: 'pointer' }}
        >
          Disponibilités
        </button>
        <button
          onClick={() => setActiveTab('demandes')}
          style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', borderBottom: activeTab === 'demandes' ? '3px solid #667eea' : 'none', color: activeTab === 'demandes' ? '#667eea' : '#666', fontWeight: 600, cursor: 'pointer' }}
        >
          Demandes ({demandes.filter(d => d.statut === 'attente').length})
        </button>
      </div>

      {activeTab === 'slots' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => changeMonth(-1)} style={navBtnStyle}>←</button>
              <strong style={{ fontSize: '1.2rem', minWidth: 160, textAlign: 'center' }}>
                {MOIS_FR[viewMonth]} {viewYear}
              </strong>
              <button onClick={() => changeMonth(1)} style={navBtnStyle}>→</button>
            </div>

            <button
              onClick={() => {
                setMultiMode(m => !m)
                setSelectedDays(new Set())
              }}
              style={{
                padding: '0.6rem 1.2rem',
                border: 'none',
                borderRadius: 8,
                background: multiMode ? '#667eea' : '#eee',
                color: multiMode ? 'white' : '#333',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {multiMode ? '✓ Mode sélection multiple actif' : '☐ Sélection multiple'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <span><span style={{ ...legendDot, background: STATUT_COLORS.disponible }} /> Disponible</span>
            <span><span style={{ ...legendDot, background: STATUT_COLORS.attente }} /> En attente</span>
            <span><span style={{ ...legendDot, background: STATUT_COLORS.reserve }} /> Réservé</span>
            <span><span style={{ ...legendDot, background: '#e0e0e0' }} /> Vide (cliquer pour ajouter)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {JOURS_FR.map(j => (
              <div key={j} style={{ textAlign: 'center', fontWeight: 600, color: '#666', fontSize: '0.85rem' }}>{j}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={i} />

              const dateStr = toLocalDateStr(viewYear, viewMonth, day)
              const matinSlot = slotIndex.get(`${dateStr}_matin`)
              const apremSlot = slotIndex.get(`${dateStr}_apres-midi`)
              const isSelected = selectedDays.has(dateStr)
              const isToday = dateStr === toLocalDateStr(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <div
                  key={dateStr}
                  style={{
                    border: isSelected ? '2px solid #667eea' : isToday ? '2px solid #999' : '1px solid #ddd',
                    borderRadius: 8,
                    overflow: 'hidden',
                    minHeight: 70,
                    background: 'white',
                    cursor: multiMode ? 'pointer' : 'default',
                  }}
                  onClick={multiMode ? () => handleCellClick(dateStr, 'matin') : undefined}
                >
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', padding: '2px 0', background: isSelected ? '#667eea' : '#f5f5f5', color: isSelected ? 'white' : '#333' }}>
                    {day}
                  </div>
                  {!multiMode && (
                    <div style={{ display: 'flex', height: 44 }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); handleCellClick(dateStr, 'matin') }}
                        title="Matin"
                        style={{
                          flex: 1,
                          background: matinSlot ? STATUT_COLORS[matinSlot.statut] : '#f0f0f0',
                          opacity: matinSlot ? 0.85 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          color: matinSlot ? 'white' : '#aaa',
                          cursor: 'pointer',
                          borderRight: '1px solid #fff'
                        }}
                      >
                        M
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); handleCellClick(dateStr, 'apres-midi') }}
                        title="Après-midi"
                        style={{
                          flex: 1,
                          background: apremSlot ? STATUT_COLORS[apremSlot.statut] : '#f0f0f0',
                          opacity: apremSlot ? 0.85 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          color: apremSlot ? 'white' : '#aaa',
                          cursor: 'pointer',
                        }}
                      >
                        AM
                      </div>
                    </div>
                  )}
                  {multiMode && (
                    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected ? '✓' : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {multiMode && selectedDays.size > 0 && (
            <div style={{ marginTop: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3>Appliquer à {selectedDays.size} jour{selectedDays.size > 1 ? 's' : ''} sélectionné{selectedDays.size > 1 ? 's' : ''}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label>Période</label>
                  <select value={multiPeriode} onChange={e => setMultiPeriode(e.target.value as any)} style={inputStyle}>
                    <option value="matin">Matin</option>
                    <option value="apres-midi">Après-midi</option>
                  </select>
                </div>
                <div>
                  <label>Horaires</label>
                  <input type="text" value={multiForm.horaires} onChange={e => setMultiForm({ ...multiForm, horaires: e.target.value })} placeholder="08h00 - 14h00" style={inputStyle} />
                </div>
                <div>
                  <label>Patients estimé</label>
                  <input type="number" value={multiForm.patients} onChange={e => setMultiForm({ ...multiForm, patients: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Types de soins (séparés par virgule)</label>
                  <input type="text" value={multiForm.soins} onChange={e =>

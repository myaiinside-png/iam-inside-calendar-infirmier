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

export default function CalendarPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    horaires: '',
    nb_patients: '',
    soins: [] as string[],
    commentaires: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSlots()
  }, [])

  async function fetchSlots() {
    try {
      const res = await fetch('/api/disponibilites')
      const data = await res.json()
      setSlots(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openModal(slot: Slot) {
    if (slot.statut !== 'disponible') return
    setSelectedSlot(slot)
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      horaires: slot.details?.horaires || '',
      nb_patients: slot.details?.patients?.toString() || '',
      soins: slot.details?.types_soins || [],
      commentaires: ''
    })
    setMessage('')
  }

  function closeModal() {
    setSelectedSlot(null)
    setMessage('')
  }

  function handleSoinChange(soin: string) {
    setFormData(prev => ({
      ...prev,
      soins: prev.soins.includes(soin)
        ? prev.soins.filter(s => s !== soin)
        : [...prev.soins, soin]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot._id,
          date: selectedSlot.date,
          periode: selectedSlot.periode,
          ...formData,
          nb_patients: parseInt(formData.nb_patients) || undefined
        })
      })
      
      if (res.ok) {
        setMessage('✅ Demande envoyée ! Je vous recontacte rapidement.')
        setTimeout(() => {
          closeModal()
          fetchSlots()
        }, 3000)
      } else {
        throw new Error('Erreur serveur')
      }
    } catch (err) {
      setMessage('❌ Erreur. Réessayez ou contactez-moi directement.')
    } finally {
      setSubmitting(false)
    }
  }

  const parDate: Record<string, Slot[]> = {}
  slots.forEach(s => {
    if (!parDate[s.date]) parDate[s.date] = []
    parDate[s.date].push(s)
  })
  
  const dates = Object.keys(parDate).sort()

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>

  return (
    <div>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1>🩺 Remplacements Infirmiers</h1>
        <p>Consultez les disponibilités et faites votre demande</p>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '1rem 0', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#4CAF50' }}></div>
            <span>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FF9800' }}></div>
            <span>En attente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#f44336' }}></div>
            <span>Réservé</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {dates.map(date => {
            const dateObj = new Date(date + 'T12:00:00')
            const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            
            return (
              <div key={date} style={{
                background: 'white',
                borderRadius: 12,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #eee'
                }}>
                  {dateStr}
                </div>
                
                {parDate[date].map(slot => {
                  const periodeLabel = slot.periode === 'matin' ? '🌅 Matin' : '🌇 Après-midi'
                  const statusColors = {
                    disponible: { bg: '#e8f5e9', border: '#4CAF50', label: 'Disponible' },
                    attente: { bg: '#fff3e0', border: '#FF9800', label: 'En attente' },
                    reserve: { bg: '#ffebee', border: '#f44336', label: 'Réservé' }
                  }
                  const colors = statusColors[slot.statut]
                  
                  return (
                    <div
                      key={slot._id}
                      onClick={() => openModal(slot)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        margin: '0.5rem 0',
                        borderRadius: 8,
                        background: colors.bg,
                        borderLeft: `4px solid ${colors.border}`,
                        cursor: slot.statut === 'disponible' ? 'pointer' : 'default',
                        opacity: slot.statut === 'reserve' ? 0.7 : 1,
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={e => slot.statut === 'disponible' && (e.currentTarget.style.transform = 'translateX(5px)')}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      <div>
                        <strong>{periodeLabel}</strong>
                        {slot.details?.horaires && <div style={{ fontSize: '0.85rem', color: '#666' }}>{slot.details.horaires}</div>}
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 20,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: colors.border,
                        color: 'white'
                      }}>
                        {colors.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 16,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Demande de remplacement</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {selectedSlot.periode === 'matin' ? 'matin' : 'après-midi'}
            </p>

            {message && (
              <div style={{
                padding: '1rem',
                borderRadius: 8,
                marginBottom: '1rem',
                background: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                color: message.includes('✅') ? '#2e7d32' : '#c62828'
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Nom et Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Horaires souhaités</label>
                <input
                  type="text"
                  value={formData.horaires}
                  onChange={e => setFormData({...formData, horaires: e.target.value})}
                  placeholder="Ex: 08h00 - 16h00"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Nombre de patients estimé</label>
                <input
                  type="number"
                  min="1"
                  value={formData.nb_patients}
                  onChange={e => setFormData({...formData, nb_patients: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Types de soins / BSI / AMI</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {['BSI', 'AMI', 'Pansements', 'Injections', 'Prélèvements', 'Soins palliatifs', 'SSIAD', 'EHPAD'].map(soin => (
                    <label key={soin} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.soins.includes(soin)}
                        onChange={() => handleSoinChange(soin)}
                      />
                      {soin}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#555' }}>Aperçu de la tournée / Commentaires</label>
                <textarea
                  rows={4}
                  value={formData.commentaires}
                  onChange={e => setFormData({...formData, commentaires: e.target.value})}
                  placeholder="Décrivez le secteur, les particularités, le matériel nécessaire..."
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Envoi...' : 'Envoyer la demande'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    background: '#eee'
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

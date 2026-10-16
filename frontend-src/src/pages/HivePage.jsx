import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { hiveAPI } from '../api'
import HiveStack from '../components/HiveStack'
import { fmtDate } from '../lib/format'

const STATUS_CONFIG = {
  good:    { color: '#4A7C59', label: 'Mirë',    emoji: '' },
  problem: { color: '#F5A623', label: 'Problem', emoji: '' },
  dead:    { color: '#C0392B', label: 'Vdekur',  emoji: '' },
  empty:   { color: '#E8E8E8', label: 'Bosh',    emoji: '⬜' },
}

function AddFloorModal({ hiveId, onClose, onAdded }) {
  const [form, setForm] = useState({
    floor_number: '',
    frames_bees: 0,
    frames_eggs: 0,
    frames_honey: 0,
    frames_new: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await hiveAPI.addFloor(hiveId, form)
      onAdded(res.data.floor || res.data)
      onClose()
    } catch (err) {
      setError('Gabim duke shtuar katin.')
    } finally {
      setLoading(false)
    }
  }

  const intFields = [
    { key: 'frames_bees', label: 'Korniza me bletë' },
    { key: 'frames_eggs', label: 'Korniza me vezë' },
    { key: 'frames_honey', label: 'Korniza me mjaltë' },
    { key: 'frames_new', label: 'Korniza të reja' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Shto Kat</span>
          <button className="modal-close" onClick={onClose} aria-label="Mbyll">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Numri i Katit</label>
              <input type="number" className="form-control" min="1" max="20" value={form.floor_number}
                onChange={e => setForm(p => ({ ...p, floor_number: e.target.value }))} placeholder="1" autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {intFields.map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{f.label}</label>
                  <input type="number" className="form-control" min="0" max="50"
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))} />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Shënime</label>
              <textarea className="form-control" rows={2} value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Duke shtuar…' : 'Shto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FloorAccordion({ floor, hiveId, onUpdated, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...floor })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await hiveAPI.updateFloor(hiveId, floor.id, form)
      onUpdated(res.data.floor || res.data)
      setEditing(false)
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Fshi katin ${floor.floor_number}?`)) return
    try {
      await hiveAPI.deleteFloor(hiveId, floor.id)
      onDeleted(floor.id)
    } catch {}
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '0.5rem' }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          cursor: 'pointer',
          background: open ? 'var(--surface)' : 'var(--card)',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 750, color: 'var(--ink)', whiteSpace: 'nowrap' }}>Kati {floor.floor_number}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.9rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span><strong style={{ color: 'var(--ink)' }}>{floor.frames_bees}</strong> bletë</span>
            <span><strong style={{ color: 'var(--ink)' }}>{floor.frames_eggs}</strong> vezë</span>
            <span><strong style={{ color: 'var(--ink)' }}>{floor.frames_honey}</strong> mjaltë</span>
            <span><strong style={{ color: 'var(--ink)' }}>{floor.frames_new}</strong> të reja</span>
          </div>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          {editing ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {[
                  { key: 'frames_bees', label: 'Bletë' },
                  { key: 'frames_eggs', label: 'Vezë' },
                  { key: 'frames_honey', label: 'Mjaltë' },
                  { key: 'frames_new', label: 'Të reja' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>{f.label}</label>
                    <input type="number" className="form-control" min="0" max="50"
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
              </div>
              <textarea className="form-control" rows={2} value={form.notes || ''}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Shënime..." style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Anulo</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Duke ruajtur…' : 'Ruaj'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[
                  { label: 'Korniza me bletë', value: floor.frames_bees },
                  { label: 'Korniza me vezë', value: floor.frames_eggs },
                  { label: 'Korniza me mjaltë', value: floor.frames_honey },
                  { label: 'Korniza të reja', value: floor.frames_new },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', background: 'var(--card)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gold)' }}>{item.value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {floor.notes && (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>{floor.notes}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Fshi katin</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edito</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HivePage() {
  const { id } = useParams()
  const [hive, setHive] = useState(null)
  const [floors, setFloors] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [hiveRes, floorsRes, visitsRes] = await Promise.all([
        hiveAPI.get(id),
        hiveAPI.floors(id),
        hiveAPI.visits(id),
      ])
      setHive(hiveRes.data.hive || hiveRes.data)
      setFloors(floorsRes.data.floors || floorsRes.data || [])
      setVisits((visitsRes.data.visits || visitsRes.data || []).slice(0, 5))
    } catch {
      setError('Koshera nuk u gjet.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (error) return <div className="page-content"><div className="container"><div className="alert alert-error">{error}</div></div></div>

  const st = STATUS_CONFIG[hive?.status] || STATUS_CONFIG.empty

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/dashboard">Kopshtet</Link>
          <span className="breadcrumb-sep">/</span>
          {hive?.apiary_id && <Link to={`/apiary/${hive.apiary_id}`}>Kopshti</Link>}
          {hive?.apiary_id && <span className="breadcrumb-sep">/</span>}
          <span>{hive?.code}</span>
        </nav>

        {/* Hive Header */}
        <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <HiveStack seed={hive.id} floors={floors?.length || 1} status={hive.status} queenless={!hive.queen_present} width={56} />
              <div>
                <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>Kosherja <span className="stencil">{hive.position_row}-{hive.position_col}</span></h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: `${st.color}20`,
                    color: hive.status === 'empty' ? 'var(--muted)' : st.color,
                  }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {hive.queen_present ? 'Mbretëresha e pranishme' : 'Pa mbretëreshë'}
                  </span>
                  {hive.queen_age_months && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {hive.queen_age_months} muajshe
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hive.notes && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--muted)' }}>
              {hive.notes}
            </div>
          )}
        </div>

        {/* Floors Section */}
        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Katet ({floors.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddFloor(true)}>
              + Shto kat
            </button>
          </div>

          {floors.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}></div>
              <h3>Nuk ka kate</h3>
              <p style={{ marginBottom: '1rem' }}>Shto katin e parë të kosheres</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddFloor(true)}>+ Shto kat</button>
            </div>
          ) : (
            <div>
              {[...floors].sort((a, b) => (a.floor_number || 0) - (b.floor_number || 0)).map(floor => (
                <FloorAccordion
                  key={floor.id}
                  floor={floor}
                  hiveId={id}
                  onUpdated={updated => setFloors(prev => prev.map(f => f.id === updated.id ? updated : f))}
                  onDeleted={fId => setFloors(prev => prev.filter(f => f.id !== fId))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="section">
          <h2 className="section-title">Vizitat e fundit</h2>
          {visits.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>Nuk ka vizita të regjistruara ende.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visits.map(v => (
                <div key={v.id} className="card card-body" style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {fmtDate(v.visit_date)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {v.status && (
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          background: `${(STATUS_CONFIG[v.status] || STATUS_CONFIG.empty).color}20`,
                          color: (STATUS_CONFIG[v.status] || STATUS_CONFIG.empty).color,
                          fontWeight: 600,
                        }}>
                          {(STATUS_CONFIG[v.status] || STATUS_CONFIG.empty).label}
                        </span>
                      )}
                    </div>
                  </div>
                  {v.notes && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.35rem', marginBottom: 0 }}>{v.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddFloor && (
        <AddFloorModal
          hiveId={id}
          onClose={() => setShowAddFloor(false)}
          onAdded={floor => setFloors(prev => [...prev, floor])}
        />
      )}
    </div>
  )
}

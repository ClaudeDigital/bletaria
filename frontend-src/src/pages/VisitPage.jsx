import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiaryAPI, hiveAPI, visitAPI } from '../api'

const STATUS_OPTIONS = [
  { value: 'good',    label: '✅ Mirë',    color: '#4A7C59' },
  { value: 'problem', label: '⚠️ Problem', color: '#F5A623' },
  { value: 'dead',    label: '💀 Vdekur',  color: '#C0392B' },
  { value: 'empty',   label: '⬜ Bosh',    color: '#aaa' },
]

export default function VisitPage() {
  const { id: apiaryId } = useParams()
  const navigate = useNavigate()
  const [apiary, setApiary] = useState(null)
  const [hives, setHives] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [visitDate, setVisitDate] = useState(today)
  const [visitNotes, setVisitNotes] = useState('')
  const [expanded, setExpanded] = useState({})
  // hiveData: { [hiveId]: { status, queen_present, queen_age, notes, floors: [{...}] } }
  const [hiveData, setHiveData] = useState({})

  useEffect(() => {
    loadData()
  }, [apiaryId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [apiaryRes, hivesRes] = await Promise.all([
        apiaryAPI.get(apiaryId),
        hiveAPI.list(apiaryId),
      ])
      const apData = apiaryRes.data.apiary || apiaryRes.data
      const hvData = hivesRes.data.hives || hivesRes.data || []
      setApiary(apData)
      setHives(Array.isArray(hvData) ? hvData : [])

      // Initialize hiveData
      const init = {}
      for (const h of hvData) {
        init[h.id] = {
          status: h.status || 'good',
          queen_present: h.queen_present !== false,
          queen_age: h.queen_age_months || '',
          notes: '',
          floors: [],
        }
      }
      setHiveData(init)
    } catch {
      setError('Kopshti nuk u gjet.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (hiveId) => {
    setExpanded(prev => ({ ...prev, [hiveId]: !prev[hiveId] }))
  }

  const updateHive = (hiveId, field, value) => {
    setHiveData(prev => ({
      ...prev,
      [hiveId]: { ...prev[hiveId], [field]: value }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        apiary_id: apiaryId,
        visit_date: visitDate,
        notes: visitNotes,
        hive_visits: Object.entries(hiveData).map(([hiveId, data]) => ({
          hive_id: parseInt(hiveId),
          status: data.status,
          queen_present: data.queen_present,
          queen_age_months: data.queen_age ? parseInt(data.queen_age) : null,
          notes: data.notes,
        }))
      }
      await visitAPI.create(payload)
      setSuccess(true)
      setTimeout(() => navigate(`/apiary/${apiaryId}`), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim duke ruajtur vizitën.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/dashboard">🏠 Dashboard</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/apiary/${apiaryId}`}>🏡 {apiary?.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <span>📝 Vizitë e Re</span>
        </nav>

        <div className="page-header">
          <h1 className="page-title">📝 Regjistro Vizitë</h1>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ Vizita u ruajt me sukses! Duke u kthyer...</div>}

        <form onSubmit={handleSubmit}>
          {/* General info */}
          <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Të dhënat e Vizitës</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📅 Data</label>
                <input type="date" className="form-control" value={visitDate}
                  onChange={e => setVisitDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🏡 Kopshti</label>
                <input type="text" className="form-control" value={apiary?.name || ''} readOnly
                  style={{ background: 'var(--surface)', cursor: 'default' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <label className="form-label">📝 Shënime të Përgjithshme</label>
              <textarea className="form-control" rows={2} value={visitNotes}
                onChange={e => setVisitNotes(e.target.value)}
                placeholder="Vëzhgime të përgjithshme për kopshtin sot..." />
            </div>
          </div>

          {/* Hives */}
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            🐝 Koshereat ({hives.length})
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
              — Kliko për të zgjeruar çdo koshère
            </span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {hives.map(hive => {
              const data = hiveData[hive.id] || {}
              const isOpen = expanded[hive.id]
              const stColor = STATUS_OPTIONS.find(s => s.value === data.status)?.color || '#aaa'

              return (
                <div key={hive.id} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  {/* Hive header */}
                  <div
                    onClick={() => toggleExpand(hive.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      background: isOpen ? 'var(--surface)' : 'var(--card)',
                      transition: 'background 0.15s',
                      borderLeft: `4px solid ${stColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700 }}>{hive.code}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        background: `${stColor}20`,
                        color: stColor,
                      }}>
                        {STATUS_OPTIONS.find(s => s.value === data.status)?.label || '—'}
                      </span>
                      {data.queen_present
                        ? <span style={{ fontSize: '0.8rem' }}>👑</span>
                        : <span style={{ fontSize: '0.8rem' }}>⚠️ Pa mbretëreshë</span>
                      }
                    </div>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </div>

                  {/* Hive form */}
                  {isOpen && (
                    <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateHive(hive.id, 'status', opt.value)}
                            style={{
                              padding: '0.5rem 0.25rem',
                              border: `2px solid ${data.status === opt.value ? opt.color : 'var(--border)'}`,
                              borderRadius: 'var(--radius-sm)',
                              background: data.status === opt.value ? `${opt.color}15` : 'var(--bg)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: data.status === opt.value ? opt.color : 'var(--muted)',
                              transition: 'all 0.15s',
                            }}
                          >{opt.label}</button>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>👑 Mbretëresha</label>
                          <select className="form-control" value={data.queen_present ? 'po' : 'jo'}
                            onChange={e => updateHive(hive.id, 'queen_present', e.target.value === 'po')}
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                            <option value="po">✅ E pranishme</option>
                            <option value="jo">⚠️ Mungon</option>
                          </select>
                        </div>
                        {data.queen_present && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.78rem' }}>📅 Mosha (muaj)</label>
                            <input type="number" className="form-control" min="0" max="60"
                              value={data.queen_age}
                              onChange={e => updateHive(hive.id, 'queen_age', e.target.value)}
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                              placeholder="0" />
                          </div>
                        )}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>📝 Shënime</label>
                        <textarea className="form-control" rows={2} value={data.notes}
                          onChange={e => updateHive(hive.id, 'notes', e.target.value)}
                          placeholder="Vëzhgime specifike për këtë koshère..."
                          style={{ fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quick actions row */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', alignSelf: 'center' }}>Vendos statusi për të gjitha:</span>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setHiveData(prev => {
                    const updated = { ...prev }
                    Object.keys(updated).forEach(hId => {
                      updated[hId] = { ...updated[hId], status: opt.value }
                    })
                    return updated
                  })
                }}
                style={{ fontSize: '0.78rem' }}
              >{opt.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to={`/apiary/${apiaryId}`} className="btn btn-ghost">Anulo</Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? '⏳ Duke ruajtur...' : '💾 Ruaj Vizitën'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

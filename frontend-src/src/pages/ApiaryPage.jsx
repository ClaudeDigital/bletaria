import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { apiaryAPI, hiveAPI } from '../api'

const STATUS_CONFIG = {
  good:    { color: '#4A7C59', label: 'Mirë',    emoji: '✅' },
  problem: { color: '#F5A623', label: 'Problem', emoji: '⚠️' },
  dead:    { color: '#C0392B', label: 'Vdekur',  emoji: '💀' },
  empty:   { color: '#E8E8E8', label: 'Bosh',    emoji: '⬜' },
}

function HiveSquare({ hive, onClick, size = 76 }) {
  const st = STATUS_CONFIG[hive.status] || STATUS_CONFIG.empty
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const emptyColor = isDark ? '#444' : '#E8E8E8'
  const textColor = hive.status === 'empty' ? '#999' : 'white'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onClick(hive)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: size,
        height: size,
        background: hive.status === 'empty' ? emptyColor : st.color,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: hovered ? '2px solid var(--gold)' : '2px solid transparent',
        transition: 'all 0.15s ease',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
        position: 'relative',
        userSelect: 'none',
      }}
      title={`${hive.code} — ${st.label}`}
    >
      <span style={{ fontSize: size > 60 ? '0.7rem' : '0.58rem', fontWeight: 700, color: textColor, lineHeight: 1 }}>
        {hive.code}
      </span>
      {size > 55 && (
        <span style={{ fontSize: '0.8rem', marginTop: '2px' }}>
          {hive.queen_present ? '👑' : hive.status !== 'empty' ? '⚠️' : ''}
        </span>
      )}
    </div>
  )
}

function HiveDetailModal({ hive, apiaryId, onClose, onUpdated }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState(hive.status || 'good')
  const [queen, setQueen] = useState(hive.queen_present ? 'po' : 'jo')
  const [queenAge, setQueenAge] = useState(hive.queen_age_months || '')
  const [notes, setNotes] = useState(hive.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await hiveAPI.update(hive.id, {
        status,
        queen_present: queen === 'po',
        queen_age_months: queenAge ? parseInt(queenAge) : null,
        notes,
      })
      onUpdated(res.data.hive || res.data)
      onClose()
    } catch (err) {
      setError('Gabim duke ruajtur.')
    } finally {
      setSaving(false)
    }
  }

  const st = STATUS_CONFIG[status] || STATUS_CONFIG.good

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🐝 Koshère {hive.code}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
          }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: st.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{st.emoji} {st.label}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Statusi</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  style={{
                    padding: '0.5rem 0.25rem',
                    border: `2px solid ${status === key ? cfg.color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: status === key ? `${cfg.color}20` : 'var(--bg)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: status === key ? cfg.color : 'var(--muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cfg.emoji}<br />{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {status !== 'empty' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">👑 Mbretëresha</label>
                  <select className="form-control" value={queen} onChange={e => setQueen(e.target.value)}>
                    <option value="po">✅ E pranishme</option>
                    <option value="jo">⚠️ Mungon</option>
                  </select>
                </div>
                {queen === 'po' && (
                  <div className="form-group">
                    <label className="form-label">📅 Mosha (muaj)</label>
                    <input type="number" className="form-control" min="0" max="60" value={queenAge}
                      onChange={e => setQueenAge(e.target.value)} placeholder="p.sh. 12" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={notes !== ''}
                    onChange={e => { if (!e.target.checked) setNotes('') }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  📝 Shto Shënim
                </label>
                {notes !== '' || (
                  <button type="button" style={{ fontSize: '0.8rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => setNotes(' ')}>+ Shto shënim</button>
                )}
                {notes !== '' && (
                  <textarea className="form-control" rows={2} value={notes}
                    onChange={e => setNotes(e.target.value)} placeholder="Shënime për këtë koshère..." autoFocus />
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <Link to={`/hive/${hive.id}`} className="btn btn-ghost btn-sm" onClick={onClose}>
            📋 Shiko Detajet
          </Link>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Anulo</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳' : '💾 Ruaj'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ApiaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [apiary, setApiary] = useState(null)
  const [hives, setHives] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHive, setSelectedHive] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [apiaryRes, hivesRes] = await Promise.all([
        apiaryAPI.get(id),
        hiveAPI.list(id),
      ])
      setApiary(apiaryRes.data.apiary || apiaryRes.data)
      const h = hivesRes.data.hives || hivesRes.data || []
      setHives(Array.isArray(h) ? h : [])
    } catch {
      setError('Kopshti nuk u gjet.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApiary = async () => {
    try {
      await apiaryAPI.delete(id)
      navigate('/dashboard')
    } catch {
      setError('Gabim duke fshirë kopshtin.')
    }
    setShowDeleteConfirm(false)
  }

  const handleHiveUpdated = (updated) => {
    setHives(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h))
  }

  // Group hives by row
  const rows = apiary ? apiary.rows || 1 : 1
  const hivesPerRow = apiary ? apiary.hives_per_row || 1 : 1
  const hiveGrid = []
  for (let r = 0; r < rows; r++) {
    hiveGrid.push(hives.slice(r * hivesPerRow, (r + 1) * hivesPerRow))
  }

  const statusCounts = hives.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <div className="loading-center"><div className="spinner" /></div>
  )

  if (error) return (
    <div className="page-content">
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link to="/dashboard" className="btn btn-ghost">← Kthehu</Link>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/dashboard">🏠 Dashboard</Link>
          <span className="breadcrumb-sep">›</span>
          <span>🏡 {apiary?.name}</span>
        </nav>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{apiary?.name}</h1>
            {apiary?.location && (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>📍 {apiary.location}</p>
            )}
          </div>
          <div className="page-actions">
            <Link to={`/apiary/${id}/visit`} className="btn btn-primary">📝 Shto Vizitë</Link>
            <Link to={`/apiary/${id}/feeding`} className="btn btn-green">🌿 Plan Ushqimi</Link>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteConfirm(true)}
              title="Fshi Kopsht"
            >🗑</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{hives.length}</div>
            <div className="stat-label">Gjithsej Koshere</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#4A7C59' }}>{statusCounts.good || 0}</div>
            <div className="stat-label">✅ Mirë</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#F5A623' }}>{statusCounts.problem || 0}</div>
            <div className="stat-label">⚠️ Problem</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#C0392B' }}>{statusCounts.dead || 0}</div>
            <div className="stat-label">💀 Vdekur</div>
          </div>
        </div>

        {/* Hive Grid */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🐝 Koshereat — {rows} rreshta × {hivesPerRow} = {hives.length}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: cfg.color, border: key === 'empty' ? '1px solid #ccc' : 'none' }} />
                  {cfg.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 'fit-content' }}>
              {hiveGrid.map((row, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                    {rIdx + 1}
                  </span>
                  {row.map(hive => (
                    <HiveSquare
                      key={hive.id}
                      hive={hive}
                      onClick={setSelectedHive}
                      size={window.innerWidth < 480 ? 52 : 76}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        {apiary?.notes && (
          <div className="card card-body" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--muted)' }}>📝 Shënime</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>{apiary.notes}</p>
          </div>
        )}

        {/* Hive list table */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">📋 Lista e Koshereve</div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Kodi</th>
                  <th>Statusi</th>
                  <th>Mbretëresha</th>
                  <th>Mosha</th>
                  <th>Katet</th>
                  <th>Veprime</th>
                </tr>
              </thead>
              <tbody>
                {hives.map(h => {
                  const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.empty
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 700 }}>{h.code}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: `${st.color}20`,
                          color: h.status === 'empty' ? 'var(--muted)' : st.color,
                        }}>
                          {st.emoji} {st.label}
                        </span>
                      </td>
                      <td>{h.queen_present ? '👑 Po' : <span style={{ color: 'var(--red)' }}>⚠️ Jo</span>}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {h.queen_age_months ? `${h.queen_age_months} muaj` : '—'}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{h.floor_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedHive(h)}>✏️</button>
                          <Link to={`/hive/${h.id}`} className="btn btn-ghost btn-sm">📋</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hive Detail Modal */}
      {selectedHive && (
        <HiveDetailModal
          hive={selectedHive}
          apiaryId={id}
          onClose={() => setSelectedHive(null)}
          onUpdated={(updated) => {
            handleHiveUpdated(updated)
            setSelectedHive(null)
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">🗑 Fshi Kopsht</span>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>A jeni i sigurt që doni të fshini kopshtin <strong>{apiary?.name}</strong>? Kjo veprim nuk mund të kthehet.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Anulo</button>
              <button className="btn btn-danger" onClick={handleDeleteApiary}>🗑 Fshi Përgjithmonë</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

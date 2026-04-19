import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiaryAPI } from '../api'
import { useAuth } from '../context/AuthContext'

function AddApiaryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', rows: 3, hives_per_row: 5, location: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { setError('Emri i kopshtit është i detyrueshëm.'); return }
    setLoading(true)
    try {
      const res = await apiaryAPI.create(form)
      onCreated(res.data.apiary || res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim. Provo sërish.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🏡 Shto Kopsht të Ri</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <div className="form-group">
              <label className="form-label">Emri i Kopshtit *</label>
              <input type="text" className="form-control" placeholder="p.sh. Kopshti i Malit" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Rreshta</label>
                <input type="number" className="form-control" min="1" max="20" value={form.rows}
                  onChange={e => setForm(p => ({ ...p, rows: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Koshere/Rresht</label>
                <input type="number" className="form-control" min="1" max="30" value={form.hives_per_row}
                  onChange={e => setForm(p => ({ ...p, hives_per_row: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">📍 Vendndodhja</label>
              <input type="text" className="form-control" placeholder="p.sh. Vermosh, Shkodër" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">📝 Shënime</label>
              <textarea className="form-control" placeholder="Shënime opsionale..." value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(245,166,35,0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(245,166,35,0.15)',
              fontSize: '0.82rem',
              color: 'var(--muted)',
            }}>
              🐝 Kopsht me {form.rows} × {form.hives_per_row} = <strong>{form.rows * form.hives_per_row} koshere</strong> do të krijohet automatikisht
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Duke krijuar...' : '🏡 Krijo Kopsht'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApiaryCard({ apiary, onDelete }) {
  const statusCounts = apiary.status_summary || { good: 0, problem: 0, dead: 0, empty: 0 }
  const total = apiary.total_hives || 0

  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Color bar based on health */}
      <div style={{
        height: '5px',
        background: statusCounts.problem > 0 || statusCounts.dead > 0
          ? 'linear-gradient(90deg, var(--green), var(--gold), var(--red))'
          : 'linear-gradient(90deg, var(--green), var(--green-light))',
      }} />

      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{apiary.name}</h3>
            {apiary.location && (
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {apiary.location}</span>
            )}
          </div>
          <div style={{
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.3rem 0.6rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--gold-dark)',
          }}>
            {total} 🐝
          </div>
        </div>

        {/* Hive status mini-grid */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {statusCounts.good > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--green)' }} />
              {statusCounts.good} mirë
            </div>
          )}
          {statusCounts.problem > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--gold-dark)', fontWeight: 600 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--gold)' }} />
              {statusCounts.problem} problem
            </div>
          )}
          {statusCounts.dead > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--red)' }} />
              {statusCounts.dead} vdekur
            </div>
          )}
          {statusCounts.empty > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#E8E8E8', border: '1px solid #ccc' }} />
              {statusCounts.empty} bosh
            </div>
          )}
        </div>

        {apiary.last_visit && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            🗓 Vizita e fundit: {new Date(apiary.last_visit).toLocaleDateString('sq-AL')}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/apiary/${apiary.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
            🏡 Hap Kopsht
          </Link>
          <Link to={`/apiary/${apiary.id}/visit`} className="btn btn-ghost btn-sm">
            📝
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apiaries, setApiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState({ total_apiaries: 0, total_hives: 0, last_visit: null })

  useEffect(() => {
    loadApiaries()
  }, [])

  const loadApiaries = async () => {
    setLoading(true)
    try {
      const res = await apiaryAPI.list()
      const data = res.data.apiaries || res.data || []
      setApiaries(Array.isArray(data) ? data : [])

      // Compute stats
      const total_hives = data.reduce((s, a) => s + (a.total_hives || 0), 0)
      setStats({ total_apiaries: data.length, total_hives })

      // Redirect if exactly 1 apiary
      if (data.length === 1) {
        navigate(`/apiary/${data[0].id}`, { replace: true })
      }
    } catch {
      setApiaries([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreated = (newApiary) => {
    setApiaries(prev => [...prev, newApiary])
    if (newApiary.id) navigate(`/apiary/${newApiary.id}`)
  }

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
      <span style={{ color: 'var(--muted)' }}>Duke ngarkuar kopshtet...</span>
    </div>
  )

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              🏡 Kopshtet e Mia
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Mirë se erdhe, {user?.name?.split(' ')[0]}! 🐝
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Shto Kopsht
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total_apiaries}</div>
            <div className="stat-label">Kopshte</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_hives}</div>
            <div className="stat-label">Koshere</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {apiaries.filter(a => (a.status_summary?.problem || 0) > 0 || (a.status_summary?.dead || 0) > 0).length}
            </div>
            <div className="stat-label" style={{ color: 'var(--red)' }}>Kope me Problem</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🌟</div>
            <div className="stat-label">{user?.experience === 'ekspert' ? 'Ekspert' : user?.experience === 'mesem' ? 'Mesatar' : 'Fillestar'}</div>
          </div>
        </div>

        {/* Apiaries Grid */}
        {apiaries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏡</div>
            <h3>Nuk ke ende kopshte</h3>
            <p style={{ marginBottom: '1.5rem' }}>Krijo kopshtin tënd të parë të bletarisë</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAddModal(true)}>
              🐝 Shto Kopsht të Parë
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {apiaries.map(a => (
              <ApiaryCard key={a.id} apiary={a} />
            ))}
            {/* Add new card */}
            <div
              className="card card-body"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                cursor: 'pointer',
                border: '2px dashed var(--border)',
                background: 'transparent',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(245,166,35,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }}>+</div>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Shto Kopsht të Ri</span>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddApiaryModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

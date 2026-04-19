import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiaryAPI, hiveAPI, feedingAPI } from '../api'

function AddPlanModal({ apiaryId, hives, onClose, onAdded }) {
  const [form, setForm] = useState({
    plan_date: new Date().toISOString().slice(0, 10),
    description: '',
    selected_hives: [],
  })
  const [hiveDetails, setHiveDetails] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleHive = (hiveId) => {
    setForm(prev => {
      const sel = prev.selected_hives.includes(hiveId)
        ? prev.selected_hives.filter(id => id !== hiveId)
        : [...prev.selected_hives, hiveId]
      return { ...prev, selected_hives: sel }
    })
  }

  const updateHiveDetail = (hiveId, field, value) => {
    setHiveDetails(prev => ({
      ...prev,
      [hiveId]: { ...(prev[hiveId] || {}), [field]: value }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.plan_date) { setError('Data është e detyrueshme.'); return }
    if (form.selected_hives.length === 0) { setError('Zgjidh të paktën një koshère.'); return }
    setLoading(true)
    try {
      const payload = {
        apiary_id: apiaryId,
        plan_date: form.plan_date,
        description: form.description,
        hive_plans: form.selected_hives.map(hiveId => ({
          hive_id: hiveId,
          food_amount: hiveDetails[hiveId]?.food_amount || '',
          medicine: hiveDetails[hiveId]?.medicine || '',
          notes: hiveDetails[hiveId]?.notes || '',
        }))
      }
      const res = await feedingAPI.create(payload)
      onAdded(res.data.plan || res.data)
      onClose()
    } catch (err) {
      setError('Gabim duke ruajtur planin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <span className="modal-title">🌿 Plan i Ri Ushqimi</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">📅 Data</label>
                <input type="date" className="form-control" value={form.plan_date}
                  onChange={e => setForm(p => ({ ...p, plan_date: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">📝 Përshkrimi</label>
              <textarea className="form-control" rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="p.sh. Ushqim vjeshtë me shurup sheqeri..." />
            </div>

            <div className="form-group">
              <label className="form-label">🐝 Zgjidh Koshereat</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setForm(p => ({ ...p, selected_hives: hives.map(h => h.id) }))}>
                  Zgjidh të gjitha
                </button>
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setForm(p => ({ ...p, selected_hives: [] }))}>
                  Pastro
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {hives.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHive(h.id)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      border: `2px solid ${form.selected_hives.includes(h.id) ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: '20px',
                      background: form.selected_hives.includes(h.id) ? 'rgba(74,124,89,0.1)' : 'var(--bg)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: form.selected_hives.includes(h.id) ? 'var(--green)' : 'var(--muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {form.selected_hives.includes(h.id) ? '✅' : ''} {h.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Per-hive details */}
            {form.selected_hives.length > 0 && (
              <div>
                <label className="form-label">📋 Detajet per Koshère</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {form.selected_hives.map(hiveId => {
                    const hive = hives.find(h => h.id === hiveId)
                    const det = hiveDetails[hiveId] || {}
                    return (
                      <div key={hiveId} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          🐝 {hive?.code}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>🌿 Sasia ushqimit</label>
                            <input type="text" className="form-control" placeholder="p.sh. 500ml shurup"
                              value={det.food_amount || ''}
                              onChange={e => updateHiveDetail(hiveId, 'food_amount', e.target.value)}
                              style={{ padding: '0.4rem', fontSize: '0.82rem' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>💊 Ilaçi</label>
                            <input type="text" className="form-control" placeholder="p.sh. Api-Life Var"
                              value={det.medicine || ''}
                              onChange={e => updateHiveDetail(hiveId, 'medicine', e.target.value)}
                              style={{ padding: '0.4rem', fontSize: '0.82rem' }} />
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>📝 Shënime</label>
                          <input type="text" className="form-control" placeholder="Shënime specifike..."
                            value={det.notes || ''}
                            onChange={e => updateHiveDetail(hiveId, 'notes', e.target.value)}
                            style={{ padding: '0.4rem', fontSize: '0.82rem' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-green" disabled={loading}>
              {loading ? '⏳' : '💾 Ruaj Planin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PlanCard({ plan, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '0.75rem' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: expanded ? 'var(--surface)' : 'var(--card)',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(74,124,89,0.1)',
            color: 'var(--green)',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            📅 {plan.plan_date ? new Date(plan.plan_date).toLocaleDateString('sq-AL') : '—'}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {plan.description || 'Plan Ushqimi'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            🐝 {plan.hive_plans?.length || plan.hive_count || 0} koshere
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(plan.id) }}
            className="btn btn-danger btn-sm"
          >🗑</button>
          <span style={{ color: 'var(--muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>

      {expanded && plan.hive_plans && plan.hive_plans.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {plan.hive_plans.map((hp, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr 1fr',
                gap: '0.75rem',
                padding: '0.5rem',
                borderBottom: i < plan.hive_plans.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.82rem',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700 }}>🐝 {hp.hive_code || `#${hp.hive_id}`}</span>
                <span style={{ color: 'var(--muted)' }}>🌿 {hp.food_amount || '—'}</span>
                <span style={{ color: 'var(--muted)' }}>💊 {hp.medicine || '—'}</span>
                <span style={{ color: 'var(--muted)' }}>{hp.notes || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeedingPage() {
  const { id: apiaryId } = useParams()
  const [apiary, setApiary] = useState(null)
  const [hives, setHives] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [apiaryId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [apiaryRes, hivesRes, plansRes] = await Promise.all([
        apiaryAPI.get(apiaryId),
        hiveAPI.list(apiaryId),
        feedingAPI.list(apiaryId),
      ])
      setApiary(apiaryRes.data.apiary || apiaryRes.data)
      setHives(hivesRes.data.hives || hivesRes.data || [])
      setPlans(plansRes.data.plans || plansRes.data || [])
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId) => {
    if (!window.confirm('Fshi planin e ushqimit?')) return
    try {
      await feedingAPI.delete(planId)
      setPlans(prev => prev.filter(p => p.id !== planId))
    } catch {}
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <nav className="breadcrumb">
          <Link to="/dashboard">🏠 Dashboard</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/apiary/${apiaryId}`}>🏡 {apiary?.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <span>🌿 Plan Ushqimi</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="page-title">🌿 Planet e Ushqimit</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Ushqim, ilaçim dhe kujdesi për bletët</p>
          </div>
          <button className="btn btn-green" onClick={() => setShowAddModal(true)}>
            + Plan i Ri
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌿</div>
            <h3>Nuk ka plane ushqimi</h3>
            <p style={{ marginBottom: '1.5rem' }}>Krijo planin e parë të ushqimit për kopshtin tënd</p>
            <button className="btn btn-green btn-lg" onClick={() => setShowAddModal(true)}>
              🌿 Krijo Plan të Parë
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {plans.length} plan{plans.length !== 1 ? 'e' : ''} gjithsej
            </p>
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPlanModal
          apiaryId={apiaryId}
          hives={hives}
          onClose={() => setShowAddModal(false)}
          onAdded={plan => {
            setPlans(prev => [plan, ...prev])
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

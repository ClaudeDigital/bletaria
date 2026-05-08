import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiaryAPI, hiveAPI, feedingAPI } from '../api'

function AddPlanModal({ apiaryId, hives, onClose, onAdded }) {
  const [form, setForm] = useState({
    plan_date: new Date().toISOString().slice(0, 10),
    description: '',
    food_amount: '',
    medicine: '',
    selected_hives: [],
    hive_notes: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleHive = (hiveId) => {
    setForm(prev => ({
      ...prev,
      selected_hives: prev.selected_hives.includes(hiveId)
        ? prev.selected_hives.filter(id => id !== hiveId)
        : [...prev.selected_hives, hiveId]
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
        food_amount: form.food_amount,
        medicine: form.medicine,
        hive_plans: form.selected_hives.map(hiveId => ({
          hive_id: hiveId,
          notes: form.hive_notes[hiveId] || '',
        }))
      }
      const res = await feedingAPI.create(payload)
      onAdded(res.data.plan || res.data)
      onClose()
    } catch {
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

            <div className="form-group">
              <label className="form-label">📅 Data</label>
              <input type="date" className="form-control" value={form.plan_date}
                onChange={e => setForm(p => ({ ...p, plan_date: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">📝 Përshkrimi i planit</label>
              <textarea className="form-control" rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="p.sh. Ushqim vjeshtë me shurup sheqeri..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">🌿 Ushqimi / Sasia</label>
                <input type="text" className="form-control" value={form.food_amount}
                  onChange={e => setForm(p => ({ ...p, food_amount: e.target.value }))}
                  placeholder="p.sh. 500ml shurup sheqeri" />
              </div>
              <div className="form-group">
                <label className="form-label">💊 Ilaçi / Trajtimi</label>
                <input type="text" className="form-control" value={form.medicine}
                  onChange={e => setForm(p => ({ ...p, medicine: e.target.value }))}
                  placeholder="p.sh. Api-Life Var, Oxalic acid" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Koshere që marrin trajtimin</label>
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
                {hives.map(h => {
                  const sel = form.selected_hives.includes(h.id)
                  return (
                    <button key={h.id} type="button" onClick={() => toggleHive(h.id)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        border: `2px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                        borderRadius: '20px',
                        background: sel ? 'rgba(74,124,89,0.12)' : 'var(--bg)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: sel ? 'var(--green)' : 'var(--muted)',
                        transition: 'all 0.15s',
                      }}
                    >{sel ? '✅ ' : ''}{h.code}</button>
                  )
                })}
              </div>
            </div>

            {/* Optional per-hive notes */}
            {form.selected_hives.length > 0 && (
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  📋 Shënime specifike per koshère <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opsionale)</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {form.selected_hives.map(hiveId => {
                    const hive = hives.find(h => h.id === hiveId)
                    return (
                      <div key={hiveId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ minWidth: '64px', fontWeight: 700, fontSize: '0.85rem' }}>🐝 {hive?.code}</span>
                        <input type="text" className="form-control"
                          placeholder="Shënim specifik për këtë koshère..."
                          value={form.hive_notes[hiveId] || ''}
                          onChange={e => setForm(p => ({ ...p, hive_notes: { ...p.hive_notes, [hiveId]: e.target.value } }))}
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }} />
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
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        background: expanded ? 'var(--surface)' : 'var(--card)',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(74,124,89,0.1)', color: 'var(--green)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
            📅 {plan.plan_date ? new Date(plan.plan_date).toLocaleDateString('sq-AL') : '—'}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{plan.description || 'Plan Ushqimi'}</span>
          {plan.food_amount && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🌿 {plan.food_amount}</span>}
          {plan.medicine && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>💊 {plan.medicine}</span>}
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🐝 {plan.hive_plans?.length || plan.hive_count || 0} koshere</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onDelete(plan.id) }} className="btn btn-danger btn-sm">🗑</button>
          <span style={{ color: 'var(--muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>

      {expanded && plan.hive_plans && plan.hive_plans.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '0.75rem 1.25rem' }}>
          {plan.hive_plans.map((hp, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.75rem', padding: '0.4rem 0',
              borderBottom: i < plan.hive_plans.length - 1 ? '1px solid var(--border)' : 'none',
              fontSize: '0.82rem', alignItems: 'center', flexWrap: 'wrap',
            }}>
              <span style={{ fontWeight: 700, minWidth: '64px' }}>🐝 {hp.hive_code || `#${hp.hive_id}`}</span>
              {hp.notes && <span style={{ color: 'var(--muted)' }}>📝 {hp.notes}</span>}
            </div>
          ))}
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

  useEffect(() => { loadData() }, [apiaryId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [apiaryRes, hivesRes, plansRes] = await Promise.all([
        apiaryAPI.get(apiaryId), hiveAPI.list(apiaryId), feedingAPI.list(apiaryId),
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
          <button className="btn btn-green" onClick={() => setShowAddModal(true)}>+ Plan i Ri</button>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌿</div>
            <h3>Nuk ka plane ushqimi</h3>
            <p style={{ marginBottom: '1.5rem' }}>Krijo planin e parë të ushqimit për kopshtin tënd</p>
            <button className="btn btn-green btn-lg" onClick={() => setShowAddModal(true)}>🌿 Krijo Plan të Parë</button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {plans.length} plan{plans.length !== 1 ? 'e' : ''} gjithsej
            </p>
            {plans.map(plan => <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPlanModal
          apiaryId={apiaryId}
          hives={hives}
          onClose={() => setShowAddModal(false)}
          onAdded={plan => { setPlans(prev => [plan, ...prev]); setShowAddModal(false) }}
        />
      )}
    </div>
  )
}

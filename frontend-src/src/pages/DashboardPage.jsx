import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MapPin, Minus, X } from 'lucide-react'
import { apiaryAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import HiveStack from '../components/HiveStack'
import { fmtDate, relDay, plural } from '../lib/format'

function AddApiaryModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [rows, setRows] = useState([5])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = rows.reduce((s, n) => s + n, 0)
  const setRow = (i, v) => setRows(r => r.map((x, idx) => idx === i ? Math.max(1, Math.min(50, v)) : x))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Jepi kopshtit një emër.'); return }
    setLoading(true)
    try {
      const res = await apiaryAPI.create({ name: name.trim(), row_config: rows, location, notes })
      onCreated(res.data.apiary || res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Kopshti nuk u krijua. Provo përsëri.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-apiary-title">
        <div className="modal-header">
          <h2 className="modal-title" id="add-apiary-title">Kopsht i ri</h2>
          <button className="modal-close" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="ap-name">Emri</label>
              <input id="ap-name" className="form-control" placeholder="p.sh. Kopshti i malit"
                value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ap-loc">Vendndodhja</label>
              <input id="ap-loc" className="form-control" placeholder="Fshati, komuna"
                value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className="form-group">
              <span className="form-label">Rreshtat</span>
              <div style={{ display: 'grid', gap: 8 }}>
                {rows.map((count, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 74, fontSize: '.9rem', color: 'var(--ink-2)', fontWeight: 600 }}>Rreshti {i + 1}</span>
                    <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setRow(i, count - 1)} aria-label={`Më pak koshere në rreshtin ${i + 1}`}><Minus size={16} /></button>
                    <input type="number" inputMode="numeric" className="form-control" min="1" max="50" value={count}
                      onChange={e => setRow(i, parseInt(e.target.value) || 1)}
                      style={{ width: 64, textAlign: 'center', minHeight: 36, padding: '4px' }} aria-label={`Koshere në rreshtin ${i + 1}`} />
                    <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setRow(i, count + 1)} aria-label={`Më shumë koshere në rreshtin ${i + 1}`}><Plus size={16} /></button>
                    {rows.length > 1 && (
                      <button type="button" className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setRows(r => r.filter((_, x) => x !== i))} aria-label={`Hiq rreshtin ${i + 1}`}>
                        <X size={17} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setRows(r => [...r, 5])}>
                <Plus size={16} /> Shto rresht
              </button>
            </div>

            <div className="apiary-yard" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 12px 16px', marginBottom: 18, overflowX: 'auto' }}>
              {rows.map((count, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-end', marginTop: i ? 6 : 0 }}>
                  {Array.from({ length: Math.min(count, 30) }).map((_, j) => <HiveStack key={j} seed={i * 50 + j} floors={1} width={16} />)}
                </div>
              ))}
              <p style={{ fontSize: '.85rem', marginTop: 8 }}>{plural(rows.length, 'rresht', 'rreshta')}, {total} koshere gjithsej</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ap-notes">Shënime</label>
              <textarea id="ap-notes" className="form-control" rows={2} placeholder="Opsionale"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Duke krijuar…' : 'Krijo kopshtin'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApiaryCard({ apiary }) {
  const s = apiary.status_summary || {}
  const strip = apiary.hive_strip || []
  const MAX = 36
  const shown = strip.slice(0, MAX)
  const rows = []
  shown.forEach(h => {
    const last = rows[rows.length - 1]
    if (!last || last.r !== h.r) rows.push({ r: h.r, hives: [h] })
    else last.hives.push(h)
  })
  const needs = (s.problem || 0) + (s.dead || 0)
  const queenless = strip.filter(h => !h.q && (h.s === 'good' || h.s === 'problem')).length

  return (
    <Link to={`/apiary/${apiary.id}`} className="dash-card">
      <div className="dash-card-head">
        <div style={{ minWidth: 0 }}>
          <h2>{apiary.name}</h2>
          {apiary.location && <span className="dash-loc"><MapPin size={14} /> {apiary.location}</span>}
        </div>
        <div className="dash-count">
          <span className="stencil">{apiary.total_hives || 0}</span>
          <span>koshere</span>
        </div>
      </div>

      <div className="dash-yard apiary-yard">
        {rows.map(row => (
          <div key={row.r} className="dash-yard-row">
            {row.hives.map(h => (
              <HiveStack key={h.id} seed={h.id} floors={h.f} status={h.s} width={22} />
            ))}
          </div>
        ))}
        {strip.length > MAX && <span className="dash-more">+{strip.length - MAX}</span>}
      </div>

      <div className="dash-meta">
        <span>
          {needs > 0
            ? <><span className="dot" style={{ background: 'var(--honey)' }} /> {plural(needs, 'ka nevojë', 'kanë nevojë')} për kontroll</>
            : <><span className="dot" style={{ background: 'var(--meadow)' }} /> Të gjitha mirë</>}
          {queenless > 0 && <>, {queenless} pa mbretëreshë</>}
        </span>
        <span>
          {apiary.next_visit
            ? <>Vizita e radhës <strong>{relDay(apiary.next_visit)}</strong></>
            : apiary.last_visit ? <>Vizita e fundit {fmtDate(apiary.last_visit, { year: false })}</> : 'Pa vizita ende'}
        </span>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apiaries, setApiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    apiaryAPI.list()
      .then(res => { const d = res.data.apiaries || res.data || []; setApiaries(Array.isArray(d) ? d : []) })
      .catch(() => setApiaries([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const hives = apiaries.reduce((s, a) => s + (a.total_hives || 0), 0)
  const problem = apiaries.reduce((s, a) => s + (a.status_summary?.problem || 0), 0)
  const dead = apiaries.reduce((s, a) => s + (a.status_summary?.dead || 0), 0)
  const queenless = apiaries.reduce((s, a) => s + (a.hive_strip || []).filter(h => !h.q && (h.s === 'good' || h.s === 'problem')).length, 0)
  const first = user?.name?.split(' ')[0]

  return (
    <div className="page-content">
      <style>{DASH_CSS}</style>
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Kopshtet</h1>
            {first && <p style={{ marginTop: 6 }}>Mirë se erdhe, {first}.</p>}
          </div>
          {apiaries.length > 0 && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Kopsht i ri</button>
          )}
        </div>

        {apiaries.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon" style={{ gap: 8, alignItems: 'flex-end' }}>
              <HiveStack seed={1} floors={2} status="empty" width={44} />
              <HiveStack seed={2} floors={1} status="empty" width={44} />
              <HiveStack seed={3} floors={3} status="empty" width={44} />
            </div>
            <h3>Vizato kopshtin tënd të parë</h3>
            <p>Jep emrin dhe sa koshere ka çdo rresht. Kosheret i plotëson pastaj, një nga një.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Krijo kopshtin</button>
          </div>
        ) : (
          <>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card"><div className="stat-value">{apiaries.length}</div><div className="stat-label">{apiaries.length === 1 ? 'Kopsht' : 'Kopshte'}</div></div>
              <div className="stat-card"><div className="stat-value">{hives}</div><div className="stat-label">Koshere</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: problem ? 'var(--honey-deep)' : undefined }}>{problem}</div><div className="stat-label">Me probleme</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: queenless ? 'var(--propolis)' : undefined }}>{queenless}</div><div className="stat-label">Pa mbretëreshë</div></div>
              {dead > 0 && <div className="stat-card"><div className="stat-value">{dead}</div><div className="stat-label">Të vdekura</div></div>}
            </div>

            <div className="dash-grid">
              {apiaries.map(a => <ApiaryCard key={a.id} apiary={a} />)}
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <AddApiaryModal onClose={() => setShowAdd(false)} onCreated={(a) => a?.id && navigate(`/apiary/${a.id}`)} />
      )}
    </div>
  )
}

const DASH_CSS = `
.dash-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 800px) { .dash-grid { grid-template-columns: 1fr; } }
.dash-card {
  display: flex; flex-direction: column;
  background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius);
  color: var(--ink); overflow: hidden;
  transition: border-color .15s ease;
}
.dash-card:hover { border-color: var(--ink-2); color: var(--ink); }
.dash-card-head { display: flex; justify-content: space-between; gap: 12px; padding: 18px 18px 14px; }
.dash-card h2 { font-size: 1.25rem; letter-spacing: -0.02em; }
.dash-loc { display: inline-flex; align-items: center; gap: 4px; font-size: .88rem; color: var(--ink-2); margin-top: 4px; }
.dash-count { text-align: right; line-height: 1; flex-shrink: 0; }
.dash-count .stencil { font-size: 2rem; display: block; }
.dash-count span:last-child { font-size: .78rem; color: var(--ink-2); }
.dash-yard { flex: 1; padding: 14px 18px 18px; border-block: 1px solid var(--line); position: relative; min-height: 64px; }
.dash-yard-row { display: flex; gap: 3px; align-items: flex-end; flex-wrap: wrap; }
.dash-yard-row + .dash-yard-row { margin-top: 6px; }
.dash-more { position: absolute; right: 14px; bottom: 16px; font-size: .8rem; font-weight: 700; color: var(--ink-2); background: var(--paper); padding: 2px 6px; border-radius: 6px; }
.dash-meta { display: flex; justify-content: space-between; gap: 6px 16px; flex-wrap: wrap; padding: 12px 18px; font-size: .86rem; color: var(--ink-2); }
.dash-meta strong { color: var(--ink); }
.dash-meta .dot { margin-right: 4px; vertical-align: 0; }
`

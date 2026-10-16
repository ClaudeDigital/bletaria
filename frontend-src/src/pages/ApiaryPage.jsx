import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, ClipboardPen, CalendarPlus, Droplets, Trash2, X, ChevronLeft, StickyNote } from 'lucide-react'
import { apiaryAPI, hiveAPI, visitAPI } from '../api'
import HiveStack, { STATUS } from '../components/HiveStack'
import { fmtDay, relDay } from '../lib/format'

const STATUS_KEYS = ['good', 'problem', 'dead', 'empty']
const shortCode = (h) => `${h.position_row}-${h.position_col}`

function HiveDetailModal({ hive, onClose, onUpdated }) {
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
        notes: notes.trim(),
      })
      onUpdated({ ...hive, ...(res.data.hive || res.data), status, queen_present: queen === 'po' ? 1 : 0, notes: notes.trim() })
    } catch {
      setError('Ndryshimet nuk u ruajtën. Provo përsëri.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hive-title" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <HiveStack seed={hive.id} floors={hive.floor_count || hive.floors?.length} status={status} queenless={queen === 'jo'} width={40} />
            <div>
              <h2 className="modal-title" id="hive-title">Kosherja {shortCode(hive)}</h2>
              <span style={{ fontSize: '.82rem', color: 'var(--ink-2)' }}>{hive.code}, {hive.floor_count || hive.floors?.length || 1} kate</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <fieldset className="form-group" style={{ border: 'none' }}>
            <legend className="form-label">Gjendja</legend>
            <div className="seg">
              {STATUS_KEYS.map(k => (
                <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>
                  <span className="dot" style={{ background: STATUS[k].color }} /> {STATUS[k].label}
                </button>
              ))}
            </div>
          </fieldset>

          {status !== 'empty' && status !== 'dead' && (
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="queen">Mbretëresha</label>
                <select id="queen" className="form-control" value={queen} onChange={e => setQueen(e.target.value)}>
                  <option value="po">Është aty</option>
                  <option value="jo">Mungon</option>
                </select>
              </div>
              {queen === 'po' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="qage">Mosha në muaj</label>
                  <input id="qage" type="number" inputMode="numeric" className="form-control" min="0" max="60"
                    value={queenAge} onChange={e => setQueenAge(e.target.value)} placeholder="p.sh. 12" />
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="hnotes">Shënim</label>
            <textarea id="hnotes" className="form-control" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="Çfarë pe në këtë koshere?" />
          </div>
        </div>
        <div className="modal-footer">
          <Link to={`/hive/${hive.id}`} className="btn btn-ghost" onClick={onClose} style={{ marginRight: 'auto' }}>Katet dhe historia</Link>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Duke ruajtur…' : 'Ruaj'}</button>
        </div>
      </div>
    </div>
  )
}

function PlanVisitModal({ apiaryId, onClose, onPlanned }) {
  const t = new Date(); t.setDate(t.getDate() + 1)
  const tomorrow = t.toISOString().slice(0, 10)
  const [date, setDate] = useState(tomorrow)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) { setError('Zgjidh datën e vizitës.'); return }
    setSaving(true)
    try {
      const res = await visitAPI.create({ apiary_id: apiaryId, visit_date: date, notes, status: 'planned' })
      onPlanned(res.data)
    } catch { setError('Vizita nuk u planifikua. Provo përsëri.') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="plan-title" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title" id="plan-title">Planifiko vizitë</h2>
          <button className="modal-close" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="pdate">Data</label>
              <input id="pdate" type="date" className="form-control" value={date} min={tomorrow} onChange={e => setDate(e.target.value)} required />
              <p className="form-hint">Një ditë më parë të vjen kujtesa në Telegram.</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pnotes">Çfarë do të bësh</label>
              <textarea id="pnotes" className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="p.sh. kontroll i mbretëreshës, trajtim për varroa" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Duke ruajtur…' : 'Planifiko'}</button>
          </div>
        </form>
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
  const [showDelete, setShowDelete] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [planned, setPlanned] = useState([])
  const [filter, setFilter] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([apiaryAPI.get(id), hiveAPI.list(id), visitAPI.list(id)])
      .then(([a, h, v]) => {
        setApiary(a.data.apiary || a.data)
        const list = h.data.hives || h.data || []
        setHives(Array.isArray(list) ? list : [])
        setPlanned((v.data || []).filter(x => x.status === 'planned').sort((x, y) => x.visit_date.localeCompare(y.visit_date)))
      })
      .catch(() => setError('Ky kopsht nuk u gjet.'))
      .finally(() => setLoading(false))
  }, [id])

  const cancelPlanned = async (visitId) => {
    if (!window.confirm('Ta heqim këtë vizitë të planifikuar?')) return
    try { await visitAPI.delete(visitId); setPlanned(p => p.filter(v => v.id !== visitId)) } catch {}
  }

  const handleDelete = async () => {
    try { await apiaryAPI.delete(id); navigate('/dashboard') }
    catch { setError('Kopshti nuk u fshi. Provo përsëri.'); setShowDelete(false) }
  }

  if (loading) return <PageLoader />
  if (error && !apiary) return (
    <div className="page-content"><div className="container">
      <div className="alert alert-error">{error}</div>
      <Link to="/dashboard" className="btn btn-ghost"><ChevronLeft size={18} /> Kopshtet</Link>
    </div></div>
  )

  const rows = []
  hives.forEach(h => {
    const r = rows.find(x => x.r === h.position_row)
    if (r) r.hives.push(h); else rows.push({ r: h.position_row, hives: [h] })
  })
  rows.sort((a, b) => a.r - b.r)

  const counts = hives.reduce((acc, h) => { acc[h.status] = (acc[h.status] || 0) + 1; return acc }, {})
  const queenless = hives.filter(h => !h.queen_present && (h.status === 'good' || h.status === 'problem')).length
  const narrow = typeof window !== 'undefined' && window.innerWidth < 520
  const listed = filter ? hives.filter(h => filter === 'queenless' ? (!h.queen_present && (h.status === 'good' || h.status === 'problem')) : h.status === filter) : hives

  return (
    <div className="page-content">
      <style>{APIARY_CSS}</style>
      <div className="container">
        <nav className="breadcrumb" aria-label="Vendndodhja">
          <Link to="/dashboard">Kopshtet</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{apiary?.name}</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="page-title">{apiary?.name}</h1>
            {apiary?.location && <p className="ap-loc"><MapPin size={16} /> {apiary.location}</p>}
          </div>
          <div className="page-actions">
            <Link to={`/apiary/${id}/visit`} className="btn btn-primary"><ClipboardPen size={18} /> Regjistro vizitë</Link>
            <button className="btn btn-ghost" onClick={() => setShowPlan(true)}><CalendarPlus size={18} /> Planifiko</button>
            <Link to={`/apiary/${id}/feeding`} className="btn btn-ghost"><Droplets size={18} /> Ushqimi</Link>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowDelete(true)} aria-label="Fshi kopshtin"><Trash2 size={18} /></button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Filtrat = statistikat */}
        <div className="ap-filters" role="group" aria-label="Filtro kosheret">
          <button aria-pressed={!filter} onClick={() => setFilter(null)}>
            <span className="stencil">{hives.length}</span> të gjitha
          </button>
          {STATUS_KEYS.filter(k => counts[k]).map(k => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(filter === k ? null : k)}>
              <span className="stencil" style={{ color: k === 'empty' ? undefined : STATUS[k].color }}>{counts[k]}</span> {STATUS[k].label.toLowerCase()}
            </button>
          ))}
          {queenless > 0 && (
            <button aria-pressed={filter === 'queenless'} onClick={() => setFilter(filter === 'queenless' ? null : 'queenless')}>
              <span className="stencil" style={{ color: 'var(--propolis)' }}>{queenless}</span> pa mbretëreshë
            </button>
          )}
        </div>

        {/* Oborri */}
        <section className="ap-yard apiary-yard" aria-label="Kosheret sipas rreshtave">
          {rows.map(row => (
            <div key={row.r} className="ap-row">
              <span className="ap-row-n stencil" aria-hidden="true">{row.r}</span>
              <div className="ap-row-hives">
                {row.hives.map(h => {
                  const ql = !h.queen_present && (h.status === 'good' || h.status === 'problem')
                  const dim = filter && !(filter === 'queenless' ? ql : h.status === filter)
                  return (
                    <button key={h.id} className="hive-btn" onClick={() => setSelectedHive(h)} style={{ opacity: dim ? .25 : 1 }}
                      aria-label={`Kosherja ${shortCode(h)}, ${STATUS[h.status]?.label || ''}${ql ? ', pa mbretëreshë' : ''}`}>
                      <HiveStack seed={h.id} floors={h.floor_count || h.floors?.length} status={h.status} queenless={ql} width={narrow ? 42 : 64} />
                      <span className="hive-label">{h.position_col}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="ap-legend">
            <span><span className="dot" style={{ background: 'var(--honey)', borderRadius: '50%' }} /> pikë e verdhë: me probleme</span>
            <span><span className="dot" style={{ border: '2px solid var(--propolis)', borderRadius: '50%' }} /> rreth i kuq: pa mbretëreshë</span>
            <span>Kutitë = katet. Prek kosheren për ta ndryshuar.</span>
          </div>
        </section>

        <div className="ap-cols">
          <section>
            <h2 className="section-title">Vizitat e planifikuara</h2>
            {planned.length === 0 ? (
              <div className="card card-body">
                <p style={{ marginBottom: 12 }}>Asnjë vizitë e planifikuar.</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPlan(true)}><CalendarPlus size={16} /> Planifiko një</button>
              </div>
            ) : (
              <ul className="ap-plans">
                {planned.map(v => (
                  <li key={v.id}>
                    <div style={{ minWidth: 0 }}>
                      <strong>{fmtDay(v.visit_date)}</strong>
                      <span className="ap-rel">{relDay(v.visit_date)}</span>
                      {v.notes && <p>{v.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/apiary/${id}/visit?plan=${v.id}`} className="btn btn-primary btn-sm">Regjistro</Link>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => cancelPlanned(v.id)} aria-label="Hiq vizitën"><X size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {apiary?.notes && (
            <section>
              <h2 className="section-title">Shënime</h2>
              <div className="card card-body"><p style={{ color: 'var(--ink)' }}>{apiary.notes}</p></div>
            </section>
          )}
        </div>

        <section style={{ marginTop: 32 }}>
          <h2 className="section-title">Lista {filter && <span style={{ fontWeight: 500, color: 'var(--ink-2)' }}>({listed.length})</span>}</h2>
          <div className="card table-responsive">
            <table className="table">
              <thead>
                <tr><th>Kosherja</th><th>Gjendja</th><th>Mbretëresha</th><th>Kate</th><th>Shënim</th></tr>
              </thead>
              <tbody>
                {listed.map(h => (
                  <tr key={h.id} onClick={() => setSelectedHive(h)} style={{ cursor: 'pointer' }}>
                    <td><span className="stencil" style={{ fontSize: '1.05rem' }}>{shortCode(h)}</span></td>
                    <td><span className="badge" style={{ background: 'var(--sunken)', color: 'var(--ink)' }}><span className="dot" style={{ background: STATUS[h.status]?.color }} />{STATUS[h.status]?.label}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {h.status === 'empty' || h.status === 'dead' ? <span className="text-muted">—</span>
                        : h.queen_present ? (h.queen_age_months ? `${h.queen_age_months} muaj` : 'Po')
                        : <span className="text-red" style={{ fontWeight: 650 }}>Mungon</span>}
                    </td>
                    <td>{h.floor_count || h.floors?.length || 1}</td>
                    <td style={{ maxWidth: 260 }}>
                      {h.notes ? <span style={{ display: 'inline-flex', gap: 6, color: 'var(--ink-2)', fontSize: '.86rem' }}><StickyNote size={15} style={{ flexShrink: 0, marginTop: 2 }} />{h.notes}</span> : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedHive && (
        <HiveDetailModal hive={selectedHive} onClose={() => setSelectedHive(null)}
          onUpdated={u => { setHives(p => p.map(h => h.id === u.id ? { ...h, ...u } : h)); setSelectedHive(null) }} />
      )}
      {showPlan && (
        <PlanVisitModal apiaryId={id} onClose={() => setShowPlan(false)}
          onPlanned={v => { setPlanned(p => [...p, v].sort((a, b) => a.visit_date.localeCompare(b.visit_date))); setShowPlan(false) }} />
      )}
      {showDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="del-title" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title" id="del-title">Fshi {apiary?.name}?</h2>
              <button className="modal-close" onClick={() => setShowDelete(false)} aria-label="Mbyll"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Fshihen {hives.length} koshere, të gjitha vizitat dhe planet e ushqimit të këtij kopshti. Nuk kthehen më.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Anulo</button>
              <button className="btn btn-danger" onClick={handleDelete}>Fshi kopshtin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const APIARY_CSS = `
.ap-loc { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; }
.ap-filters { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin-bottom: 14px; padding-bottom: 2px; }
.ap-filters::-webkit-scrollbar { display: none; }
.ap-filters button {
  display: inline-flex; align-items: baseline; gap: 6px; flex-shrink: 0;
  padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink-2); font: inherit; font-size: .9rem; font-weight: 600; cursor: pointer;
}
.ap-filters button .stencil { font-size: 1.25rem; line-height: 1; color: var(--ink); }
.ap-filters button[aria-pressed="true"] { background: var(--ink); color: var(--ground); border-color: var(--ink); }
.ap-filters button[aria-pressed="true"] .stencil { color: var(--ground) !important; }

.ap-yard { border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 18px 16px 22px; overflow-x: auto; }
.ap-row { display: flex; align-items: flex-end; gap: 12px; }
.ap-row + .ap-row { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }
.ap-row-n { width: 18px; font-size: 1.1rem; color: var(--ink-2); padding-bottom: 22px; flex-shrink: 0; text-align: right; }
.ap-row-hives { display: flex; gap: 6px; align-items: flex-end; }
.ap-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 16px; font-size: .82rem; color: var(--ink-2); position: sticky; left: 0; }
.ap-legend .dot { margin-right: 5px; vertical-align: -1px; }

.ap-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
@media (max-width: 760px) { .ap-cols { grid-template-columns: 1fr; } }
.ap-plans { list-style: none; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); }
.ap-plans li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; }
.ap-plans li + li { border-top: 1px solid var(--line); }
.ap-plans strong { display: block; text-transform: none; }
.ap-rel { font-size: .82rem; color: var(--honey-deep); font-weight: 650; }
.ap-plans p { font-size: .88rem; margin-top: 2px; }

.seg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.seg button {
  display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px;
  border: 1.5px solid var(--line-strong); border-radius: 10px; background: var(--paper);
  font: inherit; font-weight: 600; font-size: .92rem; color: var(--ink); cursor: pointer; text-align: left;
}
.seg button[aria-pressed="true"] { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); background: var(--sunken); }
`

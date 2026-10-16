import PageLoader from '../components/PageLoader'
import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Minus, Plus, Check } from 'lucide-react'
import { apiaryAPI, hiveAPI, visitAPI } from '../api'
import HiveStack, { STATUS } from '../components/HiveStack'
import { fmtDay } from '../lib/format'

const STATUS_KEYS = ['good', 'problem', 'dead', 'empty']
const FRAMES = [
  { key: 'frames_bees', label: 'Bletë', color: 'var(--paint-blue)' },
  { key: 'frames_eggs', label: 'Vezë', color: 'var(--wax)' },
  { key: 'frames_honey', label: 'Mjaltë', color: 'var(--honey)' },
  { key: 'frames_new', label: 'Të reja', color: 'var(--paper)' },
]
const code = (h) => `${h.position_row}-${h.position_col}`
const alive = (s) => s === 'good' || s === 'problem'

function Stepper({ label, color, value, onChange }) {
  return (
    <div className="vs-stepper">
      <span className="vs-stepper-label"><i style={{ background: color }} />{label}</span>
      <div className="vs-stepper-ctrl">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Më pak: ${label}`}><Minus size={18} /></button>
        <output className="stencil" aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(20, value + 1))} aria-label={`Më shumë: ${label}`}><Plus size={18} /></button>
      </div>
    </div>
  )
}

function FloorStrip({ floor }) {
  // 10 korniza parë nga sipër, sipas numrave të shënuar
  const cells = []
  FRAMES.forEach(f => { for (let i = 0; i < (floor[f.key] || 0); i++) cells.push(f.color) })
  return (
    <div className="vs-strip" aria-hidden="true">
      {Array.from({ length: Math.max(10, cells.length) }).map((_, i) => <i key={i} style={{ background: cells[i] || 'transparent' }} />)}
    </div>
  )
}

export default function VisitPage() {
  const { id: apiaryId } = useParams()
  const [params] = useSearchParams()
  const planId = params.get('plan')
  const navigate = useNavigate()
  const [apiary, setApiary] = useState(null)
  const [hives, setHives] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [visitDate, setVisitDate] = useState(today)
  const [visitNotes, setVisitNotes] = useState('')
  const [data, setData] = useState({})   // hiveId -> gjendja e shënuar
  const [done, setDone] = useState({})   // hiveId -> true kur shënohet
  const [cur, setCur] = useState(0)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    Promise.all([apiaryAPI.get(apiaryId), hiveAPI.list(apiaryId)])
      .then(([a, h]) => {
        setApiary(a.data.apiary || a.data)
        const list = (h.data.hives || h.data || []).slice().sort((x, y) => x.position_row - y.position_row || x.position_col - y.position_col)
        setHives(list)
        const init = {}
        list.forEach(hv => {
          init[hv.id] = {
            status: hv.status || 'good',
            queen_present: !!hv.queen_present,
            queen_age: hv.queen_age_months || '',
            notes: '',
            floors: (hv.floors || []).map(f => ({ floor_id: f.id, floor_number: f.floor_number, frames_bees: f.frames_bees || 0, frames_eggs: f.frames_eggs || 0, frames_honey: f.frames_honey || 0, frames_new: f.frames_new || 0 })),
          }
        })
        setData(init)
      })
      .catch(() => setError('Ky kopsht nuk u gjet.'))
      .finally(() => setLoading(false))
  }, [apiaryId])

  const hive = hives[cur]
  const d = hive ? data[hive.id] : null
  const doneCount = Object.keys(done).length

  const rows = useMemo(() => {
    const out = []
    hives.forEach((h, i) => {
      const r = out.find(x => x.r === h.position_row)
      if (r) r.items.push({ h, i }); else out.push({ r: h.position_row, items: [{ h, i }] })
    })
    return out
  }, [hives])

  const set = (patch) => setData(p => ({ ...p, [hive.id]: { ...p[hive.id], ...patch } }))
  const setFloor = (idx, key, val) => set({ floors: d.floors.map((f, i) => i === idx ? { ...f, [key]: val } : f) })

  const next = () => {
    setDone(p => ({ ...p, [hive.id]: true }))
    if (cur < hives.length - 1) { setCur(cur + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else setFinishing(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const hive_data = hives.filter(h => done[h.id]).map(h => {
        const x = data[h.id]
        const live = alive(x.status)
        return {
          hive_id: h.id,
          status: x.status,
          queen_present: live ? x.queen_present : false,
          queen_age_months: live && x.queen_present && x.queen_age ? parseInt(x.queen_age) : null,
          notes: x.notes.trim() || null,
          floors: live ? x.floors : [],
        }
      })
      await visitAPI.create({ apiary_id: apiaryId, visit_date: visitDate, notes: visitNotes.trim(), status: 'completed', hive_data })
      if (planId) { try { await visitAPI.delete(planId) } catch {} }
      navigate(`/apiary/${apiaryId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Vizita nuk u ruajt. Kontrollo internetin dhe provo përsëri.')
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (!apiary) return <div className="page-content"><div className="container"><div className="alert alert-error">{error}</div></div></div>

  return (
    <div className="page-content">
      <style>{VISIT_CSS}</style>
      <div className="container" style={{ maxWidth: 760 }}>
        <nav className="breadcrumb" aria-label="Vendndodhja">
          <Link to="/dashboard">Kopshtet</Link><span className="breadcrumb-sep">/</span>
          <Link to={`/apiary/${apiaryId}`}>{apiary.name}</Link><span className="breadcrumb-sep">/</span>
          <span>Vizitë</span>
        </nav>

        <div className="vs-head">
          <div>
            <h1 className="page-title">Vizitë</h1>
            <p>{fmtDay(visitDate)}, {apiary.name}</p>
          </div>
          <label className="vs-date">
            <span className="visually-hidden">Data e vizitës</span>
            <input type="date" className="form-control" value={visitDate} max={today} onChange={e => setVisitDate(e.target.value)} />
          </label>
        </div>

        {/* Harta e kopshtit: ku je dhe çfarë ke shënuar */}
        <div className="vs-map apiary-yard" role="group" aria-label="Kosheret">
          {rows.map(row => (
            <div key={row.r} className="vs-map-row">
              {row.items.map(({ h, i }) => (
                <button key={h.id} type="button" onClick={() => { setCur(i); setFinishing(false) }}
                  className={`vs-map-hive${i === cur && !finishing ? ' is-cur' : ''}${done[h.id] ? ' is-done' : ''}`}
                  aria-label={`Kosherja ${code(h)}${done[h.id] ? ', e shënuar' : ''}`} aria-current={i === cur && !finishing ? 'step' : undefined}>
                  <HiveStack seed={h.id} floors={data[h.id]?.floors.length || 1} status={data[h.id]?.status} width={22} />
                  {done[h.id] && <span className="vs-tick"><Check size={10} strokeWidth={3.5} /></span>}
                </button>
              ))}
            </div>
          ))}
          <div className="vs-progress">
            <div style={{ width: `${hives.length ? doneCount / hives.length * 100 : 0}%` }} />
          </div>
          <p className="vs-progress-text">{doneCount} nga {hives.length} koshere të shënuara</p>
        </div>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {!finishing && hive && d ? (
          <section className="card vs-card" aria-labelledby="vs-hive-title">
            <div className="vs-card-head">
              <HiveStack seed={hive.id} floors={d.floors.length || 1} status={d.status} queenless={alive(d.status) && !d.queen_present} width={46} />
              <div>
                <h2 id="vs-hive-title">Kosherja <span className="stencil">{code(hive)}</span></h2>
                <span className="text-muted" style={{ fontSize: '.86rem' }}>{cur + 1} nga {hives.length}{hive.notes ? `. Shënimi i fundit: ${hive.notes}` : ''}</span>
              </div>
            </div>

            <fieldset className="vs-block">
              <legend>Gjendja</legend>
              <div className="vs-seg">
                {STATUS_KEYS.map(k => (
                  <button key={k} type="button" aria-pressed={d.status === k} onClick={() => set({ status: k })}>
                    <span className="dot" style={{ background: STATUS[k].color }} />{STATUS[k].label}
                  </button>
                ))}
              </div>
            </fieldset>

            {alive(d.status) && (
              <>
                <fieldset className="vs-block">
                  <legend>Mbretëresha</legend>
                  <div className="vs-queen">
                    <div className="vs-seg vs-seg-2">
                      <button type="button" aria-pressed={d.queen_present} onClick={() => set({ queen_present: true })}>E pashë</button>
                      <button type="button" aria-pressed={!d.queen_present} onClick={() => set({ queen_present: false })}>Mungon</button>
                    </div>
                    {d.queen_present && (
                      <label className="vs-age">
                        <span>Mosha</span>
                        <input type="number" inputMode="numeric" min="0" max="60" className="form-control" value={d.queen_age}
                          onChange={e => set({ queen_age: e.target.value })} placeholder="—" />
                        <span>muaj</span>
                      </label>
                    )}
                  </div>
                </fieldset>

                {d.floors.length > 0 && (
                  <fieldset className="vs-block">
                    <legend>Kornizat sipas katit</legend>
                    {d.floors.slice().reverse().map((f) => {
                      const idx = d.floors.indexOf(f)
                      return (
                        <div key={f.floor_id} className="vs-floor">
                          <div className="vs-floor-head"><strong>Kati {f.floor_number}</strong><FloorStrip floor={f} /></div>
                          <div className="vs-steppers">
                            {FRAMES.map(fr => (
                              <Stepper key={fr.key} label={fr.label} color={fr.color} value={f[fr.key]} onChange={v => setFloor(idx, fr.key, v)} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <p className="form-hint">Katet shtohen ose hiqen te faqja e kosheres.</p>
                  </fieldset>
                )}
              </>
            )}

            <div className="vs-block">
              <label className="form-label" htmlFor="vs-note">Shënim për këtë koshere</label>
              <textarea id="vs-note" className="form-control" rows={2} value={d.notes} onChange={e => set({ notes: e.target.value })}
                placeholder="p.sh. pak ushqim, shenja varroa" />
            </div>

            <div className="vs-nav">
              <button type="button" className="btn btn-ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}><ChevronLeft size={18} /> Mbrapa</button>
              <button type="button" className="btn btn-primary" onClick={next}>
                {cur < hives.length - 1 ? <>Ruaj, kalo te {code(hives[cur + 1])} <ChevronRight size={18} /></> : <>Ruaj të fundit <Check size={18} /></>}
              </button>
            </div>
          </section>
        ) : (
          <section className="card vs-card" aria-labelledby="vs-end-title">
            <h2 id="vs-end-title" style={{ fontSize: '1.3rem' }}>Përfundo vizitën</h2>
            <p style={{ margin: '6px 0 16px' }}>
              {doneCount === 0
                ? 'S’ke shënuar asnjë koshere. Mund ta ruash vizitën vetëm me shënimin e përgjithshëm.'
                : `Ke shënuar ${doneCount} nga ${hives.length} koshere. Kosheret e pashënuara mbeten siç ishin.`}
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="vs-gen">Shënim i përgjithshëm</label>
              <textarea id="vs-gen" className="form-control" rows={3} value={visitNotes} onChange={e => setVisitNotes(e.target.value)}
                placeholder="Moti, lulëzimi, çfarë duhet bërë herën tjetër" />
            </div>
            <div className="vs-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setFinishing(false)}><ChevronLeft size={18} /> Kthehu te kosheret</button>
              <button type="button" className="btn btn-primary btn-lg" onClick={save} disabled={saving}>{saving ? 'Duke ruajtur…' : 'Ruaj vizitën'}</button>
            </div>
          </section>
        )}

        {!finishing && (
          <button type="button" className="btn btn-ghost w-full" style={{ marginTop: 12 }} onClick={() => setFinishing(true)}>
            Përfundo vizitën ({doneCount} të shënuara)
          </button>
        )}
      </div>
    </div>
  )
}

const VISIT_CSS = `
.vs-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.vs-head p { margin-top: 4px; }
.vs-date .form-control { min-height: 42px; width: auto; }

.vs-map { border: 1px solid var(--line); border-radius: 16px; padding: 14px 14px 12px; margin-bottom: 16px; overflow-x: auto; }
.vs-map-row { display: flex; gap: 4px; align-items: flex-end; }
.vs-map-row + .vs-map-row { margin-top: 6px; }
.vs-map-hive { position: relative; background: none; border: none; padding: 3px 2px; border-radius: 6px; cursor: pointer; opacity: .55; }
.vs-map-hive.is-done { opacity: 1; }
.vs-map-hive.is-cur { opacity: 1; background: var(--wax); box-shadow: 0 0 0 2px var(--honey); }
.vs-tick { position: absolute; top: -3px; right: -3px; width: 15px; height: 15px; border-radius: 50%; background: var(--meadow); color: #fff; display: flex; align-items: center; justify-content: center; }
.vs-progress { height: 6px; background: var(--sunken); border-radius: 3px; margin-top: 12px; overflow: hidden; }
.vs-progress div { height: 100%; background: var(--meadow); transition: width .3s ease; }
.vs-progress-text { font-size: .82rem; margin-top: 6px; }

.vs-card { padding: 20px; }
.vs-card-head { display: flex; gap: 14px; align-items: flex-end; margin-bottom: 8px; }
.vs-card-head h2 { font-size: 1.4rem; }
.vs-card-head h2 .stencil { font-size: 1.5rem; }
.vs-block { border: none; margin-top: 20px; }
.vs-block legend { font-weight: 700; font-size: .92rem; margin-bottom: 8px; }
.vs-seg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.vs-seg-2 { grid-template-columns: repeat(2, 1fr); }
.vs-seg button {
  display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 48px; padding: 0 8px;
  border: 1.5px solid var(--line-strong); border-radius: 12px; background: var(--paper);
  font: inherit; font-weight: 650; font-size: .92rem; color: var(--ink); cursor: pointer;
}
.vs-seg button[aria-pressed="true"] { border-color: var(--ink); background: var(--ink); color: var(--ground); }
@media (max-width: 520px) { .vs-seg { grid-template-columns: repeat(2, 1fr); } }
.vs-queen { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.vs-queen .vs-seg { flex: 1 1 240px; }
.vs-age { display: flex; align-items: center; gap: 8px; font-size: .9rem; color: var(--ink-2); font-weight: 600; }
.vs-age .form-control { width: 76px; text-align: center; }

.vs-floor { border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
.vs-floor + .vs-floor { margin-top: 8px; }
.vs-floor-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.vs-strip { flex: 1; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; background: color-mix(in srgb, var(--wood) 70%, transparent); padding: 3px; border-radius: 4px; max-width: 260px; margin-left: auto; }
.vs-strip i { height: 14px; border-radius: 2px; }
.vs-steppers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
@media (max-width: 600px) { .vs-steppers { grid-template-columns: repeat(2, 1fr); } }
.vs-stepper-label { display: flex; align-items: center; gap: 6px; font-size: .82rem; font-weight: 650; color: var(--ink-2); margin-bottom: 4px; }
.vs-stepper-label i { width: 10px; height: 10px; border-radius: 2px; border: 1px solid var(--line-strong); }
.vs-stepper-ctrl { display: flex; align-items: center; border: 1.5px solid var(--line-strong); border-radius: 12px; overflow: hidden; background: var(--paper); }
.vs-stepper-ctrl button { width: 44px; height: 44px; border: none; background: transparent; color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vs-stepper-ctrl button:active { background: var(--sunken); }
.vs-stepper-ctrl output { flex: 1; text-align: center; font-size: 1.35rem; }

.vs-nav { display: flex; justify-content: space-between; gap: 8px; margin-top: 22px; flex-wrap: wrap; }
.vs-nav .btn-primary { flex: 1; max-width: 340px; margin-left: auto; }
`

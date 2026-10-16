import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Layers, Crown, CalendarClock, Droplets, Store, Sparkles, MousePointerClick } from 'lucide-react'
import { newsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import HiveStack, { STATUS } from '../components/HiveStack'
import { GrassBack, GrassFront, Hills } from '../components/Meadow'
import Bees, { BEES_CSS } from '../components/Bees'
import { fmtDate, MONTHS } from '../lib/format'

// Një rresht kosheresh si në oborr. Çdo koshere ka të dhënat e veta, si në aplikacion.
const YARD = [
  { seed: 1, floors: 2, queen: 9, honey: 8, last: 'para 5 ditësh' },
  { seed: 4, floors: 3, queen: 20, honey: 15, last: 'para 5 ditësh' },
  { seed: 2, floors: 1, queen: 3, honey: 2, last: 'dje', note: 'Koloni e re nga ndarja e majit.' },
  { seed: 6, floors: 4, queen: 14, honey: 22, last: 'para 3 ditësh' },
  { seed: 3, floors: 2, queen: 26, honey: 4, last: 'para 3 ditësh', status: 'problem', note: 'Varroa e dukshme. Trajtim me acid oksalik.' },
  { seed: 5, floors: 3, queen: 11, honey: 17, last: 'para 3 ditësh' },
  { seed: 8, floors: 1, status: 'empty', last: 'para 2 javësh', note: 'Bosh. Gati për tufën e radhës.' },
  { seed: 9, floors: 2, queen: 7, honey: 9, last: 'para 3 ditësh' },
  { seed: 7, floors: 3, queen: 18, honey: 16, last: 'para 3 ditësh' },
  { seed: 10, floors: 2, honey: 6, last: 'para 3 ditësh', status: 'problem', queenless: true, note: 'Pa mbretëreshë. Bashkoje me R1-9.' },
]

const FEATURES = [
  { Icon: Layers, title: 'Katet dhe kornizat', text: 'Për çdo kat: sa korniza me bletë, me vezë, me mjaltë dhe sa të reja.' },
  { Icon: Crown, title: 'Mbretëresha', text: 'A është aty, sa muajshe është. Kosheret pa mbretëreshë dalin të shënuara.' },
  { Icon: CalendarClock, title: 'Vizitat', text: 'Planifiko vizitën e radhës. Një ditë më parë të vjen kujtesa në Telegram.' },
  { Icon: Droplets, title: 'Ushqimi dhe trajtimi', text: 'Kush mori shurup, kush acid oksalik, sa dhe kur.' },
  { Icon: Store, title: 'Tregu dhe komuniteti', text: 'Shit mjaltë e familje bletësh, pyet bletarët e tjerë.' },
]

const SEASON = [
  'Qetësi. Peshoje kosheren nga jashtë, mos e hap.',
  'Fluturimi i pastrimit. Shiko hyrjet, jep kandi nëse s’ka ushqim.',
  'Kontrolli i parë në ditë mbi 15°C: mbretëresha dhe rezervat.',
  'Zgjerimi. Shto korniza dhe ushqim stimulues.',
  'Koha e tufëzimit. Bëj ndarjet, shto katin e mjaltit.',
  'Akacia dhe bliri. Kati i dytë i mjaltit te kosheret e forta.',
  'Nxjerrja e mjaltit. Lëru bletëve sa për vete.',
  'Trajtimi për varroa, menjëherë pas mjaltit.',
  'Ushqimi i dimrit: shurup 3:2 deri sa të mbushen rezervat.',
  'Ngushto hyrjet. Kontrolli i fundit para dimrit.',
  'Acid oksalik kur kosherja s’ka pjellë.',
  'Pushim. Riparo kornizat dhe kutitë për pranverë.',
]

// ------------------------------------------------------------- Oborri

function HiveInfo({ i }) {
  const h = YARD[i]
  const st = STATUS[h.status || 'good']
  return (
    <>
      <div className="yard-info-head">
        <span className="stencil">R1-{i + 1}</span>
        <span className="badge" style={{ background: 'var(--sunken)', color: 'var(--ink)' }}>
          <span className="dot" style={{ background: st.color }} /> {st.label}
        </span>
      </div>
      {h.status !== 'empty' && (
        <dl>
          <div><dt>Kate</dt><dd>{h.floors}</dd></div>
          <div><dt>Mbretëresha</dt><dd className={h.queenless ? 'text-red' : undefined}>{h.queenless ? 'Mungon' : `${h.queen} muaj`}</dd></div>
          <div><dt>Korniza mjalti</dt><dd>{h.honey}</dd></div>
          <div><dt>Vizita e fundit</dt><dd>{h.last}</dd></div>
        </dl>
      )}
      {h.note && <p className="yard-info-note">{h.note}</p>}
    </>
  )
}

function Yard() {
  const [active, setActive] = useState(3)
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const hiveW = w < 560 ? 54 : w < 900 ? 72 : 92
  const visible = w < 560 ? 5 : w < 900 ? 7 : 10
  const idx = Math.min(active, visible - 1)

  return (
    <section className="home-yard" aria-labelledby="yard-title">
      <div className="container home-yard-intro">
        <h2 id="yard-title">Kështu duket kopshti yt</h2>
        <p><MousePointerClick size={17} /> Prek një koshere. Kutitë janë katet, pika e verdhë do të thotë që diçka s’shkon.</p>
      </div>

      <div className="yard-info yard-info-mobile" aria-live="polite"><HiveInfo i={idx} /></div>

      <div className="home-yard-scene">
        <Hills height={w < 560 ? 70 : 130} />
        <Bees />
        <GrassBack height={w < 560 ? 44 : 60} />
        <div className="home-yard-row">
          {YARD.slice(0, visible).map((h, i) => (
            <div key={i} className={`home-yard-hive${i === idx ? ' is-active' : ''}`}>
              {i === idx && (
                <div className={`yard-info yard-info-desk${i > visible / 2 ? ' to-left' : ''}`} aria-live="polite"><HiveInfo i={i} /></div>
              )}
              <button type="button" className="yard-hive-btn" onClick={() => setActive(i)} onMouseEnter={() => w >= 900 && setActive(i)}
                aria-pressed={i === idx} aria-label={`Kosherja R1-${i + 1}`}>
                <HiveStack seed={h.seed} floors={h.floors} status={h.status || 'good'} queenless={h.queenless} width={hiveW} />
              </button>
            </div>
          ))}
        </div>
        <GrassFront height={w < 560 ? 30 : 40} />
      </div>
      <div className="home-yard-soil" />
    </section>
  )
}

// ------------------------------------------------------------- Ilustrimet e hapave

function ArtRows() {
  return (
    <div className="art art-rows" aria-hidden="true">
      {[6, 5, 4].map((n, r) => (
        <div key={r} className="art-row">
          <span>Rreshti {r + 1}</span>
          <div>{Array.from({ length: n }).map((_, i) => <HiveStack key={i} seed={r * 9 + i} floors={1} width={24} />)}</div>
          <b className="stencil">{n}</b>
        </div>
      ))}
    </div>
  )
}

// Kornizat e një kati parë nga sipër: bletë, vezë, mjaltë, të reja
const FRAME = { b: 'var(--paint-blue)', v: 'var(--wax)', m: 'var(--honey)', r: 'var(--paper)' }
function ArtFrames() {
  const floors = [
    { n: 3, f: 'mmmmmmmmrr' },
    { n: 2, f: 'mmmmbbbbrr' },
    { n: 1, f: 'mbbvvvvbbm' },
  ]
  return (
    <div className="art art-frames" aria-hidden="true">
      <div className="art-frames-head"><span className="stencil">1-4</span><span className="badge badge-green">Mirë</span></div>
      {floors.map(fl => (
        <div key={fl.n} className="art-floor">
          <span>Kati {fl.n}</span>
          <div>{fl.f.split('').map((c, i) => <i key={i} style={{ background: FRAME[c] }} />)}</div>
        </div>
      ))}
      <div className="art-legend">
        <span><i style={{ background: FRAME.b }} />bletë</span>
        <span><i style={{ background: FRAME.v }} />vezë</span>
        <span><i style={{ background: FRAME.m }} />mjaltë</span>
        <span><i style={{ background: FRAME.r }} />të reja</span>
      </div>
    </div>
  )
}

function ArtFilter() {
  const row = [['good', 0], ['problem', 0], ['good', 0], ['dead', 0], ['good', 0], ['problem', 1], ['good', 0]]
  return (
    <div className="art art-filter" aria-hidden="true">
      <div className="art-chips">
        <span><b className="stencil">17</b> me probleme</span>
        <span className="on"><b className="stencil">5</b> pa mbretëreshë</span>
      </div>
      <div className="art-filter-row">
        {row.map(([s, q], i) => (
          <span key={i} style={{ opacity: q ? 1 : .28 }}><HiveStack seed={i + 3} floors={(i % 3) + 1} status={s} queenless={!!q} width={34} /></span>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  { title: 'Vizato oborrin', text: 'Jep emrin e kopshtit dhe sa koshere ka çdo rresht. Rreshtat mund të jenë të ndryshëm.', Art: ArtRows },
  { title: 'Shëno në vizitë', text: 'Pranë kosheres, në telefon: gjendja, mbretëresha dhe kornizat e çdo kati.', Art: ArtFrames },
  { title: 'Shih kush ka nevojë', text: 'Një prekje dhe mbeten vetëm kosheret e dobëta, pa mbretëreshë ose bosh.', Art: ArtFilter },
]

// ------------------------------------------------------------- Bletari AI

function AiChat() {
  return (
    <figure className="ai-chat" aria-label="Shembull bisede me Bletari AI">
      <div className="ai-chat-head"><span className="ai-chat-mark"><Sparkles size={16} /></span> Bletari AI</div>
      <p className="ai-q">Te kosherja 1-7 s’gjej vezë dhe bletët gumëzhijnë më fort se zakonisht. Çfarë të bëj?</p>
      <div className="ai-a">
        <p>Ka gjasa që kosherja të ketë mbetur pa mbretëreshë. Gumëzhima e fortë dhe mungesa e vezëve janë shenjat e para.</p>
        <ol>
          <li>Shiko për qeliza mbretëreshe në mes të kornizave.</li>
          <li>Nëse s’ka, fut një kornizë me vezë të freskëta nga një koshere e fortë.</li>
          <li>Kontrollo sërish pas 5 ditësh.</li>
        </ol>
      </div>
      <figcaption>Pyetjet dhe përgjigjet janë në shqip.</figcaption>
    </figure>
  )
}

// ------------------------------------------------------------- Faqja

export default function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [news, setNews] = useState([])
  const month = new Date().getMonth()

  useEffect(() => {
    newsAPI.list({ limit: 3 })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.news || [])
        setNews(list.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  return (
    <div className="home">
      <style>{HOME_CSS + BEES_CSS}</style>

      <section className="home-hero">
        <picture className="home-hero-photo">
          <source media="(max-width: 700px)" srcSet="/img/hoje-900.jpg" />
          <img src="/img/hoje-1920.jpg" alt="Bletë mbi hoje me mjaltë" fetchpriority="high" />
        </picture>
        <div className="container home-hero-inner">
          <h1>Ditari i bletarisë,<br />kat pas kati.</h1>
          <p className="home-lede">
            Shëno vizitat, mbretëreshat dhe kornizat me mjaltë për secilën koshere.
            Në fund të sezonit e di saktë cila punoi e cila jo.
          </p>
          <div className="home-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Krijo llogari falas</Link>
            <Link to="/login" className="btn btn-lg home-btn-light">Provo llogarinë demo</Link>
          </div>
          <p className="home-hero-ai"><Sparkles size={16} /> Me Bletari AI: pyet për varroa, mbretëreshën ose ushqimin, në shqip.</p>
        </div>
      </section>

      <Yard />

      <section className="container home-steps" aria-labelledby="steps-title">
        <h2 id="steps-title">Si punon</h2>
        <ol>
          {STEPS.map(({ title, text, Art }, i) => (
            <li key={title}>
              <Art />
              <div className="home-step-text">
                <span className="stencil home-step-n">{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-season" aria-labelledby="season-title">
        <div className="container">
          <div className="home-season-head">
            <h2 id="season-title">Viti i bletarit</h2>
            <p>Çfarë bëhet në bletari muaj pas muaji. Tani jemi në {MONTHS[month]}.</p>
          </div>
          <ol className="home-season-grid">
            {SEASON.map((t, m) => (
              <li key={m} className={m === month ? 'is-now' : undefined} aria-current={m === month ? 'true' : undefined}>
                <span className="home-season-m">{MONTHS[m]}{m === month && <em>tani</em>}</span>
                <p>{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-band" aria-labelledby="band-title">
        <div className="container home-band-grid">
          <div>
            <h2 id="band-title">Çfarë mban mend për ty</h2>
            <ul className="home-features">
              {FEATURES.map(({ Icon, title, text }) => (
                <li key={title}>
                  <Icon size={22} strokeWidth={1.8} />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <AiChat />
        </div>
      </section>

      {news.length > 0 && (
        <section className="container home-news" aria-labelledby="news-title">
          <h2 id="news-title">Nga bletaria</h2>
          <div className="home-news-list">
            {news.map(n => (
              <article key={n.id}>
                <time>{fmtDate(n.created_at || n.date)}</time>
                <h3>{n.title}</h3>
                <p>{(n.excerpt || n.content || '').slice(0, 170).trim()}{(n.content || '').length > 170 ? '…' : ''}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="home-close">
        <div className="container home-close-inner">
          <div className="home-close-hives" aria-hidden="true">
            {[[2, 2], [5, 3], [8, 1]].map(([s, f]) => <HiveStack key={s} seed={s} floors={f} width={46} />)}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2>Fillo me kopshtin e parë.</h2>
            <p>Falas. Të duhen dy minuta për ta vizatuar.</p>
          </div>
          <Link to="/register" className="btn btn-primary btn-lg">Krijo llogari</Link>
        </div>
      </section>
    </div>
  )
}

const HOME_CSS = `
.home h2 { font-size: clamp(1.6rem, 4.2vw, 2.25rem); letter-spacing: -0.03em; margin-bottom: 10px; }

/* --- Hero me foto --- */
.home-hero { position: relative; min-height: min(720px, 92vh); display: flex; align-items: flex-end; overflow: hidden; background: #1b1408; isolation: isolate; }
.home-hero-photo, .home-hero-photo img { position: absolute; inset: 0; width: 100%; height: 100%; }
.home-hero-photo img { object-fit: cover; object-position: 70% 40%; animation: hero-zoom 14s ease-out both; }
@keyframes hero-zoom { from { transform: scale(1.08); } }
.home-hero::after {
  content: ""; position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(90deg, rgba(24,18,8,.92) 0%, rgba(24,18,8,.78) 34%, rgba(24,18,8,.25) 68%, rgba(24,18,8,.05) 100%),
    linear-gradient(0deg, rgba(24,18,8,.55) 0%, rgba(24,18,8,0) 40%);
}
.home-hero-inner { position: relative; z-index: 1; padding-top: 96px; padding-bottom: clamp(48px, 9vw, 104px); }
.home-hero h1 { color: #FFF8E6; font-size: clamp(2.7rem, 9.5vw, 6rem); line-height: .93; letter-spacing: -0.045em; font-weight: 860; max-width: 11ch; text-shadow: 0 2px 30px rgba(0,0,0,.35); }
.home-lede { font-size: clamp(1.05rem, 2.4vw, 1.25rem); max-width: 44ch; margin-top: 22px; color: rgba(255, 248, 230, .82); }
.home-cta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 30px; }
.home-btn-light { background: rgba(255,248,230,.1); color: #FFF8E6; border-color: rgba(255,248,230,.4); backdrop-filter: blur(6px); }
.home-btn-light:hover { background: rgba(255,248,230,.2); color: #fff; border-color: rgba(255,248,230,.7); }
.home-hero-ai { display: inline-flex; align-items: center; gap: 8px; margin-top: 26px; font-size: .92rem; color: rgba(255,248,230,.75); }
.home-hero-ai svg { color: var(--honey); flex-shrink: 0; }
@media (max-width: 700px) {
  .home-hero { min-height: 640px; }
  .home-hero-photo img { object-position: 60% 50%; }
  .home-hero::after { background: linear-gradient(180deg, rgba(24,18,8,.35) 0%, rgba(24,18,8,.7) 45%, rgba(24,18,8,.93) 100%); }
}

/* --- Oborri --- */
.home-yard { position: relative; padding-top: clamp(48px, 7vw, 88px); background: linear-gradient(180deg, color-mix(in srgb, #CFE0E6 55%, var(--ground)) 0%, var(--ground) 80%); }
[data-theme="dark"] .home-yard { background: linear-gradient(180deg, #0f1a1d 0%, var(--ground) 80%); }
.home-yard-intro p { display: flex; gap: 8px; align-items: center; max-width: 60ch; }
.home-yard-intro p svg { flex-shrink: 0; color: var(--honey-deep); }
.home-yard-scene { position: relative; margin-top: clamp(150px, 15vw, 190px); }
.meadow-layer { display: block; position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
.meadow-back { z-index: 0; }
.meadow-front { z-index: 2; }
.meadow-hills { position: absolute; left: 0; right: 0; bottom: 20px; display: block; z-index: 0; pointer-events: none; }
.home-yard-row { position: relative; z-index: 1; display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px, 3vw, 34px); padding: 0 24px 16px; max-width: 1240px; margin: 0 auto; }
.home-yard-hive { position: relative; display: flex; flex-direction: column; align-items: center; }
.yard-hive-btn { background: none; border: none; padding: 0; cursor: pointer; border-radius: 6px; transition: transform .18s cubic-bezier(.2,.8,.2,1); }
.yard-hive-btn:hover, .yard-hive-btn[aria-pressed="true"] { transform: translateY(-8px); }
.yard-hive-btn[aria-pressed="true"] .hive-svg { filter: drop-shadow(0 10px 10px rgba(30,43,34,.22)); }
.home-yard-soil { height: 22px; background: linear-gradient(180deg, var(--grass-4), color-mix(in srgb, var(--grass-4) 70%, var(--soil))); }

.yard-info { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; min-width: 214px; box-shadow: 0 14px 34px var(--shadow); }
.yard-info-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.yard-info-head .stencil { font-size: 1.2rem; }
.yard-info dl { margin-top: 8px; display: grid; gap: 3px; font-size: .85rem; }
.yard-info dl div { display: flex; justify-content: space-between; gap: 16px; white-space: nowrap; }
.yard-info dt { color: var(--ink-2); }
.yard-info dd { font-weight: 650; }
.yard-info-note { margin-top: 8px; font-size: .84rem; color: var(--ink); max-width: 26ch; line-height: 1.4; }
.yard-info-desk { position: absolute; bottom: calc(100% + 18px); left: 50%; transform: translateX(-28%); z-index: 5; animation: tag-in .25s ease both; }
.yard-info-desk.to-left { transform: translateX(-72%); }
.yard-info-desk::after { content: ""; position: absolute; left: 28%; bottom: -7px; width: 12px; height: 12px; background: var(--paper); border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); transform: translateX(-50%) rotate(45deg); }
.yard-info-desk.to-left::after { left: 72%; }
@keyframes tag-in { from { opacity: 0; margin-bottom: -6px; } }
.yard-info-mobile { display: none; }
@media (max-width: 560px) {
  .home-yard-scene { margin-top: 20px; }
  .home-yard-row { gap: 10px; padding: 0 14px 12px; justify-content: space-between; }
  .yard-info-desk { display: none; }
  .yard-info-mobile { display: block; margin: 18px 16px 0; box-shadow: none; min-height: 150px; }
}

/* --- Hapat --- */
.home-steps { padding-block: clamp(56px, 8vw, 96px); }
.home-steps ol { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 22px; }
.home-step-text { display: flex; gap: 14px; margin-top: 18px; }
.home-step-n { font-size: 2.6rem; line-height: .9; color: var(--honey-deep); min-width: 26px; }
.home-steps h3, .home-features h3 { font-size: 1.05rem; margin-bottom: 4px; }
.home-steps p, .home-features p { font-size: .95rem; max-width: 34ch; }
@media (max-width: 860px) { .home-steps ol { grid-template-columns: 1fr; gap: 36px; } }

.art { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 18px; height: 212px; display: flex; flex-direction: column; justify-content: center; }
.art-row { display: grid; grid-template-columns: 70px 1fr 22px; align-items: end; gap: 8px; font-size: .8rem; color: var(--ink-2); font-weight: 600; }
.art-row + .art-row { margin-top: 12px; }
.art-row > div { display: flex; gap: 4px; align-items: flex-end; }
.art-row b { font-size: 1.1rem; color: var(--ink); text-align: right; font-weight: 400; }
.art-frames-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.art-frames-head .stencil { font-size: 1.2rem; }
.art-floor { display: grid; grid-template-columns: 50px 1fr; gap: 8px; align-items: center; font-size: .78rem; color: var(--ink-2); font-weight: 600; }
.art-floor + .art-floor { margin-top: 5px; }
.art-floor > div { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; background: color-mix(in srgb, var(--wood) 70%, transparent); padding: 4px; border-radius: 4px; }
.art-floor i { display: block; height: 20px; border-radius: 2px; }
.art-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 12px; font-size: .76rem; color: var(--ink-2); }
.art-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: -1px; border: 1px solid var(--line-strong); }
.art-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.art-chips span { display: inline-flex; gap: 6px; align-items: baseline; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); font-size: .82rem; font-weight: 600; color: var(--ink-2); }
.art-chips b { font-weight: 400; font-size: 1.1rem; color: var(--ink); }
.art-chips .on { background: var(--ink); border-color: var(--ink); color: var(--ground); }
.art-chips .on b { color: var(--ground); }
.art-filter-row { display: flex; gap: 6px; align-items: flex-end; margin-top: 22px; }

/* --- Viti i bletarit --- */
.home-season { padding-block: clamp(56px, 8vw, 96px); background: var(--paper); border-block: 1px solid var(--line); }
.home-season-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px 24px; flex-wrap: wrap; margin-bottom: 24px; }
.home-season-grid { list-style: none; display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.home-season-grid li { padding: 16px 16px 18px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.home-season-m { display: flex; justify-content: space-between; align-items: center; font-weight: 750; font-size: 1.02rem; text-transform: capitalize; margin-bottom: 6px; }
.home-season-m em { font-style: normal; font-size: .74rem; font-weight: 700; background: var(--honey); color: #1E2B22; padding: 2px 8px; border-radius: 999px; text-transform: none; }
.home-season-grid p { font-size: .9rem; line-height: 1.45; }
.home-season-grid li.is-now { background: var(--ink); }
.home-season-grid li.is-now .home-season-m, .home-season-grid li.is-now p { color: var(--ground); }
[data-theme="dark"] .home-season-grid li.is-now { background: var(--wax); }
[data-theme="dark"] .home-season-grid li.is-now .home-season-m, [data-theme="dark"] .home-season-grid li.is-now p { color: var(--ink); }
@media (max-width: 900px) { .home-season-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) {
  .home-season-grid { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 74%; overflow-x: auto; scroll-snap-type: x mandatory; border-left: none; margin-right: -16px; }
  .home-season-grid li { scroll-snap-align: start; border-left: 1px solid var(--line); border-right: none; }
}

/* --- Brezi i errët + Bletari AI --- */
.home-band { background: var(--ink); color: var(--ground); padding: clamp(56px, 8vw, 96px) 0; }
.home-band h2, .home-band h3 { color: var(--ground); }
.home-band p { color: color-mix(in srgb, var(--ground) 70%, transparent); }
[data-theme="dark"] .home-band { background: #0B100D; border-block: 1px solid var(--line); }
.home-band-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(32px, 6vw, 80px); align-items: start; }
@media (max-width: 860px) { .home-band-grid { grid-template-columns: 1fr; } }
.home-features { list-style: none; display: grid; gap: 22px; margin-top: 22px; }
.home-features li { display: flex; gap: 14px; }
.home-features svg { color: var(--honey); flex-shrink: 0; margin-top: 2px; }

.ai-chat { background: #263329; border: 1px solid rgba(236,238,230,.1); border-radius: 20px; padding: 18px; color: #ECEEE6; }
.ai-chat-head { display: flex; align-items: center; gap: 10px; font-weight: 750; margin-bottom: 14px; }
.ai-chat-mark { width: 32px; height: 32px; border-radius: 50%; background: #1E2B22; color: var(--honey); display: inline-flex; align-items: center; justify-content: center; }
.home-band .ai-q { margin-left: auto; max-width: 86%; background: #ECEEE6; color: #1E2B22; padding: 12px 14px; border-radius: 16px 16px 4px 16px; font-size: .93rem; line-height: 1.45; }
.ai-a { margin-top: 10px; max-width: 92%; background: #1E2B22; border: 1px solid rgba(236,238,230,.1); padding: 12px 14px; border-radius: 4px 16px 16px 16px; font-size: .93rem; line-height: 1.5; }
.home-band .ai-a p { color: #ECEEE6; }
.ai-a ol { margin: 8px 0 0 18px; display: grid; gap: 4px; color: rgba(236,238,230,.85); }
.ai-chat figcaption { margin-top: 12px; font-size: .8rem; color: rgba(236,238,230,.55); }

/* --- Lajmet --- */
.home-news { padding-block: clamp(56px, 8vw, 88px) 0; }
.home-news-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 18px; }
.home-news-list article { border-top: 2px solid var(--ink); padding-top: 12px; }
.home-news time { font-size: .82rem; color: var(--ink-2); font-weight: 600; }
.home-news h3 { font-size: 1.1rem; margin: 6px 0; }
.home-news p { font-size: .93rem; }
@media (max-width: 760px) { .home-news-list { grid-template-columns: 1fr; gap: 22px; } }

/* --- Mbyllja --- */
.home-close { margin-top: clamp(56px, 8vw, 88px); padding-bottom: clamp(48px, 7vw, 80px); }
.home-close-inner { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 28px; }
.home-close h2 { margin: 0 0 2px; font-size: 1.5rem; }
.home-close-hives { display: flex; align-items: flex-end; gap: 6px; }
`

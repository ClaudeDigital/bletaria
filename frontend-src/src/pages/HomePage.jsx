import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Layers, Crown, CalendarClock, Droplets, Sparkles, Store } from 'lucide-react'
import { newsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import HiveStack from '../components/HiveStack'
import { GrassBack, GrassFront, Hills } from '../components/Meadow'
import { fmtDate } from '../lib/format'

// Një rresht kosheresh si në oborr: kate të ndryshme, bojëra të ndryshme
const YARD = [
  { seed: 1, floors: 2 }, { seed: 4, floors: 3 }, { seed: 2, floors: 1 },
  { seed: 6, floors: 4, focus: true }, { seed: 3, floors: 2, status: 'problem' },
  { seed: 5, floors: 3 }, { seed: 8, floors: 1, status: 'empty' }, { seed: 9, floors: 2 },
  { seed: 7, floors: 3 }, { seed: 10, floors: 2, status: 'problem', queenless: true },
]

const FEATURES = [
  { Icon: Layers, title: 'Katet dhe kornizat', text: 'Për çdo kat: sa korniza me bletë, me vezë, me mjaltë dhe sa të reja.' },
  { Icon: Crown, title: 'Mbretëresha', text: 'A është aty, sa muajshe është. Kosheret pa mbretëreshë dalin të shënuara.' },
  { Icon: CalendarClock, title: 'Vizitat', text: 'Planifiko vizitën e radhës. Një ditë më parë të vjen kujtesa në Telegram.' },
  { Icon: Droplets, title: 'Ushqimi dhe trajtimi', text: 'Kush mori shurup, kush acid oksalik, sa dhe kur. Për të gjithë kopshtin ose vetëm disa koshere.' },
  { Icon: Sparkles, title: 'Bletari AI', text: 'Përshkruaj çfarë sheh në koshere dhe merr këshillë praktike, në shqip, në çdo orë.' },
  { Icon: Store, title: 'Tregu dhe komuniteti', text: 'Shit mjaltë e familje bletësh, pyet bletarët e tjerë.' },
]

const STEPS = [
  { title: 'Vizato oborrin', text: 'Krijo kopshtin me rreshtat e tij. Çdo rresht mund të ketë numër të ndryshëm kosheresh.' },
  { title: 'Shëno në vizitë', text: 'Në telefon, pranë kosheres: gjendja, mbretëresha, kornizat e çdo kati.' },
  { title: 'Shih kush ka nevojë', text: 'Pamja e kopshtit të tregon menjëherë kosheret e dobëta, pa mbretëreshë apo bosh.' },
]

function TagBody() {
  return (
    <>
      <div className="stencil" style={{ fontSize: '1.1rem' }}>R1-4</div>
      <dl>
        <div><dt>Kate</dt><dd>4</dd></div>
        <div><dt>Mbretëresha</dt><dd>14 muaj</dd></div>
        <div><dt>Korniza mjalti</dt><dd>22</dd></div>
        <div><dt>Vizita e fundit</dt><dd>para 3 ditësh</dd></div>
      </dl>
    </>
  )
}

function Yard() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  const hiveW = w < 560 ? 56 : w < 900 ? 74 : 92
  return (
    <section className="home-yard" aria-label="Shembull: një rresht kosheresh në oborr">
      <div className="home-yard-tag home-yard-tag-mobile"><TagBody /></div>
      <div className="home-yard-scene">
        <Hills height={w < 560 ? 70 : 130} />
        <GrassBack height={w < 560 ? 44 : 60} />
        <div className="home-yard-row">
          {YARD.map((h, i) => (
            <div key={i} className={`home-yard-hive${h.focus ? ' is-focus' : ''}${i > 6 ? ' wide-only' : ''}`}>
              {h.focus && <div className="home-yard-tag home-yard-tag-desk"><TagBody /></div>}
              <HiveStack seed={h.seed} floors={h.floors} status={h.status || 'good'} queenless={h.queenless} width={hiveW} />
            </div>
          ))}
        </div>
        <GrassFront height={w < 560 ? 30 : 40} />
      </div>
      <div className="home-yard-soil" />
    </section>
  )
}

export default function HomePage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [news, setNews] = useState([])

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
      <style>{HOME_CSS}</style>

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
            <Link to="/login" className="btn btn-lg home-btn-light">Hyr</Link>
          </div>
          <p className="home-hero-ai"><Sparkles size={16} /> Me Bletari AI: pyet për varroa, mbretëreshën ose ushqimin, në shqip.</p>
        </div>
      </section>

      <Yard />

      <section className="container home-steps">
        <h2>Si punon</h2>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="stencil home-step-n">{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-band">
        <div className="container">
          <h2>Çfarë mban mend për ty</h2>
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
      </section>

      {news.length > 0 && (
        <section className="container home-news">
          <h2>Nga bletaria</h2>
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

      <section className="container home-close">
        <HiveStack seed={2} floors={2} width={52} />
        <div>
          <h2>Fillo me kopshtin e parë.</h2>
          <p>Falas. Të duhen dy minuta për ta vizatuar.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">Krijo llogari</Link>
      </section>
    </div>
  )
}

const HOME_CSS = `
.home h2 { font-size: clamp(1.5rem, 4vw, 2rem); letter-spacing: -0.025em; margin-bottom: 22px; }
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
.home-hero h1 {
  color: #FFF8E6;
  font-size: clamp(2.7rem, 9.5vw, 6rem);
  line-height: .93;
  letter-spacing: -0.045em;
  font-weight: 860;
  max-width: 11ch;
  text-shadow: 0 2px 30px rgba(0,0,0,.35);
}
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

/* Oborri në livadh */
.home-yard {
  position: relative;
  padding-top: clamp(64px, 15vw, 200px);
  background: linear-gradient(180deg, color-mix(in srgb, #CFE0E6 55%, var(--ground)) 0%, var(--ground) 70%);
}
[data-theme="dark"] .home-yard { background: linear-gradient(180deg, #0f1a1d 0%, var(--ground) 75%); }
.home-yard-scene { position: relative; }
.meadow-layer { display: block; position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
.meadow-back { z-index: 0; }
.meadow-hills { position: absolute; left: 0; right: 0; bottom: 20px; display: block; z-index: 0; pointer-events: none; }
.meadow-front { z-index: 2; }
.home-yard-row {
  position: relative; z-index: 1;
  display: flex; align-items: flex-end; justify-content: center; gap: clamp(12px, 3.2vw, 36px);
  padding: 0 24px 16px; max-width: 1240px; margin: 0 auto;
}
.home-yard-hive { position: relative; display: flex; flex-direction: column; align-items: center; }
.home-yard-hive.is-focus .hive-svg { animation: hive-lift .7s .3s cubic-bezier(.2,.8,.2,1) both; }
@keyframes hive-lift { from { transform: translateY(18px); opacity: 0; } }
.home-yard-soil { height: 22px; background: linear-gradient(180deg, var(--grass-4), color-mix(in srgb, var(--grass-4) 70%, var(--soil))); }
.home-yard-tag {
  background: var(--paper); border: 1px solid var(--line); border-radius: 12px;
  padding: 12px 14px; min-width: 200px; white-space: nowrap;
  box-shadow: 0 14px 34px var(--shadow);
}
.home-yard-tag-desk { position: absolute; bottom: calc(100% + 14px); left: 50%; transform: translateX(-30%); z-index: 3; animation: tag-in .5s .8s ease both; }
.home-yard-tag-desk::after { content: ""; position: absolute; left: 30%; bottom: -7px; width: 12px; height: 12px; background: var(--paper); border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); transform: translateX(-50%) rotate(45deg); }
@keyframes tag-in { from { opacity: 0; transform: translate(-30%, 8px); } }
.home-yard-tag-mobile { display: none; }
.home-yard-tag dl { margin-top: 6px; display: grid; gap: 3px; font-size: .84rem; }
.home-yard-tag dl div { display: flex; justify-content: space-between; gap: 16px; }
.home-yard-tag dt { color: var(--ink-2); }
.home-yard-tag dd { font-weight: 650; }
@media (max-width: 900px) { .wide-only { display: none !important; } }
@media (max-width: 560px) {
  .home-yard { padding-top: 24px; }
  .home-yard-hive:nth-child(n+6) { display: none; }
  .home-yard-row { gap: 12px; }
  .home-yard-tag-desk { display: none; }
  .home-yard-tag-mobile { display: block; margin: 0 16px 28px; box-shadow: none; }
}

.home-steps { padding: clamp(48px, 8vw, 88px) 16px; }
.home-steps ol { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.home-steps li { display: flex; gap: 14px; }
.home-step-n { font-size: 2.6rem; line-height: .9; color: var(--honey-deep); min-width: 30px; }
.home-steps h3, .home-features h3 { font-size: 1.05rem; margin-bottom: 4px; }
.home-steps p, .home-features p { font-size: .95rem; max-width: 34ch; }
@media (max-width: 760px) { .home-steps ol { grid-template-columns: 1fr; gap: 22px; } }

.home-band { background: var(--ink); color: var(--ground); padding: clamp(48px, 8vw, 80px) 0; }
.home-band h2, .home-band h3 { color: var(--ground); }
.home-band p { color: color-mix(in srgb, var(--ground) 70%, transparent); }
[data-theme="dark"] .home-band { background: var(--paper); border-block: 1px solid var(--line); }
[data-theme="dark"] .home-band h2, [data-theme="dark"] .home-band h3 { color: var(--ink); }
[data-theme="dark"] .home-band p { color: var(--ink-2); }
.home-features { list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 26px 48px; }
.home-features li { display: flex; gap: 14px; }
.home-features svg { color: var(--honey); flex-shrink: 0; margin-top: 2px; }
@media (max-width: 760px) { .home-features { grid-template-columns: 1fr; } }

.home-news { padding: clamp(48px, 8vw, 80px) 16px 0; }
.home-news-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.home-news-list article { border-top: 2px solid var(--ink); padding-top: 12px; }
.home-news time { font-size: .82rem; color: var(--ink-2); font-weight: 600; }
.home-news h3 { font-size: 1.1rem; margin: 6px 0; }
.home-news p { font-size: .93rem; }
@media (max-width: 760px) { .home-news-list { grid-template-columns: 1fr; gap: 22px; } }

.home-close {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  margin-top: clamp(48px, 8vw, 80px); margin-bottom: clamp(40px, 7vw, 72px);
  padding: 24px 16px; border-top: 1px solid var(--line);
}
.home-close h2 { margin: 0 0 2px; font-size: 1.4rem; }
.home-close > div { flex: 1; min-width: 200px; }
`

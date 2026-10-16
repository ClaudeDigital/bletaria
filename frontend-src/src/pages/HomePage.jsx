import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Layers, Crown, CalendarClock, Droplets, Sparkles, Store } from 'lucide-react'
import { newsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import HiveStack from '../components/HiveStack'
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
  { Icon: Sparkles, title: 'Asistenti', text: 'Përshkruaj çfarë sheh në koshere dhe merr këshillë praktike, në shqip.' },
  { Icon: Store, title: 'Tregu dhe komuniteti', text: 'Shit mjaltë e familje bletësh, pyet bletarët e tjerë.' },
]

const STEPS = [
  { title: 'Vizato oborrin', text: 'Krijo kopshtin me rreshtat e tij. Çdo rresht mund të ketë numër të ndryshëm kosheresh.' },
  { title: 'Shëno në vizitë', text: 'Në telefon, pranë kosheres: gjendja, mbretëresha, kornizat e çdo kati.' },
  { title: 'Shih kush ka nevojë', text: 'Pamja e kopshtit të tregon menjëherë kosheret e dobëta, pa mbretëreshë apo bosh.' },
]

function Tag() {
  return (
    <div className="home-yard-tag home-yard-tag-desk">
      <div className="stencil" style={{ fontSize: '1.1rem' }}>R1-4</div>
      <dl>
        <div><dt>Kate</dt><dd>4</dd></div>
        <div><dt>Mbretëresha</dt><dd>14 muaj</dd></div>
        <div><dt>Korniza mjalti</dt><dd>22</dd></div>
        <div><dt>Vizita e fundit</dt><dd>para 3 ditësh</dd></div>
      </dl>
    </div>
  )
}

function Yard() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  const hiveW = w < 560 ? 54 : w < 900 ? 72 : 88
  return (
    <div className="home-yard" aria-hidden="true">
      <div className="home-yard-row">
        {YARD.map((h, i) => (
          <div key={i} className={`home-yard-hive${h.focus ? ' is-focus' : ''}${i > 6 ? ' wide-only' : ''}`}>
            <HiveStack seed={h.seed} floors={h.floors} status={h.status || 'good'} queenless={h.queenless} width={hiveW} />
            <span className="hive-label">R1-{i + 1}</span>
            {h.focus && <Tag />}
          </div>
        ))}
      </div>
      <div className="home-yard-tag home-yard-tag-mobile">
        <div className="stencil" style={{ fontSize: '1.1rem' }}>R1-4</div>
        <dl>
          <div><dt>Kate</dt><dd>4</dd></div>
          <div><dt>Mbretëresha</dt><dd>14 muaj</dd></div>
          <div><dt>Korniza mjalti</dt><dd>22</dd></div>
          <div><dt>Vizita e fundit</dt><dd>para 3 ditësh</dd></div>
        </dl>
      </div>
    </div>
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

      <section className="container home-hero">
        <h1>Ditari i bletarisë,<br />kat pas kati.</h1>
        <p className="home-lede">
          Shëno vizitat, mbretëreshat dhe kornizat me mjaltë për secilën koshere.
          Në fund të sezonit e di saktë cila punoi e cila jo.
        </p>
        <div className="home-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Krijo llogari falas</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Hyr</Link>
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
.home-hero { padding-top: clamp(40px, 9vw, 96px); }
.home-hero h1 {
  font-size: clamp(2.6rem, 9.5vw, 5.6rem);
  line-height: .95;
  letter-spacing: -0.045em;
  font-weight: 860;
  max-width: 12ch;
}
.home-lede { font-size: clamp(1.05rem, 2.4vw, 1.25rem); max-width: 46ch; margin-top: 22px; color: var(--ink-2); }
.home-cta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }

.home-yard { position: relative; margin-top: clamp(36px, 7vw, 72px); }
.home-yard-row {
  display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px, 3vw, 30px);
  padding: 0 16px;
  min-height: 190px; padding-top: 24px;
}
.home-yard::after {
  content: ""; display: block; height: 18px;
  background: color-mix(in srgb, var(--meadow) 28%, var(--ground));
  border-top: 2px solid color-mix(in srgb, var(--meadow) 55%, var(--ground));
}
.home-yard-hive { display: flex; flex-direction: column; align-items: center; position: relative; }
.home-yard-tag-mobile { display: none; }
.home-yard-hive .hive-label { margin: 2px 0 6px; }
.home-yard-hive.is-focus .hive-label { color: var(--ink); }
.home-yard-hive.is-focus .hive-svg { animation: hive-lift .7s .25s cubic-bezier(.2,.8,.2,1) both; }
@keyframes hive-lift { from { transform: translateY(14px); opacity: 0; } }
.home-yard-tag {
  position: absolute; bottom: calc(100% - 6px); left: 72%; z-index: 2; white-space: nowrap;
  background: var(--paper); border: 1px solid var(--line); border-radius: 12px;
  padding: 12px 14px; min-width: 190px;
  box-shadow: 0 10px 28px var(--shadow);
  animation: tag-in .5s .75s ease both;
}
@keyframes tag-in { from { opacity: 0; transform: translateX(-8px); } }
.home-yard-tag dl { margin-top: 6px; display: grid; gap: 3px; font-size: .84rem; }
.home-yard-tag dl div { display: flex; justify-content: space-between; gap: 16px; }
.home-yard-tag dt { color: var(--ink-2); }
.home-yard-tag dd { font-weight: 650; }
@media (max-width: 900px) { .wide-only { display: none !important; } }
@media (max-width: 560px) {
  .home-yard-row { justify-content: flex-start; padding-left: 16px; min-height: 0; padding-top: 8px; }
  .home-yard-hive:nth-child(n+6) { display: none; }
  .home-yard-tag-desk { display: none; }
  .home-yard-tag-mobile { display: block; position: static; margin: 0 16px 16px; box-shadow: none; }
  .home-yard { display: flex; flex-direction: column-reverse; overflow: hidden; }
  .home-yard::after { order: -1; }
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

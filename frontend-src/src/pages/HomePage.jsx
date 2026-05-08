import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { newsAPI } from '../api'

const IconApiary = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)
const IconHive = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>
    <line x1="12" y1="2" x2="12" y2="22"/>
    <line x1="2" y1="8.5" x2="22" y2="8.5"/>
    <line x1="2" y1="15.5" x2="22" y2="15.5"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconLeaf = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.36a.6.6 0 00.98.68C7 18 9.5 16.5 12 16.5c3 0 5-2 5-5 0-1.5-.5-3-2.5-4.5"/><path d="M3.83 19.36A14.26 14.26 0 0117 3"/>
  </svg>
)
const IconAI = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
)
const IconShop = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)

const FEATURES = [
  { Icon: IconApiary, title: 'Menaxhim Kopshtesh', desc: 'Krijo dhe menaxho kopshtet e tua. Shto, edito dhe gjurmo çdo kopsht me lehtësi.', color: '#F5A623' },
  { Icon: IconHive, title: 'Gjurmim Kosheresh', desc: 'Vizualizim i koshereve në formë grilje me ngjyra sipas statusit. Njoh problemet menjëherë.', color: '#4A7C59' },
  { Icon: IconCalendar, title: 'Regjistrimi i Vizitave', desc: 'Regjistro çdo vizitë me detaje: gjendja e mbretëreshës, statusi, shënimet për çdo koshère.', color: '#8B5E3C' },
  { Icon: IconLeaf, title: 'Plane Ushqimi', desc: 'Planifiko ushqimin dhe ilaçimin e bletëve me saktësi. Shëno dozat dhe datat.', color: '#4A7C59' },
  { Icon: IconAI, title: 'Bletari AI', desc: 'Pyet asistentin AI për probleme me bletët, sëmundje, trajtim dhe këshilla praktike.', color: '#F5A623' },
  { Icon: IconShop, title: 'Marketplace', desc: 'Blej dhe shit mjaltë, koshere, pajisje dhe mbretëresha. Treg i dedikuar bletarëve.', color: '#8B5E3C' },
]

const MOCK_NEWS = [
  {
    id: 1,
    title: 'Sezoni i pranverës — Çfarë duhet të bësh tani',
    excerpt: 'Pranvera ka ardhur dhe bletët janë aktive. Ja çfarë duhet të kontrollosh gjatë kësaj periudhe të rëndësishme.',
    date: '2026-04-15',
    image: 'https://images.unsplash.com/photo-1647427062468-74ff21e8934f?q=80&w=600&auto=format&fit=crop',
    category: 'Këshilla'
  },
  {
    id: 2,
    title: 'Sëmundja Varroa — Si ta luftojmë efektivisht',
    excerpt: 'Varroa mbetet rreziku kryesor për bletët. Mëso metodat më efektive të trajtimit organik dhe kimik.',
    date: '2026-04-10',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    category: 'Shëndet'
  },
  {
    id: 3,
    title: 'Prodhimi i mjaltit — Rekordi i vitit 2025',
    excerpt: 'Bletarët shqiptarë raportojnë prodhim rekord të mjaltit në vitin 2025. Cilësia e lartë tërheq blerës evropianë.',
    date: '2026-04-05',
    image: 'https://images.unsplash.com/photo-1647427062468-74ff21e8934f?q=80&w=600&auto=format&fit=crop&crop=bottom',
    category: 'Lajme'
  },
]

const catColors = { 'Këshilla': 'var(--green)', 'Shëndet': 'var(--gold-dark)', 'Lajme': 'var(--wood)' }

function NewsCard({ item }) {
  const [imgError, setImgError] = useState(false) // eslint-disable-line
  return (
    <article className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ height: '160px', position: 'relative', overflow: 'hidden', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {item.image && !imgError ? (
          <img src={item.image} alt={item.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(139,94,60,0.08) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="40" height="40" viewBox="0 0 30 30" fill="none" opacity="0.25">
              <polygon points="15,2 27,8.5 27,21.5 15,28 3,21.5 3,8.5" fill="var(--gold)"/>
              <polygon points="15,7.5 22,11.5 22,18.5 15,22.5 8,18.5 8,11.5" fill="none" stroke="var(--gold)" strokeWidth="1.5"/>
            </svg>
          </div>
        )}
        <span style={{
          position: 'absolute', top: '0.75rem', left: '0.75rem',
          background: 'var(--card)', border: `1px solid ${catColors[item.category] || 'var(--gold)'}30`,
          color: catColors[item.category] || 'var(--gold)',
          fontSize: '0.68rem', fontWeight: 700,
          padding: '0.2rem 0.6rem', borderRadius: '20px',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>{item.category}</span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text)', lineHeight: 1.45 }}>{item.title}</h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.6, flex: 1, marginBottom: '0.75rem' }}>{item.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {new Date(item.date).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 600 }}>
            Lexo →
          </span>
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const [news, setNews] = useState(MOCK_NEWS)

  useEffect(() => {
    newsAPI.list({ limit: 3 })
      .then(res => { if (res.data?.news?.length) setNews(res.data.news) })
      .catch(() => {})
  }, [])

  return (
    <div>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '640px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1647427062468-74ff21e8934f?q=80&w=1920&auto=format&fit=crop)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(15,8,0,0.88) 0%, rgba(30,15,3,0.80) 50%, rgba(50,25,8,0.55) 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '5rem 1rem 4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)',
            borderRadius: '30px', padding: '0.35rem 1rem',
            marginBottom: '1.5rem', fontSize: '0.8rem', fontWeight: 600,
            color: 'rgba(255,220,120,0.9)', letterSpacing: '0.3px',
          }}>
            Platforma e Bletarisë Shqiptare
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900,
            lineHeight: 1.15, color: 'white', marginBottom: '1.25rem',
            maxWidth: '680px',
          }}>
            Menaxho Bletarinë Tënde<br />
            <span style={{ color: 'var(--gold)' }}>Me Precizitet.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.72)',
            maxWidth: '540px', marginBottom: '2.5rem', lineHeight: 1.75,
          }}>
            Gjurmo kopshtet, koshere dhe shëndetin e bletëve. Lidhu me komunitetin,
            shit produktet dhe konsulto asistentin AI.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontWeight: 700 }}>
              Fillo Falas Sot
            </Link>
            <Link to="/community" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(4px)',
            }}>
              Shiko Komunitetin
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3.5rem', flexWrap: 'wrap' }}>
            {[
              { value: '1,200+', label: 'Bletarë Aktivë' },
              { value: '8,500+', label: 'Koshere' },
              { value: '150+', label: 'Komuna' },
              { value: '24/7', label: 'Bletari AI' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.25rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', marginBottom: '0.6rem' }}>
              Pse <span style={{ color: 'var(--gold)' }}>Bletaria Ime?</span>
            </h2>
            <p style={{ maxWidth: '460px', margin: '0 auto', color: 'var(--muted)', fontSize: '0.95rem' }}>
              Çdo gjë që nevojitet për një bletari moderne dhe të suksesshme
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card card-body"
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-md)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color,
                }}>
                  <f.Icon />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.35rem', fontWeight: 700 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', marginBottom: '0.6rem' }}>Si Funksionon?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Tre hapa të thjeshtë për të filluar</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '780px', margin: '0 auto' }}>
            {[
              { step: '01', title: 'Regjistrohu', desc: 'Krijo llogarinë tënde falas në 30 sekonda — asnjë kartë pagese e nevojshme.' },
              { step: '02', title: 'Shto Kopsht', desc: 'Krijo kopshtin tënd dhe shto koshere me strukturën e plotë të kateve.' },
              { step: '03', title: 'Menaxho', desc: 'Regjistro vizita, gjurmo shëndetin e bletëve dhe konsulto Bletari AI.' },
            ].map((s, i) => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--card)', border: '2px solid var(--gold)',
                  color: 'var(--gold)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 1.25rem',
                  fontSize: '1.3rem', fontWeight: 900, lineHeight: 1,
                  boxShadow: '0 4px 16px rgba(245,166,35,0.15)',
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', fontWeight: 700 }}>{s.title}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section style={{ padding: '5rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', marginBottom: '0.25rem' }}>Lajmet e Fundit</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>Qëndro i informuar për bletarinë shqiptare</p>
            </div>
            <Link to="/community" className="btn btn-ghost btn-sm">Shiko të gjitha →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {news.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', padding: '5rem 0', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,0,0.78)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'white', marginBottom: '1rem', fontWeight: 900 }}>
            Gati të fillosh?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '460px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Bashkohu me mbi 1,200 bletarë shqiptarë që tashmë e përdorin Bletaria Ime
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontWeight: 700 }}>
              Regjistrohu Falas
            </Link>
            <Link to="/marketplace" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.12)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)',
            }}>
              Shfleto Marketplace
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

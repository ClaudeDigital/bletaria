import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { newsAPI } from '../api'

const FEATURES = [
  { icon: '🏡', title: 'Menaxhim Kopshtesh', desc: 'Krijo dhe menaxho kopshtet e tua të bletarisë me lehtësi. Shto, edito dhe gjurmo çdo kopsht.' },
  { icon: '🐝', title: 'Gjurmim Kosheresh', desc: 'Vizualizim i koshereve në formë grilje me ngjyra sipas statusit. Njoh problemet menjëherë.' },
  { icon: '📅', title: 'Regjistrimi i Vizitave', desc: 'Regjistro çdo vizitë me detaje: gjendja e mbretëreshës, statusi, shënimet për çdo koshère.' },
  { icon: '🌿', title: 'Planet e Ushqimit', desc: 'Planifiko ushqimin dhe ilaçimin e bletëve me saktësi. Shënime për çdo koshère.' },
  { icon: '🤖', title: 'AI Ndihmës', desc: 'Pyet asistentin AI për probleme me bletët, sëmundje, trajtim dhe këshilla praktike.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Blej dhe shit mjaltë, koshere, pajisje dhe mbretëresha. Treg i dedikuar bletarëve.' },
]

const MOCK_NEWS = [
  {
    id: 1,
    title: 'Sezoni i pranverës - Çfarë duhet të bësh tani',
    excerpt: 'Pranvera ka ardhur dhe bletët janë aktive. Ja çfarë duhet të kontrollosh në kopshtin tënd gjatë kësaj periudhe të rëndësishme.',
    date: '2026-04-15',
    image: null,
    category: 'Këshilla'
  },
  {
    id: 2,
    title: 'Sëmundja Varroa - Si ta luftojmë efektivisht',
    excerpt: 'Varroa mbetet rreziku kryesor për bletët. Mëso metodat më efektive të trajtimit organik dhe kimik.',
    date: '2026-04-10',
    image: null,
    category: 'Shëndet'
  },
  {
    id: 3,
    title: 'Prodhimi i mjaltit - Rekordi i vitit 2025',
    excerpt: 'Bletarët shqiptarë raportojnë prodhim rekord të mjaltit në vitin 2025. Cilësia e lartë tërheq blerës evropianë.',
    date: '2026-04-05',
    image: null,
    category: 'Lajme'
  },
]

function NewsCard({ item }) {
  const catColors = { 'Këshilla': 'var(--green)', 'Shëndet': 'var(--gold-dark)', 'Lajme': 'var(--wood)' }
  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--gold), var(--wood))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        🍯
      </div>
      <div className="card-body">
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: catColors[item.category] || 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.category}
          </span>
        </div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text)', lineHeight: 1.4 }}>{item.title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>{item.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            📅 {new Date(item.date).toLocaleDateString('sq-AL')}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}>
            Lexo më shumë →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [news, setNews] = useState(MOCK_NEWS)
  const [newsLoading, setNewsLoading] = useState(false)

  useEffect(() => {
    setNewsLoading(true)
    newsAPI.list({ limit: 3 })
      .then(res => {
        if (res.data?.news?.length) setNews(res.data.news)
      })
      .catch(() => {}) // Use mock data on error
      .finally(() => setNewsLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1a0f00 0%, #3d2206 40%, #5c3510 70%, #8B5E3C 100%)',
        color: 'white',
        padding: '5rem 0 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', fontSize: '6rem', opacity: 0.15, transform: 'rotate(15deg)' }}>🐝</div>
        <div style={{ position: 'absolute', bottom: '10%', left: '3%', fontSize: '5rem', opacity: 0.1, transform: 'rotate(-10deg)' }}>🍯</div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'rgba(245, 166, 35, 0.05)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(245, 166, 35, 0.15)',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            borderRadius: '30px',
            padding: '0.4rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--gold-light)',
          }}>
            🌟 Platforma #1 e Bletarisë Shqiptare
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.2, color: 'white' }}>
            Menaxho Bletarinë Tënde<br />
            <span style={{ color: 'var(--gold)' }}>Me Dashuri 🍯</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(255,255,255,0.75)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Gjurmo kopshtet, koshereat dhe shëndetin e bletëve tuaja. Lidhu me komunitetin, shit produktet dhe konsulto asistentin AI.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', fontWeight: 700 }}>
              🐝 Fillo Falas Sot
            </Link>
            <Link to="/community" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(4px)',
            }}>
              💬 Shiko Komunitetin
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2.5rem',
            marginTop: '3.5rem',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '1,200+', label: 'Bletarë' },
              { value: '8,500+', label: 'Koshere' },
              { value: '150+', label: 'Komuna' },
              { value: '24/7', label: 'AI Ndihmës' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gold)' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
              Pse <span style={{ color: 'var(--gold)' }}>Bletaria Ime?</span> 🐝
            </h2>
            <p style={{ maxWidth: '500px', margin: '0 auto', color: 'var(--muted)' }}>
              Çdo gjë që nevojitet për një bletari moderne dhe të suksesshme
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="card card-body"
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-md)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius)',
                  background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(139,94,60,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  border: '1px solid rgba(245,166,35,0.2)',
                }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Si Funksionon?</h2>
            <p style={{ color: 'var(--muted)' }}>Tre hapa të thjeshtë për të filluar</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { step: '01', icon: '📝', title: 'Regjistrohu', desc: 'Krijo llogarinë tënde falas në 30 sekonda' },
              { step: '02', icon: '🏡', title: 'Shto Kopsht', desc: 'Krijo kopshtin tënd dhe shto koshereat' },
              { step: '03', icon: '🐝', title: 'Menaxho', desc: 'Regjistro vizita, gjurmo shëndetin, konsulto AI' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold), var(--wood))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 16px rgba(245, 166, 35, 0.3)',
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold)', letterSpacing: '1px', marginBottom: '0.4rem' }}>HAPI {s.step}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>📰 Lajmet e Fundit</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Qëndro i informuar për bletarinë shqiptare</p>
            </div>
            <Link to="/community" className="btn btn-ghost btn-sm">Shiko të gjitha →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {news.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 0',
        background: 'linear-gradient(135deg, var(--gold) 0%, var(--wood) 100%)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍯</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>
            Gati të fillosh?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Bashkohu me mbi 1,200 bletarë shqiptarë që tashmë e përdorin Bletaria Ime
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--wood)', fontWeight: 700, fontSize: '1rem' }}>
              🐝 Regjistrohu Falas
            </Link>
            <Link to="/marketplace" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
              🛒 Shfleto Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

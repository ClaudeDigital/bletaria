import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '3rem 0 1.5rem',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🍯</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                Bletaria <span style={{ color: 'var(--gold)' }}>Ime</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              Platforma shqipe për menaxhimin e bletarisë. Menaxho kopshtet, gjurmo shëndetin e koshereve, dhe lidhu me komunitetin e bletarëve.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Navigim
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { to: '/community', label: '💬 Komuniteti' },
                { to: '/marketplace', label: '🛒 Marketplace' },
                { to: '/ai', label: '🤖 AI Ndihmës' },
                { to: '/login', label: '🔐 Hyr' },
                { to: '/register', label: '📝 Regjistrohu' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{ color: 'var(--muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                >{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Veçoritë
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                '🏡 Menaxhim kopshtesh',
                '🐝 Gjurmim kosheresh',
                '📅 Regjistrimi i vizitave',
                '🌿 Planet e ushqimit',
                '📊 Statistika',
                '🛒 Treg produktesh',
              ].map((f, i) => (
                <span key={i} style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kontakt
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <span>📧</span>
                <span>info@bletariaime.al</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <span>📱</span>
                <span>+355 69 XXX XXXX</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {['📘', '📸', '🐦'].map((icon, i) => (
                  <button
                    key={i}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >{icon}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            © {year} Bletaria Ime. Të gjitha të drejtat e rezervuara. 🐝
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privatësia', 'Kushtet', 'Cookies'].map(t => (
              <span
                key={t}
                style={{ fontSize: '0.82rem', color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--muted)'}
              >{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

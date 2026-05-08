import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function CoffeeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 010 8h-1"/>
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/>
      <line x1="6" y1="2" x2="6" y2="4"/>
      <line x1="10" y1="2" x2="10" y2="4"/>
      <line x1="14" y1="2" x2="14" y2="4"/>
    </svg>
  )
}
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { notifAPI } from '../api'

function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const fetchCount = async () => {
    try {
      const res = await notifAPI.unreadCount()
      setUnread(res.data.count || 0)
    } catch {}
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await notifAPI.list()
      setNotifs(res.data || [])
      setUnread(0)
      await notifAPI.markAllRead()
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    if (!userId) return
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    if (open) fetchAll()
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await notifAPI.delete(id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const typeIcon = (type) => ({ visit: '📅', info: 'ℹ️', warning: '⚠️', success: '✅' }[type] || '🔔')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          transition: 'var(--transition)',
        }}
        title="Njoftimet"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px', right: '-4px',
            background: '#C0392B',
            color: 'white',
            borderRadius: '50%',
            width: '18px', height: '18px',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--card)',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 899 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '110%',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: '0 8px 24px var(--shadow-md)',
            width: '320px', maxWidth: '90vw', zIndex: 901, overflow: 'hidden',
          }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Njoftimet</span>
              {notifs.length > 0 && (
                <button onClick={() => setNotifs([])} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer' }}>
                  Fshi të gjitha
                </button>
              )}
            </div>
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>Duke ngarkuar...</div>
              ) : notifs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</div>
                  Nuk ke njoftime
                </div>
              ) : notifs.map(n => (
                <div key={n.id} style={{
                  padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                  background: n.read ? 'var(--card)' : 'rgba(245,166,35,0.05)',
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => setOpen(false)}
                        style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none', display: 'block', marginBottom: '0.2rem' }}>
                        {n.title}
                      </Link>
                    ) : (
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{n.title}</div>
                    )}
                    {n.message && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>{n.message}</div>}
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      {new Date(n.created_at).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={e => handleDelete(e, n.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, padding: '2px 4px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropdownOpen(false)
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  const publicLinks = [
    { to: '/community', label: 'Komuniteti' },
    { to: '/marketplace', label: 'Tregu' },
  ]

  const privateLinks = [
    { to: '/dashboard', label: 'Kopshtet' },
    { to: '/community', label: 'Komuniteti' },
    { to: '/marketplace', label: 'Tregu' },
    { to: '/ai', label: 'Bletari AI' },
  ]

  return (
    <nav style={{
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, marginTop: '4px' }}>
          <img src="/logo.png" className="logo-full" style={{ height: '94px', width: 'auto', display: 'block' }} alt="Bletaria Ime" />
          <img src="/bleta.png" className="logo-b" style={{ width: '42px', height: '42px', objectFit: 'contain', display: 'none' }} alt="Bletaria Ime" />
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          {isAuthenticated
            ? privateLinks.map(l => (
                <Link key={l.to} to={l.to} style={{
                  fontSize: '0.9rem', fontWeight: 600,
                  color: isActive(l.to) ? 'var(--gold)' : 'var(--muted)',
                  textDecoration: 'none', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = 'var(--text)'}
                  onMouseLeave={e => e.target.style.color = isActive(l.to) ? 'var(--gold)' : 'var(--muted)'}
                >{l.label}</Link>
              ))
            : publicLinks.map(l => (
                <Link key={l.to} to={l.to} style={{
                  fontSize: '0.9rem', fontWeight: 600,
                  color: isActive(l.to) ? 'var(--gold)' : 'var(--muted)',
                  textDecoration: 'none',
                }}>{l.label}</Link>
              ))
          }
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', transition: 'var(--transition)',
          }} title={isDark ? 'Mënyra e ditës' : 'Mënyra e natës'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          <Link to="/donate" title="Mbështet platformën me një kafe" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', transition: 'var(--transition)', textDecoration: 'none',
            flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <CoffeeIcon />
          </Link>

          {isAuthenticated && <NotificationBell userId={user?.id} />}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '30px', padding: '0.35rem 0.75rem 0.35rem 0.35rem',
                cursor: 'pointer', transition: 'var(--transition)',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--gold)', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem',
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'B'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0] || 'Bletari'}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 899 }} onClick={() => setDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: '110%',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', boxShadow: '0 8px 24px var(--shadow-md)',
                    minWidth: '180px', zIndex: 901, overflow: 'hidden',
                  }}>
                    {[
                      { to: '/profile', label: 'Profili Im' },
                      { to: '/dashboard', label: 'Kopshtet e Mia' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 1rem', color: 'var(--text)',
                        textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >{item.label}</Link>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border)' }} />
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.75rem 1rem', color: 'var(--red)',
                      background: 'none', border: 'none', width: '100%',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
                      fontFamily: 'var(--font)', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >Dil</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Hyr</Link>
              <Link to="/register" className="btn btn-primary btn-sm register-btn">Regjistrohu</Link>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.25rem', color: 'var(--text)', fontSize: '1.4rem', display: 'none',
          }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', padding: '1rem' }}>
          {(isAuthenticated ? privateLinks : publicLinks).map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '0.75rem',
              color: isActive(l.to) ? 'var(--gold)' : 'var(--text)',
              textDecoration: 'none', fontWeight: 600,
              borderRadius: 'var(--radius-sm)', marginBottom: '0.25rem',
            }}>{l.label}</Link>
          ))}
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <Link to="/login" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Hyr</Link>
              <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Regjistrohu</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .register-btn { display: none !important; }
          .logo-full { display: none !important; }
          .logo-b { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

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
    { to: '/', label: '🏠 Ballina' },
    { to: '/community', label: 'Komuniteti' },
    { to: '/marketplace', label: 'Tregu' },
  ]

  const privateLinks = [
    { to: '/', label: '🏠' },
    { to: '/dashboard', label: '🏡 Kopshtet' },
    { to: '/community', label: '💬 Komuniteti' },
    { to: '/marketplace', label: '🛒 Tregu' },
    { to: '/ai', label: '🤖 AI Ndihmës' },
  ]

  return (
    <nav style={{
      background: 'var(--card)',
      borderBottom: '2px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 900,
      boxShadow: '0 2px 8px var(--shadow)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '64px', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.6rem' }}>🍯</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
            Bletaria <span style={{ color: 'var(--gold)' }}>Ime</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          {isAuthenticated
            ? privateLinks.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: isActive(l.to) ? 'var(--gold)' : 'var(--muted)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.color = 'var(--text)'}
                  onMouseLeave={e => e.target.style.color = isActive(l.to) ? 'var(--gold)' : 'var(--muted)'}
                >{l.label}</Link>
              ))
            : publicLinks.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: isActive(l.to) ? 'var(--gold)' : 'var(--muted)',
                    textDecoration: 'none',
                  }}
                >{l.label}</Link>
              ))
          }
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
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
            title={isDark ? 'Mënyra e ditës' : 'Mënyra e natës'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '30px',
                  padding: '0.35rem 0.75rem 0.35rem 0.35rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
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
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 899 }}
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 24px var(--shadow-md)',
                    minWidth: '180px',
                    zIndex: 901,
                    overflow: 'hidden',
                  }}>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >👤 Profili Im</Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >🏡 Kopshtet e Mia</Link>
                    <div style={{ height: '1px', background: 'var(--border)' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        color: 'var(--red)',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >🚪 Dil</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Hyr</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Regjistrohu</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="hamburger"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: 'var(--text)',
              fontSize: '1.4rem',
              display: 'none',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          padding: '1rem',
        }}>
          {(isAuthenticated ? privateLinks : publicLinks).map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '0.75rem',
                color: isActive(l.to) ? 'var(--gold)' : 'var(--text)',
                textDecoration: 'none',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.25rem',
              }}
            >{l.label}</Link>
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
        }
      `}</style>
    </nav>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, Coffee, LayoutGrid, Users, Store, Sparkles, UserRound, BarChart3, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { notifAPI } from '../api'
import { fmtDate } from '../lib/format'

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

  useEffect(() => {
    if (!userId) return
    fetchCount()
    const t = setInterval(fetchCount, 60000)
    return () => clearInterval(t)
  }, [userId])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    notifAPI.list()
      .then(res => { setNotifs(res.data || []); setUnread(0); return notifAPI.markAllRead() })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const remove = async (id) => {
    try { await notifAPI.delete(id) } catch {}
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label={unread ? `Njoftimet, ${unread} të palexuara` : 'Njoftimet'}>
        <Bell size={20} />
        {unread > 0 && <span className="count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="menu-pop" style={{ width: 340, maxWidth: 'calc(100vw - 24px)', right: -48 }}>
          <div style={{ padding: '14px 16px', fontWeight: 750, borderBottom: '1px solid var(--line)' }}>Njoftimet</div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ padding: 24, textAlign: 'center', fontSize: '.9rem' }}>Duke ngarkuar…</p>
            ) : notifs.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', fontSize: '.9rem' }}>Asnjë njoftim. Këtu të kujtojmë vizitat e planifikuara.</p>
            ) : notifs.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {n.link
                    ? <Link to={n.link} onClick={() => setOpen(false)} style={{ fontWeight: 650, color: 'var(--ink)', padding: 0 }}>{n.title}</Link>
                    : <div style={{ fontWeight: 650 }}>{n.title}</div>}
                  {n.message && <div style={{ fontSize: '.84rem', color: 'var(--ink-2)', marginTop: 2 }}>{n.message}</div>}
                  <div style={{ fontSize: '.76rem', color: 'var(--ink-2)', marginTop: 4 }}>{fmtDate(n.created_at)}</div>
                </div>
                <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => remove(n.id)} aria-label="Fshi njoftimin">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const links = !isAuthenticated
    ? [
        { to: '/community', label: 'Komuniteti', Icon: Users },
        { to: '/marketplace', label: 'Tregu', Icon: Store },
      ]
    : isAdmin
      ? [
          { to: '/admin', label: 'Paneli', Icon: BarChart3 },
          { to: '/community', label: 'Komuniteti', Icon: Users },
          { to: '/marketplace', label: 'Tregu', Icon: Store },
        ]
      : [
          { to: '/dashboard', label: 'Kopshtet', Icon: LayoutGrid },
          { to: '/community', label: 'Komuniteti', Icon: Users },
          { to: '/marketplace', label: 'Tregu', Icon: Store },
          { to: '/ai', label: 'Asistenti', Icon: Sparkles },
        ]

  const first = user?.name?.split(' ')[0] || 'Bletari'

  return (
    <>
      <header className="site-nav">
        <div className="container site-nav-inner">
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="brand" aria-label="Bletaria Ime, faqja kryesore">
            <img src="/bleta.png" alt="" />
            <span className="brand-word">Bletaria <span>ime</span></span>
          </Link>

          <nav className="nav-links" aria-label="Navigimi kryesor">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{l.label}</NavLink>
            ))}
          </nav>

          <div className="nav-right">
            <button className="icon-btn" onClick={toggleTheme} aria-label={isDark ? 'Kalo në pamjen e ditës' : 'Kalo në pamjen e natës'}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/donate" className="icon-btn nav-desktop-only" aria-label="Mbështet platformën">
              <Coffee size={20} />
            </Link>

            {isAuthenticated && <NotificationBell userId={user?.id} />}

            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-haspopup="menu"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', border: '1px solid var(--line)', borderRadius: 999, background: 'var(--paper)', cursor: 'pointer', font: 'inherit', color: 'var(--ink)' }}>
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: '.82rem' }}>
                    {user?.avatar ? <img src={user.avatar} alt="" /> : first.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 650, fontSize: '.9rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first}</span>
                </button>
                {menuOpen && (
                  <div className="menu-pop" role="menu">
                    <div style={{ padding: '14px 16px 10px' }}>
                      <div style={{ fontWeight: 750 }}>{user?.name}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
                    <div className="sep" />
                    <Link to="/profile" onClick={() => setMenuOpen(false)}><UserRound size={18} /> Profili</Link>
                    {isAdmin
                      ? <Link to="/admin" onClick={() => setMenuOpen(false)}><BarChart3 size={18} /> Paneli i adminit</Link>
                      : <Link to="/dashboard" onClick={() => setMenuOpen(false)}><LayoutGrid size={18} /> Kopshtet e mia</Link>}
                    <Link to="/donate" onClick={() => setMenuOpen(false)}><Coffee size={18} /> Mbështet platformën</Link>
                    <div className="sep" />
                    <button className="danger" onClick={handleLogout}><LogOut size={18} /> Dil</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Hyr</Link>
                <Link to="/register" className="btn btn-primary btn-sm nav-desktop-only">Krijo llogari</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <nav className="tabbar" aria-label="Navigimi në telefon">
          <div className="tabbar-inner">
            {[...links, { to: '/profile', label: 'Profili', Icon: UserRound }].map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                <Icon size={22} strokeWidth={1.9} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}

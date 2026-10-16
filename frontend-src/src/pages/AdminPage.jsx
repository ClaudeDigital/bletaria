import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminAuthAPI, adminDataAPI } from '../api'
import { useAuth } from '../context/AuthContext'

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminAuthAPI.login(form)
      const token = res.data.token
      localStorage.setItem('bletaria_admin_token', token)
      onLogin(res.data.admin || { username: form.username })
    } catch (err) {
      setError('Kredencialet e pasakta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface)',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div className="card">
          <div style={{ padding: '2rem 2rem 0', textAlign: 'center' }}>
            
            <h1 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Admin Panel</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Bletaria Ime — Administrim</p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Emri i Përdoruesit</label>
              <input type="text" className="form-control" placeholder="admin" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Fjalëkalimi</label>
              <input type="password" className="form-control" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Duke hyrë...' : 'Hyr në Admin'}
            </button>
          </form>
          <div style={{ padding: '0 2rem 1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>Hyr me llogarinë e adminit</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Subcomponents ---

const fmtDate = (d) => {
  if (!d) return '—'
  const x = new Date(String(d).replace(' ', 'T'))
  return isNaN(x) ? '—' : `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`
}
const MONTHS = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj']

const HIVE_STATUS = [
  { key: 'good', label: 'Mirë', color: 'var(--green)' },
  { key: 'problem', label: 'Me probleme', color: 'var(--gold)' },
  { key: 'dead', label: 'Të vdekura', color: 'var(--red)' },
  { key: 'empty', label: 'Bosh', color: '#bdbdbd' },
]

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '1.75rem' }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminDataAPI.stats()
      .then(res => setStats(res.data))
      .catch(() => setError('Statistikat nuk u ngarkuan.'))
  }, [])

  if (error) return <div className="alert alert-error">{error}</div>
  if (!stats) return <PageLoader />

  const cards = [
    { label: 'Bletarë të regjistruar', value: stats.users, sub: `+${stats.new_users_30d} në 30 ditët e fundit` },
    { label: 'Me kopshte', value: stats.users_with_apiaries, sub: `${stats.active_users} llogari aktive` },
    { label: 'Kopshte', value: stats.apiaries },
    { label: 'Koshere', value: stats.hives, sub: stats.queenless ? `${stats.queenless} pa mbretëreshë` : null },
    { label: 'Vizita', value: stats.visits, sub: `${stats.visits_30d} në 30 ditët e fundit` },
    { label: 'Plane ushqimi', value: stats.feeding_plans },
  ]

  const totalHives = Math.max(1, HIVE_STATUS.reduce((s, h) => s + (stats.hive_status?.[h.key] || 0), 0))
  const maxReg = Math.max(1, ...stats.registrations_by_month.map(r => r.c))
  const maxLoc = Math.max(1, ...stats.by_location.map(r => r.hives))

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Statistikat</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {cards.map(c => (
          <div key={c.label} className="card card-body" style={{ padding: '1rem' }}>
            <div className="stencil" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '0.35rem' }}>{c.label}</div>
            {c.sub && <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <Section title="Gjendja e koshereve">
        <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'var(--surface)' }}>
          {HIVE_STATUS.map(h => (
            <div key={h.key} title={h.label} style={{ width: `${(stats.hive_status?.[h.key] || 0) / totalHives * 100}%`, background: h.color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', marginTop: '0.6rem', fontSize: '0.82rem' }}>
          {HIVE_STATUS.map(h => (
            <span key={h.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: h.color }} />
              {h.label}: <strong>{stats.hive_status?.[h.key] || 0}</strong>
            </span>
          ))}
        </div>
      </Section>

      <Section title="Regjistrimet sipas muajve">
        {stats.registrations_by_month.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Asnjë regjistrim në 12 muajt e fundit.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px', overflowX: 'auto' }}>
            {stats.registrations_by_month.map(r => {
              const [y, m] = r.month.split('-')
              return (
                <div key={r.month} style={{ flex: '1 0 34px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.c}</span>
                  <div style={{ width: '100%', maxWidth: '36px', height: `${r.c / maxReg * 80}%`, minHeight: '4px', background: 'var(--gold)', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{MONTHS[+m - 1]} {y.slice(2)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Kosheret sipas vendndodhjes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {stats.by_location.map(r => (
            <div key={r.location} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 38%) 1fr auto', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</span>
              <div style={{ height: '10px', background: 'var(--surface)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${r.hives / maxLoc * 100}%`, height: '100%', background: 'var(--green)' }} />
              </div>
              <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}><strong style={{ color: 'var(--text)' }}>{r.hives}</strong> koshere, {r.apiaries} {r.apiaries === 1 ? 'kopsht' : 'kopshte'}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    adminDataAPI.users()
      .then(res => setUsers(res.data.users || []))
      .catch(() => setError('Regjistrimet nuk u ngarkuan.'))
  }, [])

  if (error) return <div className="alert alert-error">{error}</div>
  if (!users) return <PageLoader />

  const q = search.trim().toLowerCase()
  const filtered = users.filter(u => !q
    || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    || u.email.toLowerCase().includes(q)
    || u.apiaries.some(a => (a.location || '').toLowerCase().includes(q)))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Regjistrimet <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({users.length})</span></h2>
        <input type="search" className="form-control" placeholder="Kërko emër, email ose vend..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: '260px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map(u => {
          const isOpen = open === u.id
          return (
            <div key={u.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : u.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem',
                background: 'var(--card)', border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font)', color: 'var(--text)',
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>
                    {u.first_name} {u.last_name}
                    {!u.active && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>Joaktiv</span>}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}, regjistruar më {fmtDate(u.created_at)}
                  </span>
                </span>
                <span style={{ textAlign: 'right', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  <strong>{u.apiary_count}</strong> {u.apiary_count === 1 ? 'kopsht' : 'kopshte'}<br />
                  <span style={{ color: 'var(--muted)' }}>{u.hive_count} koshere</span>
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0.25rem 0.9rem 0.9rem', background: 'var(--surface)', fontSize: '0.84rem' }}>
                  <p style={{ color: 'var(--muted)', margin: '0.5rem 0' }}>
                    Vizita e fundit: {fmtDate(u.last_visit)}. Postime: {u.post_count}.
                  </p>
                  {u.apiaries.length === 0 ? (
                    <p style={{ color: 'var(--muted)', margin: 0 }}>Nuk ka krijuar ende kopshte.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead><tr><th>Kopshti</th><th>Vendndodhja</th><th>Koshere</th><th>Krijuar</th></tr></thead>
                        <tbody>
                          {u.apiaries.map(a => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600 }}>{a.name}</td>
                              <td style={{ color: 'var(--muted)' }}>{a.location || '—'}</td>
                              <td>{a.hives}</td>
                              <td style={{ color: 'var(--muted)' }}>{fmtDate(a.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <p style={{ color: 'var(--muted)' }}>Asnjë rezultat.</p>}
      </div>
    </div>
  )
}

// --- Main AdminPage ---
export default function AdminPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('bletaria_admin_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.exp && payload.exp * 1000 < Date.now()) return null
        return { username: payload.username || 'Admin' }
      } catch { return null }
    }
    return null
  })
  const [activeTab, setActiveTab] = useState('stats')

  const handleLogout = () => {
    localStorage.removeItem('bletaria_admin_token')
    logout()
    setAdmin(null)
    navigate('/')
  }

  if (!admin) return <AdminLogin onLogin={setAdmin} />

  const TABS = [
    { id: 'stats', label: 'Statistikat' },
    { id: 'users', label: 'Regjistrimet' },
  ]

  return (
    <div className="page-content">
      <div className="container">
        <div style={{
          background: 'var(--ink)',
          borderRadius: 'var(--radius)',
          padding: '1.1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.1rem' }}>Paneli i Adminit</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', margin: 0 }}>
              {admin.username}. Vetëm shikim i statistikave dhe regjistrimeve.
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Dil
          </button>
        </div>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="card card-body">
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'users' && <UsersTab />}
        </div>
      </div>
    </div>
  )
}

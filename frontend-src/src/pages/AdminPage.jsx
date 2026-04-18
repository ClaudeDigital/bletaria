import { useState, useEffect } from 'react'
import { adminAuthAPI, adminDataAPI } from '../api'

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
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
            <h1 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Admin Panel</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Bletaria Ime — Administrim</p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem' }}>
            {error && <div className="alert alert-error">⚠️ {error}</div>}
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
              {loading ? '⏳ Duke hyrë...' : '🔐 Hyr në Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// --- Subcomponents ---

function StatsTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminDataAPI.stats()
      .then(res => setStats(res.data))
      .catch(() => setStats({
        users: 247, active_users: 198,
        apiaries: 412, hives: 3840,
        visits_today: 18, visits_week: 89,
        posts: 1024, listings: 56,
      }))
  }, [])

  if (!stats) return <div className="loading-center"><div className="spinner" /></div>

  const cards = [
    { icon: '👥', label: 'Perdorues', value: stats.users, sub: `${stats.active_users} aktiv` },
    { icon: '🏡', label: 'Kopshte', value: stats.apiaries },
    { icon: '🐝', label: 'Koshere', value: stats.hives },
    { icon: '📅', label: 'Vizita sot', value: stats.visits_today, sub: `${stats.visits_week} këtë javë` },
    { icon: '💬', label: 'Postime', value: stats.posts },
    { icon: '🛒', label: 'Listime', value: stats.listings },
  ]

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>📊 Statistikat e Sistemit</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        {cards.map(c => (
          <div key={c.label} className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{c.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{c.label}</div>
            {c.sub && <div style={{ fontSize: '0.72rem', color: 'var(--green)' }}>{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsTab() {
  const [news, setNews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: 'Lajme' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminDataAPI.newsList()
      .then(res => setNews(res.data.news || []))
      .catch(() => setNews([
        { id: 1, title: 'Sezoni i pranverës', category: 'Këshilla', date: '2026-04-15', published: true },
        { id: 2, title: 'Varroa destructor', category: 'Shëndet', date: '2026-04-10', published: true },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (editItem) {
        await adminDataAPI.updateNews(editItem.id, form)
        setNews(prev => prev.map(n => n.id === editItem.id ? { ...n, ...form } : n))
      } else {
        const res = await adminDataAPI.createNews(form)
        setNews(prev => [res.data.news || { id: Date.now(), ...form, date: new Date().toISOString().slice(0, 10), published: true }, ...prev])
      }
    } catch {}
    setShowForm(false)
    setEditItem(null)
    setForm({ title: '', excerpt: '', content: '', category: 'Lajme' })
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Fshi lajmin?')) return
    try {
      await adminDataAPI.deleteNews(id)
    } catch {}
    setNews(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>📰 Menaxhim Lajmesh</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditItem(null); setForm({ title: '', excerpt: '', category: 'Lajme' }) }}>
          + Lajm i Ri
        </button>
      </div>

      {showForm && (
        <div className="card card-body" style={{ marginBottom: '1rem', background: 'var(--surface)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{editItem ? 'Edito Lajm' : 'Lajm i Ri'}</h3>
          <div className="form-group">
            <label className="form-label">Titulli</label>
            <input type="text" className="form-control" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategoria</label>
              <select className="form-control" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['Lajme', 'Këshilla', 'Shëndet', 'Treg', 'Evente'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Përmbledhje</label>
            <textarea className="form-control" rows={2} value={form.excerpt || ''}
              onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Anulo</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Ruaj</button>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr><th>Titulli</th><th>Kategoria</th><th>Data</th><th>Statusi</th><th>Veprime</th></tr>
          </thead>
          <tbody>
            {news.map(n => (
              <tr key={n.id}>
                <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</td>
                <td><span className="badge badge-gold">{n.category}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{n.date ? new Date(n.date).toLocaleDateString('sq-AL') : '—'}</td>
                <td>
                  <span className={`badge ${n.published ? 'badge-green' : 'badge-gray'}`}>
                    {n.published ? '✅ Publikuar' : '📝 Draft'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(n); setForm(n); setShowForm(true) }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminDataAPI.users()
      .then(res => setUsers(res.data.users || []))
      .catch(() => setUsers([
        { id: 1, name: 'Agim Berisha', email: 'agim@test.com', experience: 'ekspert', location: 'Shkodër', active: true, apiaries: 3, created_at: '2026-01-15' },
        { id: 2, name: 'Flutura Krasniqi', email: 'flutura@test.com', experience: 'mesem', location: 'Prishtinë', active: true, apiaries: 1, created_at: '2026-02-20' },
        { id: 3, name: 'Test User', email: 'test@test.com', experience: 'fillestar', location: 'Tiranë', active: false, apiaries: 0, created_at: '2026-03-10' },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const toggleUser = async (id) => {
    try {
      await adminDataAPI.toggleUser(id)
    } catch {}
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>👥 Menaxhim Përdoruesish</h2>
        <input type="text" className="form-control" placeholder="🔍 Kërko..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: '240px' }} />
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr><th>Emri</th><th>Email</th><th>Eksperienca</th><th>Vendndodhja</th><th>Kopshte</th><th>Statusi</th><th>Veprime</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{u.email}</td>
                <td style={{ fontSize: '0.82rem' }}>{u.experience || '—'}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{u.location || '—'}</td>
                <td style={{ textAlign: 'center' }}>{u.apiaries || 0}</td>
                <td>
                  <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                    {u.active ? '✅ Aktiv' : '🚫 Joaktiv'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-green'}`}
                    onClick={() => toggleUser(u.id)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {u.active ? '🚫 Çaktivizo' : '✅ Aktivizo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MarketplaceAdminTab() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminDataAPI.marketplaceList()
      .then(res => setListings(res.data.listings || []))
      .catch(() => setListings([
        { id: 1, title: 'Mjaltë Luleshtrydhe', price: 8.5, category: 'mjaltë', seller: 'Agim B.', active: true, expires: '2026-05-17' },
        { id: 2, title: 'Koshère Langstroth', price: 45, category: 'koshere', seller: 'Blerim K.', active: true, expires: '2026-05-15' },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const toggleListing = async (id) => {
    try { await adminDataAPI.toggleListing(id) } catch {}
    setListings(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l))
  }

  const deleteListing = async (id) => {
    if (!window.confirm('Fshi listimin?')) return
    try { await adminDataAPI.deleteListing(id) } catch {}
    setListings(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>🛒 Menaxhim Marketplace</h2>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr><th>Produkti</th><th>Çmimi</th><th>Kategoria</th><th>Shitësi</th><th>Skadon</th><th>Statusi</th><th>Veprime</th></tr>
          </thead>
          <tbody>
            {listings.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.title}</td>
                <td style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>€{l.price}</td>
                <td><span className="badge badge-gold">{l.category}</span></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{l.seller}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{l.expires ? new Date(l.expires).toLocaleDateString('sq-AL') : '—'}</td>
                <td>
                  <span className={`badge ${l.active ? 'badge-green' : 'badge-gray'}`}>
                    {l.active ? '✅ Aktiv' : '❌ Joaktiv'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className={`btn btn-sm ${l.active ? 'btn-ghost' : 'btn-green'}`} onClick={() => toggleListing(l.id)} style={{ fontSize: '0.72rem' }}>
                      {l.active ? 'Çaktivizo' : 'Aktivizo'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Main AdminPage ---
export default function AdminPage() {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('bletaria_admin_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return { username: payload.username || 'Admin' }
      } catch { return null }
    }
    return null
  })
  const [activeTab, setActiveTab] = useState('stats')

  const handleLogout = () => {
    localStorage.removeItem('bletaria_admin_token')
    setAdmin(null)
  }

  if (!admin) return <AdminLogin onLogin={setAdmin} />

  const TABS = [
    { id: 'stats', label: '📊 Statistika' },
    { id: 'news', label: '📰 Lajmet' },
    { id: 'users', label: '👥 Perdoruesit' },
    { id: 'marketplace', label: '🛒 Marketplace' },
  ]

  return (
    <div className="page-content">
      <div className="container">
        {/* Admin Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0f00, #3d2206)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚙️</span>
            <div>
              <h1 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.1rem' }}>Admin Panel</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: 0 }}>
                Hyrë si: {admin.username}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            🚪 Dil
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="card card-body">
          {activeTab === 'stats' && <StatsTab />}
          {activeTab === 'news' && <NewsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'marketplace' && <MarketplaceAdminTab />}
        </div>
      </div>
    </div>
  )
}

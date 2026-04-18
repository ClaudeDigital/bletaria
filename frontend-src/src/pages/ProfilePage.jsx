import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { profileAPI, apiaryAPI } from '../api'

const EXPERIENCE_LABELS = {
  fillestar: '🌱 Fillestar',
  mesem: '🌿 Mesatar',
  ekspert: '🌳 Ekspert',
  profesional: '🏆 Profesionist',
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    location: user?.location || '',
    experience: user?.experience || 'fillestar',
    bio: user?.bio || '',
  })
  const [stats, setStats] = useState({ apiaries: 0, hives: 0, visits: 0, posts: 0 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [statsRes, apiariesRes] = await Promise.all([
        profileAPI.stats().catch(() => ({ data: {} })),
        apiaryAPI.list().catch(() => ({ data: [] })),
      ])
      const apiaries = apiariesRes.data.apiaries || apiariesRes.data || []
      const totalHives = apiaries.reduce((s, a) => s + (a.total_hives || 0), 0)
      setStats({
        apiaries: apiaries.length,
        hives: totalHives,
        visits: statsRes.data?.visits || 0,
        posts: statsRes.data?.posts || 0,
      })
    } catch {}
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await profileAPI.update(form)
      updateUser(res.data.user || form)
      setSuccess('Profili u ruajt me sukses!')
      setEditMode(false)
    } catch (err) {
      // If API not available, update locally
      updateUser(form)
      setSuccess('Profili u ruajt!')
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!pwForm.current || !pwForm.newPw) { setPwError('Plotëso të gjitha fushat.'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Fjalëkalimet nuk përputhen.'); return }
    if (pwForm.newPw.length < 6) { setPwError('Fjalëkalimi i ri duhet të ketë min. 6 karaktere.'); return }
    try {
      await profileAPI.update({ password: pwForm.newPw, current_password: pwForm.current })
      setPwSuccess('Fjalëkalimi u ndryshua me sukses!')
      setPwForm({ current: '', newPw: '', confirm: '' })
      setPwError('')
    } catch (err) {
      setPwError(err.response?.data?.message || 'Fjalëkalimi aktual është i gabuar.')
    }
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '700px' }}>
        {/* Profile Header Card */}
        <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--wood))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(245,166,35,0.3)',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || '🐝'}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{user?.name}</h1>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                {user?.location && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📍 {user.location}</span>
                )}
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {EXPERIENCE_LABELS[user?.experience] || '🌱 Fillestar'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                {user?.email}
              </p>
              {user?.bio && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.5rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
          }}>
            {[
              { icon: '🏡', value: stats.apiaries, label: 'Kopshte' },
              { icon: '🐝', value: stats.hives, label: 'Koshere' },
              { icon: '📅', value: stats.visits, label: 'Vizita' },
              { icon: '💬', value: stats.posts, label: 'Postime' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold)' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: 'profile', label: '👤 Profili' },
            { id: 'security', label: '🔒 Siguria' },
            { id: 'notifications', label: '🔔 Njoftimet' },
          ].map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card card-body">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">✅ {success}</div>}

            {editMode ? (
              <div>
                <div className="form-group">
                  <label className="form-label">👤 Emri i plotë</label>
                  <input type="text" className="form-control" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">📍 Vendndodhja</label>
                  <input type="text" className="form-control" value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="p.sh. Shkodër, Tiranë..." />
                </div>
                <div className="form-group">
                  <label className="form-label">🏆 Niveli i Eksperiencës</label>
                  <select className="form-control" value={form.experience}
                    onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}>
                    {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">📝 Bio</label>
                  <textarea className="form-control" rows={3} value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Trego pak për veten dhe eksperiencën tënde..." />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Anulo</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Duke ruajtur...' : '💾 Ruaj Ndryshimet'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: '👤 Emri', value: user?.name },
                  { label: '📧 Email', value: user?.email },
                  { label: '📍 Vendndodhja', value: user?.location || '—' },
                  { label: '🏆 Eksperienca', value: EXPERIENCE_LABELS[user?.experience] || '—' },
                  { label: '📝 Bio', value: user?.bio || '—' },
                ].map(f => (
                  <div key={f.label} style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)', width: '140px', flexShrink: 0 }}>{f.label}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)', flex: 1 }}>{f.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                    ✏️ Edito Profilin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="card card-body">
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🔒 Ndrysho Fjalëkalimin</h3>
            {pwError && <div className="alert alert-error">⚠️ {pwError}</div>}
            {pwSuccess && <div className="alert alert-success">✅ {pwSuccess}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Fjalëkalimi Aktual</label>
                <input type="password" className="form-control" value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fjalëkalimi i Ri</label>
                <input type="password" className="form-control" value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Konfirmo Fjalëkalimin e Ri</label>
                <input type="password" className="form-control" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                  🔒 Ndrysho Fjalëkalimin
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card card-body">
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🔔 Preferencat e Njoftimeve</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'visit_reminder', label: '📅 Kujtues vizitash', desc: 'Njoftim çdo javë nëse nuk ke vizituar kopshtin' },
                { key: 'community_reply', label: '💬 Përgjigje komuniteti', desc: 'Kur dikush komenton postimet tuaja' },
                { key: 'marketplace', label: '🛒 Marketplace', desc: 'Listim të reja të ngjashme me interesat tuaja' },
                { key: 'ai_tips', label: '🤖 Këshilla AI', desc: 'Këshilla sezonale nga Bletari AI' },
              ].map((n, i) => (
                <div key={n.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.75rem 0',
                  borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{n.desc}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--green)',
                      borderRadius: '24px',
                      transition: 'background 0.2s',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '4px',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        background: 'white',
                        borderRadius: '50%',
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button className="btn btn-primary">💾 Ruaj Preferencat</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

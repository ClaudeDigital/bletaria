import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

function DemoAccounts({ onPick, busyId }) {
  const [accounts, setAccounts] = useState(null)

  useEffect(() => {
    api.get('/demo/accounts')
      .then(res => setAccounts(res.data.accounts || []))
      .catch(() => setAccounts([]))
  }, [])

  if (!accounts || accounts.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Hyr me një prekje</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
          Llogari demo — zgjidh kë do të provosh, pa fjalëkalim.
        </p>
      </div>
      <div style={{ padding: '0.5rem 0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {accounts.map(a => {
          const admin = a.role === 'admin'
          const name = `${a.first_name} ${a.last_name}`.trim()
          return (
            <button key={a.id} type="button" onClick={() => onPick(a)} disabled={!!busyId}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.7rem 0.75rem', textAlign: 'left', cursor: busyId ? 'wait' : 'pointer',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', color: 'var(--text)',
                opacity: busyId && busyId !== a.id ? 0.55 : 1, minHeight: '56px',
              }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: admin ? 'var(--wood, #8B5E3C)' : 'var(--gold)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
              }}>{admin ? 'A' : name.charAt(0)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>
                  {admin ? 'Administratori' : name}
                </span>
                <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {admin
                    ? 'Statistika dhe regjistrimet'
                    : `${a.apiary_count} ${a.apiary_count === 1 ? 'kopsht' : 'kopshte'} · ${a.hive_count} koshere${a.locations ? ' · ' + a.locations : ''}`}
                </span>
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-dark, #c4841a)', flexShrink: 0 }}>
                {busyId === a.id ? '…' : 'Hyr →'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [demoBusy, setDemoBusy] = useState(null)

  const goHome = (u) => navigate(u?.role === 'admin' ? '/admin' : from, { replace: true })

  const handleDemo = async (account) => {
    setError('')
    setDemoBusy(account.id)
    try {
      goHome(await demoLogin(account.id))
    } catch {
      setError('Hyrja demo dështoi. Provo sërish.')
      setDemoBusy(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Plotëso të gjitha fushat.')
      return
    }
    setError('')
    setLoading(true)
    try {
      goHome(await login(form.email, form.password))
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Email ose fjalëkalim i gabuar.')
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
      padding: '2rem 1rem',
      background: 'var(--surface)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <DemoAccounts onPick={handleDemo} busyId={demoBusy} />
        {/* Card */}
        <div className="card">
          <div style={{
            padding: '2rem 2rem 0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍯</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mirë se erdhe</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Hyr në llogarinë tënde</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem 2rem' }}>
            {error && (
              <div className="alert alert-error">
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">📧 Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="email@shembull.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>🔒 Fjalëkalimi</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
                  Harrova fjalëkalimin
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: '1rem',
                    padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? '⏳ Duke hyrë...' : '🐝 Hyr tani'}
            </button>
          </form>

          <div style={{
            padding: '1.25rem 2rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Nuk ke llogari?{' '}
            </span>
            <Link to="/register" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
              Regjistrohu falas
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

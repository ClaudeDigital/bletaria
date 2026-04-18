import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Plotëso të gjitha fushat.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Email ose fjalëkalim i gabuar.')
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
                autoFocus
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

        {/* Demo hint */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(245,166,35,0.1)',
          border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}>
          💡 Demo: admin@bletaria.com / admin123
        </div>
      </div>
    </div>
  )
}

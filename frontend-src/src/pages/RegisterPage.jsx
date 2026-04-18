import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    experience: 'fillestar',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Plotëso të gjitha fushat e detyrueshme.')
      return
    }
    if (form.password.length < 6) {
      setError('Fjalëkalimi duhet të jetë të paktën 6 karaktere.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Fjalëkalimet nuk përputhen.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim gjatë regjistrimit. Provo sërish.')
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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div className="card">
          <div style={{ padding: '2rem 2rem 0', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐝</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Regjistrohu</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Bashkohu me komunitetin e bletarëve</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem 2rem' }}>
            {error && (
              <div className="alert alert-error">⚠️ {error}</div>
            )}

            <div className="form-group">
              <label className="form-label">👤 Emri i plotë *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Agim Berisha"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">📧 Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="email@shembull.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">🔒 Fjalëkalimi *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Min. 6 karaktere"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                  >{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">🔒 Konfirmo *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ripërsërit"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">📍 Vendndodhja</label>
              <input
                type="text"
                className="form-control"
                placeholder="p.sh. Shkodër, Tiranë..."
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏆 Niveli i Eksperiencës</label>
              <select
                className="form-control"
                value={form.experience}
                onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
              >
                <option value="fillestar">🌱 Fillestar (0-2 vjet)</option>
                <option value="mesem">🌿 Mesatar (2-5 vjet)</option>
                <option value="ekspert">🌳 Ekspert (5+ vjet)</option>
                <option value="profesional">🏆 Profesionist / Komercial</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
            >
              {loading ? '⏳ Duke u regjistruar...' : '🐝 Regjistrohu Falas'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
              Duke u regjistruar, pranon{' '}
              <span style={{ color: 'var(--gold)', cursor: 'pointer' }}>Kushtet e Shërbimit</span>
              {' '}dhe{' '}
              <span style={{ color: 'var(--gold)', cursor: 'pointer' }}>Politikën e Privatësisë</span>
            </p>
          </form>

          <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Ke tashmë llogari? </span>
            <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>Hyr</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

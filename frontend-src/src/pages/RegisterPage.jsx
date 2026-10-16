import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AUTH_CSS } from './LoginPage'
import HiveStack from '../components/HiveStack'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Shkruaj emrin, email-in dhe një fjalëkalim.')
      return
    }
    if (form.password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 shenja.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Llogaria nuk u krijua. Provo përsëri.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <style>{AUTH_CSS}</style>
      <div className="container auth-grid">
        <div className="auth-main">
          <h1>Krijo llogari</h1>
          <p className="auth-sub">Falas. Pastaj vizaton kopshtin tënd të parë.</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Emri dhe mbiemri</label>
              <input id="name" className="form-control" autoComplete="name" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" inputMode="email" className="form-control" autoComplete="email"
                placeholder="emri@shembull.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Fjalëkalimi</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPass ? 'text' : 'password'} className="form-control"
                  autoComplete="new-password" style={{ paddingRight: 48 }} value={form.password} onChange={set('password')} />
                <button type="button" className="icon-btn" onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} style={{ position: 'absolute', right: 3, top: 3 }}>
                  {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              <p className="form-hint">Të paktën 6 shenja.</p>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Duke krijuar…' : 'Krijo llogari'}
            </button>
          </form>
          <p className="auth-switch">Ke llogari? <Link to="/login">Hyr</Link></p>
        </div>

        <aside className="auth-demo" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            {[[3, 2], [5, 3], [1, 1], [4, 2]].map(([s, f]) => <HiveStack key={s} seed={s} floors={f} width={40} />)}
          </div>
          <h2>Pas regjistrimit</h2>
          <ol style={{ margin: '10px 0 6px 20px', color: 'var(--ink-2)', fontSize: '.93rem', display: 'grid', gap: 6 }}>
            <li>Jep emrin e kopshtit dhe sa koshere ka çdo rresht.</li>
            <li>Prek një koshere për të shënuar gjendjen e saj.</li>
            <li>Në vizitën e radhës, regjistro të gjitha me një herë.</li>
          </ol>
        </aside>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, BarChart3, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import HiveStack from '../components/HiveStack'
import { plural } from '../lib/format'

function DemoAccounts({ onPick, busyId }) {
  const [accounts, setAccounts] = useState(null)

  useEffect(() => {
    api.get('/demo/accounts')
      .then(res => setAccounts(res.data.accounts || []))
      .catch(() => setAccounts([]))
  }, [])

  if (!accounts || accounts.length === 0) return null

  return (
    <section className="auth-demo" aria-labelledby="demo-title">
      <h2 id="demo-title">Provo pa fjalëkalim</h2>
      <p>Llogari demo me të dhëna shembull. Prek njërën për të hyrë.</p>
      <ul>
        {accounts.map(a => {
          const admin = a.role === 'admin'
          const name = admin ? 'Administratori' : `${a.first_name} ${a.last_name}`.trim()
          const detail = admin
            ? 'Statistikat dhe regjistrimet'
            : `${plural(a.apiary_count, 'kopsht', 'kopshte')}, ${a.hive_count} koshere`
          return (
            <li key={a.id}>
              <button type="button" onClick={() => onPick(a)} disabled={!!busyId}
                aria-label={`Hyr si ${name}`} data-busy={busyId === a.id || undefined}>
                <span className="auth-demo-mark">
                  {admin
                    ? <BarChart3 size={22} />
                    : <HiveStack seed={a.id} floors={Math.min(4, a.apiary_count)} width={30} />}
                </span>
                <span className="auth-demo-text">
                  <strong>{name}</strong>
                  <span>{detail}</span>
                  {!admin && a.locations && <span className="auth-demo-loc">{a.locations.split(' · ').join(', ')}</span>}
                </span>
                <span className="auth-demo-go">{busyId === a.id ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <ChevronRight size={20} />}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
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
      setError('Hyrja demo nuk funksionoi. Provo përsëri.')
      setDemoBusy(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Shkruaj email-in dhe fjalëkalimin.')
      return
    }
    setError('')
    setLoading(true)
    try {
      goHome(await login(form.email, form.password))
    } catch (err) {
      setError(err.response?.data?.error || 'Email-i ose fjalëkalimi nuk është i saktë.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <style>{AUTH_CSS}</style>
      <div className="container auth-grid">
        <div className="auth-main">
          <h1>Hyr</h1>
          <p className="auth-sub">Vazhdo aty ku e le në vizitën e fundit.</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-control" autoComplete="email"
                inputMode="email" placeholder="emri@shembull.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label className="form-label" htmlFor="password">Fjalëkalimi</label>
                <Link to="/forgot-password" style={{ fontSize: '.85rem', fontWeight: 600 }}>E harrove?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPass ? 'text' : 'password'} className="form-control"
                  autoComplete="current-password" style={{ paddingRight: 48 }}
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" className="icon-btn" onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                  style={{ position: 'absolute', right: 3, top: 3 }}>
                  {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Duke hyrë…' : 'Hyr'}
            </button>
          </form>

          <p className="auth-switch">
            S'ke llogari? <Link to="/register">Krijo një falas</Link>
          </p>
        </div>

        <DemoAccounts onPick={handleDemo} busyId={demoBusy} />
      </div>
    </div>
  )
}

export const AUTH_CSS = `
.auth-page { padding: clamp(28px, 6vw, 72px) 0 72px; }
.auth-grid { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 420px); gap: clamp(32px, 7vw, 96px); align-items: start; }
.auth-main h1 { font-size: clamp(2.4rem, 7vw, 3.4rem); line-height: 1; }
.auth-sub { margin: 10px 0 28px; }
.auth-switch { margin-top: 20px; font-size: .95rem; }
.auth-switch a { font-weight: 700; }

.auth-demo { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 22px 18px 12px; }
.auth-demo h2 { font-size: 1.15rem; padding: 0 4px; }
.auth-demo > p { font-size: .9rem; margin: 4px 4px 14px; }
.auth-demo ul { list-style: none; }
.auth-demo li + li { border-top: 1px solid var(--line); }
.auth-demo button {
  width: 100%; display: flex; align-items: center; gap: 14px;
  padding: 12px 6px; min-height: 64px;
  background: none; border: none; border-radius: 10px;
  font: inherit; color: var(--ink); text-align: left; cursor: pointer;
}
.auth-demo button:hover:not(:disabled) { background: var(--sunken); }
.auth-demo button:disabled:not([data-busy]) { opacity: .5; }
.auth-demo-mark { width: 40px; display: flex; justify-content: center; color: var(--ink); flex-shrink: 0; }
.auth-demo-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.auth-demo-text strong { font-weight: 720; }
.auth-demo-text span { font-size: .85rem; color: var(--ink-2); }
.auth-demo-text .auth-demo-loc { font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.auth-demo-go { color: var(--ink-2); display: flex; }

@media (max-width: 820px) {
  .auth-grid { grid-template-columns: 1fr; }
  .auth-demo { order: -1; }
}
`

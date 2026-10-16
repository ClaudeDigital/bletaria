import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../api'
import { AUTH_CSS } from './LoginPage'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Shkruaj email-in e llogarisë.'); return }
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Kërkesa nuk u dërgua. Provo përsëri.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <style>{AUTH_CSS}</style>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="auth-main">
          {sent ? (
            <>
              <h1>Shiko email-in</h1>
              <p className="auth-sub">Nëse {email} ka llogari, të dërguam një lidhje për fjalëkalim të ri. Lidhja vlen 1 orë.</p>
              <Link to="/login" className="btn btn-ghost btn-lg">Kthehu te hyrja</Link>
            </>
          ) : (
            <>
              <h1>Fjalëkalim i ri</h1>
              <p className="auth-sub">Shkruaj email-in e llogarisë dhe të dërgojmë një lidhje.</p>
              <form onSubmit={handleSubmit} noValidate>
                {error && <div className="alert alert-error" role="alert">{error}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" inputMode="email" className="form-control" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Duke dërguar…' : 'Dërgo lidhjen'}
                </button>
              </form>
              <p className="auth-switch"><Link to="/login">Kthehu te hyrja</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

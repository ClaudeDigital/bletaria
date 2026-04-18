import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'sent'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Shkruaj emailin tënd.'); return }
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setStep('sent')
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim. Provo sërish.')
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
        <div className="card">
          <div style={{ padding: '2rem 2rem 0', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{step === 'sent' ? '📬' : '🔑'}</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {step === 'sent' ? 'Email u dërgua!' : 'Fjalëkalimi i Harruar'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {step === 'sent'
                ? `Kontrol emailin ${email} për udhëzimet e rivendosjes.`
                : 'Shkruaj emailin tënd dhe do të dërgojmë instruksione.'
              }
            </p>
          </div>

          <div style={{ padding: '1.75rem 2rem 2rem' }}>
            {step === 'email' ? (
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-group">
                  <label className="form-label">📧 Email-i juaj</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@shembull.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? '⏳ Duke dërguar...' : '📨 Dërgo Email'}
                </button>
              </form>
            ) : (
              <div>
                <div className="alert alert-success">
                  ✅ Udhëzimet u dërguan! Kontrollo edhe dosjen Spam.
                </div>
                <button
                  onClick={() => setStep('email')}
                  className="btn btn-ghost w-full"
                  style={{ marginTop: '0.5rem' }}
                >
                  🔄 Dërgo sërish
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 600 }}>
                ← Kthehu tek Hyrja
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

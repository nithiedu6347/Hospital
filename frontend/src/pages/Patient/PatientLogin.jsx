import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postJson, saveSession } from '../../auth'
import './PatientLogin.css'

export default function PatientLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await postJson('/api/patient/login', { email, password })
      saveSession('patient', session)
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Log in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lg">
      <div className="auth-card">
        <aside className="auth-side">
          <div className="auth-logo">
            <img src="/Athmalogo.webp" alt="Athma Mind Care Hospital" />
          </div>
          <div>
            <h2>Good to see you again</h2>
            <p>Pick up right where you left off, at your own pace.</p>
          </div>
          <div className="auth-note">
            <div className="badge">
              <ShieldIcon />
            </div>
            <div>
              <strong>Private and confidential</strong>
              <span>Your details are only used for your care.</span>
            </div>
          </div>
        </aside>

        <section className="auth-main">
          <div className="auth-top">
            New here? <Link to="/register">Create account</Link>
          </div>
          <h1>Welcome back</h1>
          <p className="lead">Log in with your registered email and password.</p>

          <form noValidate onSubmit={onSubmit}>
            {error ? <p className="alert error">{error}</p> : null}
            <div className="grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <span className="icon-left">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap pw">
                  <span className="icon-left">
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Log in'}
              {loading ? null : <ArrowIcon />}
            </button>
          </form>

          <div className="or">or</div>
          <Link className="btn-ghost" to="/register">
            Create a new account
          </Link>
        </section>
      </div>
    </main>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <path d="M2 2 22 22" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postJson, saveSession } from '../../auth'
import './AdminLogin.css'

export default function AdminLogin() {
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
      const session = await postJson('/api/admin/login', { email, password })
      saveSession('admin', session)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-card">
        <div className="brand-row">
          <img src="/Athmalogo.webp" alt="Athma Mind Care Hospital" />
        </div>

        <div className="admin-badge">
          <span aria-hidden="true">✦</span> ADMIN
        </div>

        <h2>Welcome back</h2>
        <p className="lede">Sign in to manage your counselling platform.</p>

        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
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
            </span>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="sign-in" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="fine-print">Authorized personnel only</p>
      </section>
    </main>
  )
}

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <path d="M1 1l22 22" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

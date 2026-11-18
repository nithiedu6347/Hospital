import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postJson } from '../../auth'
import './Register.css'

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Enter your full name'
  if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (!form.full_address.trim()) errors.full_address = 'Enter your full address'
  if (!form.city.trim()) errors.city = 'Enter your city'
  if (!form.state.trim()) errors.state = 'Enter your state'
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Enter a 6-digit pincode'
  if (!form.location.trim()) errors.location = 'Enter your district or area'
  if (form.password.length < 6) errors.password = 'Use at least 6 characters'
  if (!form.confirm_password) errors.confirm_password = 'Confirm your password'
  else if (form.confirm_password !== form.password) errors.confirm_password = 'Passwords do not match'
  if (!form.consent_accepted) errors.consent_accepted = 'Please accept the declaration to continue'
  return errors
}

const empty = {
  full_name: '',
  age: '',
  gender: '',
  phone: '',
  email: '',
  full_address: '',
  city: '',
  state: '',
  pincode: '',
  location: '',
  marital_status: '',
  education: '',
  occupation: '',
  referred_by: '',
  password: '',
  confirm_password: '',
  consent_accepted: false,
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [serverField, setServerField] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(name, value) {
    setError('')
    setServerField('')
    setForm((current) => {
      const next = { ...current, [name]: value }
      setErrors((existing) => (Object.keys(existing).length ? validate(next) : existing))
      return next
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    try {
      await postJson('/api/patient/register', {
        ...form,
        age: form.age ? Number(form.age) : null,
        consent_accepted: form.consent_accepted,
      })
      navigate('/login')
    } catch (err) {
      const message = err.message || 'Registration failed'
      if (/phone/i.test(message)) {
        setError('The phone has already been taken.')
        setServerField('phone')
      } else if (/email/i.test(message)) {
        setError(message)
        setServerField('email')
      } else {
        setError(message)
        setServerField('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="rg">
      <div className="brand">
        <img src="/Athmalogo.webp" alt="Athma Mind Care Hospital" />
      </div>

      <section className="card">
        <div className="steps">
          <span className="step-label">STEP 1 OF 4</span>
          <div className="step-bar" aria-hidden="true">
            <span className="on" />
            <span />
            <span />
            <span />
          </div>
        </div>

        <h1>Let's get you registered</h1>
        <p className="lead">Takes about a minute. Matches you to the right care package.</p>

        {error ? <p className="alert">{error}</p> : null}

        <form noValidate onSubmit={onSubmit}>
          <div className="grid">
            <div className="grid g3">
              <Field label="Full name" required error={errors.full_name}>
                <input
                  value={form.full_name}
                  onChange={(event) => setField('full_name', event.target.value)}
                  placeholder="Full Name"
                  required
                />
              </Field>
              <Field label="Age">
                <input
                  value={form.age}
                  onChange={(event) => setField('age', event.target.value)}
                  placeholder="Age"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>

            <div className="grid g3">
              <Field label="Phone" required error={errors.phone} invalid={serverField === 'phone'}>
                <input
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  placeholder="Phone Number"
                  required
                />
              </Field>
              <Field label="Email" required className="span2" error={errors.email} invalid={serverField === 'email'}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="Email"
                  required
                />
              </Field>
            </div>

            <Field label="Full Address" required error={errors.full_address}>
              <textarea
                value={form.full_address}
                onChange={(event) => setField('full_address', event.target.value)}
                placeholder="House/Flat No., Street, Area, Landmark"
                required
              />
            </Field>

            <div className="grid g4">
              <Field label="City" required error={errors.city}>
                <input value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder="City" required />
              </Field>
              <Field label="State" required error={errors.state}>
                <input value={form.state} onChange={(event) => setField('state', event.target.value)} placeholder="State" required />
              </Field>
              <Field label="Pincode" required error={errors.pincode}>
                <input
                  value={form.pincode}
                  onChange={(event) => setField('pincode', event.target.value)}
                  placeholder="6-digit pincode"
                  required
                />
              </Field>
              <Field label="Location" required error={errors.location}>
                <input
                  value={form.location}
                  onChange={(event) => setField('location', event.target.value)}
                  placeholder="District/Area"
                  required
                />
              </Field>
            </div>
          </div>

          <div className="divider">About you</div>
          <div className="grid g4">
            <Field label="Marital status">
              <select value={form.marital_status} onChange={(event) => setField('marital_status', event.target.value)}>
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Education">
              <input
                value={form.education}
                onChange={(event) => setField('education', event.target.value)}
                placeholder="e.g. B.E, B.Sc, M.A"
              />
            </Field>
            <Field label="Occupation">
              <input
                value={form.occupation}
                onChange={(event) => setField('occupation', event.target.value)}
                placeholder="e.g. Engineer, Student"
              />
            </Field>
            <Field label="Referred By (optional)">
              <input
                value={form.referred_by}
                onChange={(event) => setField('referred_by', event.target.value)}
                placeholder="Doctor/Clinic/Person"
              />
            </Field>
          </div>

          <div className="divider">Account security</div>
          <div className="grid g2">
            <Field label="Password" required error={errors.password}>
              <span className="input-wrap pw">
                <span className="icon-left">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                <button type="button" className="eye" aria-label="Show password" onClick={() => setShowPassword((value) => !value)}>
                  <EyeIcon />
                </button>
              </span>
            </Field>
            <Field label="Confirm password" required error={errors.confirm_password}>
              <span className="input-wrap pw">
                <span className="icon-left">
                  <LockIcon />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(event) => setField('confirm_password', event.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
                <button
                  type="button"
                  className="eye"
                  aria-label="Show confirm password"
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  <EyeIcon />
                </button>
              </span>
            </Field>
          </div>

          <label className={errors.consent_accepted ? 'check err' : 'check'}>
            <input
              type="checkbox"
              checked={form.consent_accepted}
              onChange={(event) => setField('consent_accepted', event.target.checked)}
            />
            <span>
              I confirm that the information provided above is true and accurate to the best of my knowledge, and I
              consent to Athma Mind Care Hospital using it for my care.
            </span>
          </label>
          {errors.consent_accepted ? <p className="err-text">{errors.consent_accepted}</p> : null}

          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
              {loading ? null : <ArrowIcon />}
            </button>
            <p className="alt">
              Already have an account?
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </form>
      </section>

      <p className="foot">
        <ShieldIcon />
        Your details are shared only with your assigned doctor.
      </p>
    </main>
  )
}

function Field({ label, required, className = '', error, invalid = false, children }) {
  return (
    <div className={`field ${className} ${error || invalid ? 'err' : ''}`.trim()}>
      <label>
        {label} {required ? <em>*</em> : null}
      </label>
      {children}
      {error ? <p className="err-text">{error}</p> : null}
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getJson, readSession } from '../../auth'
import AdminPatients from './AdminPatients'
import AdminQuestions from './AdminQuestions'
import AdminReports from './AdminReports'

import './AdminHome.css'

const menu = [
  ['overview', 'Overview', OverviewIcon],
  ['patients', 'Patients', PatientsIcon],
  ['questions', 'Questions & Answers', QuestionsIcon],
  ['reports', 'Reports', ReportsIcon],
  ['activity', 'Activity', ActivityIcon],
]

export default function AdminHome() {
  const navigate = useNavigate()
  const session = readSession('admin')
  const [section, setSection] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!session?.token) {
      navigate('/', { replace: true })
      return
    }
    getJson('/api/admin/summary', session.token)
      .then(setSummary)
      .catch((err) => {
        if (err.status === 401) {
          clearSession('admin')
          navigate('/', { replace: true })
        } else {
          setError(err.message)
        }
      })
  }, [navigate, session?.token])

  function logout() {
    clearSession('admin')
    navigate('/', { replace: true })
  }

  const today = new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/ (\d{4})$/, ', $1')
  const name = summary?.full_name || 'Admin'
  const email = summary?.email || session?.email || ''
  const subtitles = {
    overview: 'Today at Athma Counselling',
    patients: 'Everyone registered on the platform',
    questions: 'How patients respond to each assessment question',
    reports: 'Download summaries for your team',
    activity: 'Recent events across the platform',
  }

  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <div className="ad-brand">
          <img src="/Athmalogo.webp" alt="Athma" />
        </div>
        <nav className="ad-nav" aria-label="Admin navigation">
          <div className="ad-nav-label">Menu</div>
          {menu.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={section === id ? 'ad-link active' : 'ad-link'}
              onClick={() => setSection(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div className="ad-user">
          <span className="ad-avatar">{name.slice(0, 1)}</span>
          <div className="ad-user-info">
            <div className="ad-user-name">{name}</div>
            <div className="ad-user-mail">{email}</div>
          </div>
          <button type="button" className="ad-logout" aria-label="Log out" onClick={logout}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-top">
          <div className="ad-heading">
            <h1 className="ad-h1">{menu.find(([id]) => id === section)?.[1]}</h1>
            <p className="ad-h1-sub">{subtitles[section]}</p>
          </div>
          <time className="ad-date">{today}</time>
        </header>

        {error ? <p className="ad-empty">{error}</p> : null}

        {section === 'overview' ? <Overview summary={summary} onViewAll={() => setSection('activity')} /> : null}

        {section === 'patients' && session?.token ? (
          <AdminPatients token={session.token} />
        ) : null}

        {section === 'questions' && session?.token ? (
          <AdminQuestions token={session.token} />
        ) : null}

        {section === 'activity' ? <ActivityPage items={summary?.activity || []} /> : null}

        {section === 'reports' && session?.token ? <AdminReports token={session.token} /> : null}
      </main>
    </div>
  )
}

function Overview({ summary, onViewAll }) {
  const completed = summary?.completed_this_week || 0
  const lastWeek = summary?.completed_last_week || 0
  const patients = summary?.patients || 0
  const joined = summary?.patients_this_month || 0
  const highRisk = summary?.high_risk || 0
  const days = summary?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({ label, count: 0 }))
  const peak = Math.max(0, ...days.map((day) => day.count))
  const top = peak > 4 ? peak : 4
  const levels = [top, Math.round(top * 0.75), Math.round(top * 0.5), Math.round(top * 0.25), 0]
  const risk = summary?.risk || { low: 0, moderate: 0, high: 0 }
  const riskTotal = risk.low + risk.moderate + risk.high
  const weekPct = lastWeek ? Math.round(((completed - lastWeek) / lastWeek) * 100) : null
  const weekChange = weekPct === null ? `+${completed}` : `${weekPct > 0 ? '+' : ''}${weekPct}%`

  return (
    <div className="ov">
      <section className="ov-panel ov-kpis">
        <article className="ov-kpi">
          <div className="ov-kpi-label">Assessments completed this week</div>
          <div className="ov-kpi-num">{completed.toLocaleString('en-IN')}</div>
          <div className="ov-kpi-foot">
            <span className="ov-up">{weekChange}</span> vs last week
          </div>
        </article>
        <article className="ov-kpi">
          <div className="ov-kpi-label">Registered patients</div>
          <div className="ov-kpi-num">{patients.toLocaleString('en-IN')}</div>
          <div className="ov-kpi-foot">
            <span className="ov-up">+{joined}</span> this month
          </div>
        </article>
        <article className="ov-kpi">
          <div className="ov-kpi-label">High-risk follow-ups</div>
          <div className="ov-kpi-num">{highRisk.toLocaleString('en-IN')}</div>
          <div className="ov-kpi-foot">BEIS-10 score 20 or below</div>
        </article>
      </section>

      <div className="ov-grid">
        <section className="ov-panel">
          <div className="ov-head">
            <h2>Assessments by day</h2>
            <span className="ov-note">This week</span>
          </div>
          <div className="ov-chart">
            <div className="ov-plot">
              {levels.map((level, index) => (
                <div key={`${level}-${index}`} className="ov-gl" style={{ top: `${((top - level) / top) * 100}%` }}>
                  <span>{level}</span>
                </div>
              ))}
              <div className="ov-bars">
                {days.map((day) => (
                  <div className="ov-col" key={day.label}>
                    <div
                      className={day.count > 0 && day.count === peak ? 'ov-bar peak' : 'ov-bar'}
                      style={{ height: `${(day.count / top) * 100}%` }}
                    >
                      <span className="ov-bar-val">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ov-days">
              {days.map((day) => (
                <span key={day.label}>{day.label}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="ov-panel">
          <div className="ov-head">
            <h2>Risk levels</h2>
            <span className="ov-note">BEIS-10</span>
          </div>
          <div className="ov-risk">
            <div className="ov-donut">
              <RiskDonut low={risk.low} moderate={risk.moderate} high={risk.high} />
              <div className="ov-donut-mid">
                <b>{riskTotal.toLocaleString('en-IN')}</b>
                <span>patients</span>
              </div>
            </div>
            <div className="ov-legend">
              <Legend color="#fdba74" name="Low" count={risk.low} total={riskTotal} />
              <Legend color="#f97316" name="Moderate" count={risk.moderate} total={riskTotal} />
              <Legend color="#9a3412" name="High" count={risk.high} total={riskTotal} />
            </div>
          </div>
        </section>
      </div>

      <ActivityList items={(summary?.activity || []).slice(0, 4)} onViewAll={onViewAll} />
    </div>
  )
}

function ActivityPage({ items }) {
  return (
    <section className="tl">
      {items.length === 0 ? (
        <p className="ad-empty">No activity yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={`${item.name}-${item.tag}-${item.action}-${item.when}`}>
              <span className={`tl-dot ${item.dot || 'blue'}`} />
              <div>
                <p>
                  <strong>{item.name}</strong> {item.action}
                </p>
                <small>{item.when}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ActivityList({ items, onViewAll }) {
  return (
    <section className="ov-panel">
      <div className="ov-head">
        <h2>Latest activity</h2>
        {onViewAll ? (
          <button type="button" className="ov-link" onClick={onViewAll}>
            View all
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="ad-empty">No completed assessments yet.</p>
      ) : (
        <ul className="ov-feed">
          {items.map((item) => (
            <li className="ov-item" key={`${item.name}-${item.when}-${item.action}`}>
              <span className="ov-avatar">{item.initials}</span>
              <div className="ov-text">
                <div>
                  <strong>{item.name}</strong> {item.action}
                </div>
                <div className="ov-when">{item.when}</div>
              </div>
              <span className={`ov-tag ${item.tone}`}>{item.tag}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RiskDonut({ low, moderate, high }) {
  const total = low + moderate + high
  const radius = 58
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const parts = [
    ['#fdba74', low],
    ['#f97316', moderate],
    ['#9a3412', high],
  ]
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" role="img" aria-label="Risk level distribution">
      <circle cx="74" cy="74" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
      {parts.map(([color, count]) => {
        if (!total || !count) return null
        const length = (count / total) * circumference
        const circle = (
          <circle
            key={color}
            cx="74"
            cy="74"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 74 74)"
          />
        )
        offset += length
        return circle
      })}
    </svg>
  )
}

function Legend({ color, name, count, total }) {
  const pct = total ? `${Math.round((count / total) * 100)}%` : '0%'
  return (
    <div className="ov-legend-row">
      <span className="ov-dot" style={{ background: color }} />
      <span className="ov-legend-name">{name}</span>
      <span className="ov-legend-count">{count}</span>
      <span className="ov-legend-pct">{pct}</span>
    </div>
  )
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function PatientsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.8c1.9.6 3.1 2.4 3.5 5.2" />
    </svg>
  )
}

function QuestionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.4A8.5 8.5 0 1 1 21 12z" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5" />
      <path d="M12 16.5h.01" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H9" />
      <path d="M10 12h9" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  )
}

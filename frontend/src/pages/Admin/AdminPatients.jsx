import { useEffect, useMemo, useState } from 'react'
import { getJson } from '../../auth'
import { printAssessmentReport } from './printReport'

export default function AdminPatients({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    getJson('/api/admin/patients', token)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [token])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    getJson(`/api/admin/patients/${selectedId}`, token)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }, [selectedId, token])

  const patients = data?.patients || []
  const shown = useMemo(() => {
    const text = query.trim().toLowerCase()
    return patients.filter((patient) => {
      if (filter === 'signed' && !patient.consent_accepted) return false
      if (filter === 'pending' && patient.consent_accepted) return false
      if (!text) return true
      return [patient.full_name, patient.phone, patient.email, patient.city]
        .join(' ')
        .toLowerCase()
        .includes(text)
    })
  }, [patients, query, filter])

  if (selectedId && detail) {
    return <PatientDetail patient={detail} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="pt">
      {error ? <p className="ad-empty">{error}</p> : null}
      <section className="pt-kpis">
        <article>
          <b>{data?.total ?? 0}</b>
          <span>Registered patients</span>
        </article>
        <article>
          <b>{data?.signed ?? 0}</b>
          <span>Declaration signed</span>
        </article>
        <article>
          <b>{data?.joined_week ?? 0}</b>
          <span>Joined in the last 7 days</span>
        </article>
      </section>

      <div className="pt-tools">
        <label className="pt-search">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, email or city"
          />
        </label>
        <div className="pt-filters">
          {[
            ['all', 'All'],
            ['signed', 'Declaration signed'],
            ['pending', 'Declaration pending'],
          ].map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className="pt-count">
          {shown.length} of {patients.length} patients
        </span>
      </div>

      <section className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Registered</th>
              <th>Declaration</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan="6" className="pt-none">
                  No patients match this search.
                </td>
              </tr>
            ) : (
              shown.map((patient) => (
                <tr key={patient.id} onClick={() => setSelectedId(patient.id)}>
                  <td>
                    <div className="pt-person">
                      <div className="pt-avatar">{initials(patient.full_name)}</div>
                      <span>
                        <strong>{patient.full_name}</strong>
                        <small>
                          {patient.age ? `${patient.age} yrs` : 'Age NA'}
                          {patient.gender ? `, ${patient.gender}` : ''}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="pt-stack">
                      <span>{patient.phone}</span>
                      <small>{patient.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className="pt-stack">
                      <span>{patient.city || 'NA'}</span>
                      <small>{patient.state || 'NA'}</small>
                    </div>
                  </td>
                  <td>{formatDate(patient.created)}</td>
                  <td>
                    <span className={patient.consent_accepted ? 'pt-sign on' : 'pt-sign'}>
                      {patient.consent_accepted ? 'Signed' : 'Pending'}
                    </span>
                  </td>
                  <td className="pt-go">›</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function PatientDetail({ patient, onBack }) {
  const assessments = patient.assessments || []
  const [picked, setPicked] = useState(() => defaultQuiz(assessments))
  const [show, setShow] = useState('all')
  const [tamil, setTamil] = useState(false)
  const quiz = assessments[picked]
  const summary = assessmentSummary(quiz)
  const attended = new Set(assessments.map((item) => item.code)).size
  const questions = (quiz?.questions || []).filter((question) => {
    if (show === 'answered') return Boolean(question.answer)
    if (show === 'open') return !question.answer
    return true
  })
  const percent = quiz?.question_count ? Math.round((quiz.answered / quiz.question_count) * 100) : 0

  return (
    <div className="pt">
      <button className="pt-back" type="button" onClick={onBack}>
        ‹ All patients
      </button>
      <section className="pt-hero">
        <div className="pt-avatar lg">{initials(patient.full_name)}</div>
        <div className="pt-hero-main">
          <h2>{patient.full_name}</h2>
          <div className="pt-chips">
            <span>Patient ID {patient.id}</span>
            {patient.age ? <span>{patient.age} yrs</span> : null}
            {patient.gender ? <span>{patient.gender}</span> : null}
            {patient.city ? <span>{patient.city}</span> : null}
            <span className={patient.consent_accepted ? 'ok' : ''}>
              {patient.consent_accepted ? 'Declaration signed' : 'Declaration pending'}
            </span>
            <span className={patient.is_active ? 'ok' : ''}>{patient.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div className="pt-actions">
          <a className="pt-btn solid" href={`tel:${patient.phone}`}>
            <MiniIcon name="phone" /> Call
          </a>
          <a className="pt-btn" href={`mailto:${patient.email}`}>
            <MiniIcon name="mail" /> Email
          </a>
        </div>
      </section>

      <div className="pt-detail-grid">
        <section className="pt-card">
          <h3>Contact</h3>
          <p>
            <small>Phone</small>
            {patient.phone}
          </p>
          <p>
            <small>Email</small>
            {patient.email}
          </p>
          <h3>Background</h3>
          <p>
            <small>Marital status</small>
            {patient.marital_status || 'NA'}
          </p>
          <p>
            <small>Education</small>
            {patient.education || 'NA'}
          </p>
          <p>
            <small>Occupation</small>
            {patient.occupation || 'NA'}
          </p>
          <h3>Address</h3>
          <p>
            <small>Full address</small>
            {[patient.full_address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ') || 'NA'}
          </p>
          <h3>Registration</h3>
          <p>
            <small>Registered on</small>
            {formatDate(patient.created)}
          </p>
          <p>
            <small>Referred by</small>
            {patient.referred_by || 'NA'}
          </p>
        </section>

        <div className="pt-main">
          {summary ? <ScoreSummary quiz={quiz} summary={summary} /> : null}
          <section className="pt-card pt-answers">
            {quiz ? (
              <>
                <h3>{quiz.title}</h3>
                <div className="pt-stats">
                  <span className="ok">
                    <i><MiniIcon name="check" /></i>
                    <b>{quiz.answered}</b>
                    <small>Answered</small>
                  </span>
                  <span>
                    <i><MiniIcon name="minus" /></i>
                    <b>{quiz.question_count - quiz.answered}</b>
                    <small>Not attended</small>
                  </span>
                  <span className="all">
                    <i><MiniIcon name="list" /></i>
                    <b>{quiz.question_count}</b>
                    <small>Questions</small>
                  </span>
                </div>
                <div className="pt-answer-tools">
                  <div className="pt-filters">
                    {[
                      ['all', 'All'],
                      ['answered', 'Answered'],
                      ['open', 'Not attended'],
                    ].map(([id, label]) => (
                      <button key={id} type="button" className={show === id ? 'on' : ''} onClick={() => setShow(id)}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-lang">
                    <button type="button" className={!tamil ? 'on' : ''} onClick={() => setTamil(false)}>
                      English
                    </button>
                    <button type="button" className={tamil ? 'on' : ''} onClick={() => setTamil(true)}>
                      தமிழ்
                    </button>
                  </div>
                </div>
                <ol className="pt-qlist">
                  {questions.map((question) => (
                    <li key={question.number}>
                      <span>{question.number}</span>
                      <div>
                        <p>{tamil ? question.prompt_ta : question.prompt}</p>
                        {question.answer ? (
                          <em className="pt-choice">
                            <MiniIcon name="check" />
                            <span>{question.answer}</span>
                            {shownScore(quiz, question) != null ? <b>Score {shownScore(quiz, question)}</b> : null}
                          </em>
                        ) : (
                          <small>Not answered</small>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="pt-quiet">No assessment to show</p>
            )}
          </section>
        </div>

        <section className="pt-card">
          <div className="pt-card-head">
            <h3>Assessments</h3>
            <button
              className="pt-btn solid"
              type="button"
              disabled={!quiz}
              onClick={() => quiz && printAssessmentReport(patient, quiz)}
            >
              Report
            </button>
          </div>
          <p className="pt-quiet">{attended} quizzes attended</p>
          {assessments.length ? (
            <ul className="pt-attempts">
              {assessments.map((item, index) => {
                const itemPercent = item.question_count ? Math.round((item.answered / item.question_count) * 100) : 0
                return (
                  <li key={`${item.code}-${item.created}`}>
                    <button type="button" className={index === picked ? 'on' : ''} onClick={() => setPicked(index)}>
                      <Ring percent={index === picked ? percent : itemPercent} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.answered} of {item.question_count} answered
                        </small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <>
              <h3>No assessments yet</h3>
              <p className="pt-quiet">This patient has not attended any quizzes yet.</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

const BEIS_SCALES = [
  { name: 'Appraisal of Own Emotions', icon: 'user', numbers: [1, 2] },
  { name: "Appraisal of Others' Emotions", icon: 'users', numbers: [3, 4] },
  { name: 'Regulation of Own Emotions', icon: 'sliders', numbers: [5, 6] },
  { name: "Regulation of Others' Emotions", icon: 'sliders', numbers: [7, 8] },
  { name: 'Utilisation of Emotions', icon: 'bolt', numbers: [9, 10] },
]

const LEVELS = {
  low: { label: 'Low', icon: 'down' },
  normal: { label: 'Normal', icon: 'check' },
  high: { label: 'High', icon: 'up' },
}

function defaultQuiz(assessments) {
  const scored = assessments.findIndex((item) => assessmentSummary(item))
  return scored >= 0 ? scored : 0
}

function levelFor(score, count) {
  const midpoint = count * 3
  if (score > midpoint) return 'high'
  if (score < midpoint) return 'low'
  return 'normal'
}

function beisSummary(quiz) {
  if (!quiz || quiz.code !== 'beis-10' || quiz.questions.length < 10) return null
  if (quiz.questions.some((question) => question.score == null)) return null
  const byNumber = new Map(quiz.questions.map((question) => [question.number, Number(question.score)]))
  const scales = BEIS_SCALES.map((scale) => {
    const score = scale.numbers.reduce((sum, number) => sum + byNumber.get(number), 0)
    return { ...scale, score, level: levelFor(score, scale.numbers.length) }
  })
  const total = scales.reduce((sum, scale) => sum + scale.score, 0)
  return { total, level: levelFor(total, 10), scales }
}

const MHI_SCALES = [
  { name: 'Anxiety', icon: 'pulse', numbers: [3, 11, 13, 15, 25, 29, 32, 33, 35], min: 9, max: 54 },
  { name: 'Depression', icon: 'cloud', numbers: [9, 19, 30, 36], min: 4, max: 23 },
  { name: 'Loss of Behavioural Emotional Control', icon: 'wave', numbers: [8, 14, 16, 18, 20, 21, 24, 27, 28], min: 9, max: 53 },
  { name: 'General Positive Affect', icon: 'smile', numbers: [4, 5, 6, 7, 12, 17, 26, 31, 34, 37], min: 10, max: 60 },
  { name: 'Emotional Ties', icon: 'link', numbers: [10, 23], min: 2, max: 12 },
  { name: 'Life Satisfaction', icon: 'smile', numbers: [1], min: 1, max: 6 },
]

const MHI_FIVE_POINT = new Set([9, 28])
const MHI_ALREADY_HIGH = new Set([8, 14, 18])

function mhiItemScore(number, raw) {
  if (MHI_ALREADY_HIGH.has(number)) return raw
  const points = MHI_FIVE_POINT.has(number) ? 5 : 6
  return points + 1 - raw
}

function bandInRange(score, min, max) {
  const span = max - min
  if (span <= 0) return 'normal'
  const ratio = (score - min) / span
  if (ratio < 1 / 3) return 'low'
  if (ratio < 2 / 3) return 'normal'
  return 'high'
}

function mhiSummary(quiz) {
  if (!quiz || quiz.code !== 'mhi-38' || !quiz.questions?.length) return null
  const byNumber = new Map(quiz.questions.map((question) => [question.number, question.score]))
  const needed = MHI_SCALES.flatMap((scale) => scale.numbers)
  if (needed.some((number) => byNumber.get(number) == null)) return null
  const scales = MHI_SCALES.map((scale) => {
    const score = scale.numbers.reduce((sum, number) => sum + mhiItemScore(number, Number(byNumber.get(number))), 0)
    return { ...scale, score, level: bandInRange(score, scale.min, scale.max) }
  })
  return { scales }
}

const GDS_POINT = ['No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No', 'Yes', 'Yes']

function gdsSummary(quiz) {
  if (!quiz || quiz.code !== 'gds-15' || quiz.questions.length < 15) return null
  if (quiz.questions.some((question) => !question.answer)) return null
  const total = quiz.questions.reduce((sum, question) => sum + gdsItemScore(question), 0)
  const suggests = total > 5
  return {
    total,
    level: suggests ? 'high' : 'normal',
    label: suggests ? 'Suggests Depression' : 'Normal',
    icon: suggests ? 'warn' : 'check',
    scales: [],
  }
}

function gdsItemScore(question) {
  const point = GDS_POINT[question.number - 1]
  if (!point || !question.answer) return 0
  return String(question.answer).toLowerCase() === point.toLowerCase() ? 0 : 1
}

function shownScore(quiz, question) {
  if (quiz?.code === 'gds-15') return question.answer ? gdsItemScore(question) : null
  return question.score
}

function assessmentSummary(quiz) {
  return beisSummary(quiz) || mhiSummary(quiz) || gdsSummary(quiz)
}

function ScoreSummary({ quiz, summary }) {
  const scales = summary.scales || []
  const counts = { low: 0, normal: 0, high: 0 }
  scales.forEach((scale) => {
    counts[scale.level] += 1
  })
  return (
    <section className="sm-card">
      <div className="sm-body">
        <div className="sm-head">
          <div className="sm-title-wrap">
            <span className="sm-tile">
              <MiniIcon name="clipboard" />
            </span>
            <div>
              <h3>Score Summary</h3>
              <p>{quiz.title}</p>
            </div>
          </div>
          {summary.total != null ? (
            <div className="sm-total">
              <span className="sm-total-ico">
                <MiniIcon name="target" />
              </span>
              <div>
                <small>Total score</small>
                <b>{summary.total}</b>
              </div>
              <LevelBadge level={summary.level} text={summary.label} icon={summary.icon} />
            </div>
          ) : null}
        </div>
        {scales.length ? (
        <div className="sm-counts">
          <span>Sub-scales</span>
          {['low', 'normal', 'high'].map((key) =>
            counts[key] ? <LevelBadge key={key} level={key} text={`${counts[key]} ${LEVELS[key].label}`} /> : null,
          )}
        </div>
        ) : null}
        {scales.length ? (
        <div className="sm-grid">
          {scales.map((scale) => (
            <article key={scale.name} className={`sm-item ${scale.level}`}>
              <div className="sm-item-top">
                <span>
                  <MiniIcon name={scale.icon} />
                </span>
                <strong>{scale.name}</strong>
              </div>
              <div className="sm-mid">
                <b>{scale.score}</b>
                <LevelBadge level={scale.level} />
              </div>
              <div className="sm-seg" aria-hidden="true">
                {['low', 'normal', 'high'].map((key) => (
                  <i key={key} className={key === scale.level ? 'on' : ''} />
                ))}
              </div>
              <div className="sm-seg-labels" aria-hidden="true">
                {['low', 'normal', 'high'].map((key) => (
                  <span key={key} className={key === scale.level ? 'on' : ''}>
                    {LEVELS[key].label}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        ) : null}
      </div>
    </section>
  )
}

function LevelBadge({ level, text, icon }) {
  const item = LEVELS[level]
  return (
    <em className={`sm-badge ${level}`}>
      <MiniIcon name={icon || item.icon} />
      {text || item.label}
    </em>
  )
}

function MiniIcon({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (name === 'phone') {
    return (
      <svg {...common}>
        <path d="M6 4h3l2 4-2 1a12 12 0 0 0 6 6l1-2 4 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 2-2z" />
      </svg>
    )
  }
  if (name === 'mail') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    )
  }
  if (name === 'clipboard') {
    return (
      <svg {...common}>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4.5h6v2H9zM8 11h8M8 15h5" />
      </svg>
    )
  }
  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3 3.8-4.5 7-4.5S17.5 16 19 19" />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c1.2-2.6 3-4 6-4" />
        <circle cx="16" cy="9" r="2.4" />
        <path d="M14 19c.6-2 2-3.2 4-3.5 1.2.2 2.2.8 3 1.8" />
      </svg>
    )
  }
  if (name === 'sliders') {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 17h16M8 7v4M16 13v4" />
      </svg>
    )
  }
  if (name === 'bolt') {
    return (
      <svg {...common}>
        <path d="M13 3 5 14h7l-1 7 8-11h-7l1-7z" />
      </svg>
    )
  }
  if (name === 'down') {
    return (
      <svg {...common}>
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    )
  }
  if (name === 'up') {
    return (
      <svg {...common}>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    )
  }
  if (name === 'warn') {
    return (
      <svg {...common}>
        <path d="M12 4 3 20h18L12 4z" />
        <path d="M12 10v4M12 17h.01" />
      </svg>
    )
  }
  if (name === 'list') {
    return (
      <svg {...common}>
        <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    )
  }
  if (name === 'minus') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8" />
      </svg>
    )
  }
  if (name === 'pulse') {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    )
  }
  if (name === 'cloud') {
    return (
      <svg {...common}>
        <path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.5-1.5A3.5 3.5 0 0 0 7 18z" />
      </svg>
    )
  }
  if (name === 'wave') {
    return (
      <svg {...common}>
        <path d="M3 16l4-8 4 8 4-8 4 8" />
      </svg>
    )
  }
  if (name === 'smile') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 13c1 2 2.2 3 4 3s3-1 4-3M9 10h.01M15 10h.01" />
      </svg>
    )
  }
  if (name === 'link') {
    return (
      <svg {...common}>
        <path d="M9 12a4 4 0 0 1 4-4h2M15 12a4 4 0 0 1-4 4H9" />
        <path d="M8 12h8" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  )
}

function Ring({ percent }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const filled = (percent / 100) * circumference
  return (
    <span className="pt-ring" aria-hidden="true">
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#ffedd5" strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="#ea580c"
          strokeWidth="4"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform="rotate(-90 21 21)"
        />
      </svg>
      <b>{percent}%</b>
    </span>
  )
}

function initials(fullName) {
  const parts = (fullName || '').split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatDate(value) {
  if (!value) return 'NA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'NA'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

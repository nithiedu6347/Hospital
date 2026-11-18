import { useEffect, useMemo, useState } from 'react'
import { getJson } from '../../auth'

export default function AdminQuestions({ token }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [code, setCode] = useState(null)

  useEffect(() => {
    getJson('/api/admin/quizzes', token)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [token])

  const quizzes = useMemo(() => {
    const active = data?.quizzes || []
    const inactive = data?.inactive || []
    const source = filter === 'inactive' ? inactive : filter === 'active' ? active : [...active, ...inactive]
    const text = query.trim().toLowerCase()
    return source.filter((quiz) => {
      if (!text) return true
      return `${quiz.title} ${quiz.category}`.toLowerCase().includes(text)
    })
  }, [data, filter, query])

  if (code) {
    return <QuizDetail token={token} code={code} onBack={() => setCode(null)} />
  }

  const totalShown = (data?.quizzes?.length || 0) + (data?.inactive?.length || 0)
  return (
    <div className="qq">
      {error ? <p className="ad-empty">{error}</p> : null}
      <section className="pt-kpis">
        <article>
          <b>{data?.quiz_count ?? 0}</b>
          <span>Quizzes</span>
        </article>
        <article>
          <b>{data?.question_count ?? 0}</b>
          <span>Total questions</span>
        </article>
        <article>
          <b>{data?.active_count ?? 0}</b>
          <span>Active quizzes</span>
        </article>
      </section>
      <div className="pt-tools">
        <label className="pt-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or category" />
        </label>
        <div className="pt-filters">
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
          ].map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <span className="pt-count">
          {quizzes.length} of {filter === 'all' ? totalShown : filter === 'active' ? data?.quiz_count || 0 : data?.inactive?.length || 0} quizzes
        </span>
      </div>
      <div className="qq-grid">
        {quizzes.map((quiz) => (
          <button className="qq-card" type="button" key={quiz.code} onClick={() => setCode(quiz.code)}>
            <div className="qq-card-top">
              <span className="qq-icon">☰</span>
              <span className="qq-cat">{quiz.category}</span>
            </div>
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <div className="qq-foot">
              <span>{quiz.question_count} questions</span>
              <span className="qq-start">Start ›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuizDetail({ token, code, onBack }) {
  const [quiz, setQuiz] = useState(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [report, setReport] = useState(null)
  const [notice, setNotice] = useState('')
  const [tamil, setTamil] = useState(false)

  useEffect(() => {
    setQuiz(null)
    getJson(`/api/admin/quizzes/${code}`, token)
      .then(setQuiz)
      .catch((err) => setError(err.message))
  }, [code, token])

  async function load(value, patientId) {
    const query = (value ?? name).trim()
    setNotice('')
    setReport(null)
    if (!query && !patientId) {
      setNotice('Enter a patient name.')
      return
    }
    const search = patientId
      ? `patient_id=${patientId}`
      : `name=${encodeURIComponent(query)}`
    try {
      const result = await getJson(`/api/admin/quizzes/${code}/answers?${search}`, token)
      setReport(result)
      if (!result.matches?.length) setNotice('No answers found for this patient.')
      else if (result.matches.length > 1) setNotice('More than one patient matches. Choose a name.')
      else if (!result.found) setNotice('No answers found for this patient.')
    } catch (err) {
      setNotice(err.message)
    }
  }

  if (!quiz) {
    return error ? <p className="ad-empty">{error}</p> : null
  }

  return (
    <div className="qq-detail">
      <button className="pt-back" type="button" onClick={onBack}>
        ‹ All quizzes
      </button>
      <span className="qq-cat">{quiz.category}</span>
      <h2>{quiz.title}</h2>
      <p className="qq-meta">
        {quiz.question_count} questions, added {formatDate(quiz.created)}
      </p>
      <div className="qq-layout">
        <aside className="qq-side">
          <h3>About this quiz</h3>
          <small>Description</small>
          <p>{quiz.description}</p>
          <h3>Details</h3>
          <small>Category</small>
          <p>{quiz.category}</p>
          <small>Status</small>
          <p className="qq-active">{quiz.active ? 'Active' : 'Inactive'}</p>
          <small>Questions</small>
          <p>{quiz.question_count}</p>
          <small>Added on</small>
          <p>{formatDate(quiz.created)}</p>
          <h3>Patient Report</h3>
          <p className="qq-help">Enter a patient name to view the saved answers.</p>
          <form
            className="qq-load"
            onSubmit={(event) => {
              event.preventDefault()
              load()
            }}
          >
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Patient name" />
            <button type="submit">Load</button>
          </form>
          {notice ? <p className="qq-miss">{notice}</p> : null}
          {report?.matches?.length > 1 ? (
            <div className="qq-matches">
              {report.matches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => {
                    setName(match.full_name)
                    load(match.full_name, match.id)
                  }}
                >
                  {match.full_name}
                </button>
              ))}
            </div>
          ) : null}
          {report?.found ? (
            <p className="qq-found">
              {report.patient.full_name}
              {report.status === 'submitted' ? ' · Submitted' : ' · In progress'}
              {report.total_score != null ? ` · Score ${report.total_score}` : ''}
            </p>
          ) : null}
        </aside>
        <div className="qq-questions">
          <div className="qq-lang">
            <button type="button" className={!tamil ? 'on' : ''} onClick={() => setTamil(false)}>
              English
            </button>
            <button type="button" className={tamil ? 'on' : ''} onClick={() => setTamil(true)}>
              தமிழ்
            </button>
          </div>
          {quiz.questions.map((question) => (
            <article className="qq-q" key={question.id}>
              <span className="qq-num">{question.number}</span>
              <h3>{tamil ? question.prompt_ta : question.prompt}</h3>
              <small>Likert</small>
              <div className="qq-options">
                {question.options.map((option) => {
                  const selected = report?.answers?.[String(question.id)] === option.id
                  return (
                    <span className={selected ? 'on' : ''} key={option.id}>
                      {option.number} {option.label}
                    </span>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
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

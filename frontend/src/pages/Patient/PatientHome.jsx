import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearSession, getJson, readSession } from '../../auth'
import './PatientHome.css'

export default function PatientHome() {
  const navigate = useNavigate()
  const session = readSession('patient')
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    if (!session?.token) {
      navigate('/login', { replace: true })
      return
    }
    getJson('/api/patient/quiz/assessments', session.token)
      .then(setQuizzes)
      .catch((err) => {
        if (err.status === 401) {
          clearSession('patient')
          navigate('/login', { replace: true })
          return
        }
        setError(err.message)
      })
  }, [navigate, session?.token])

  useEffect(() => {
    if (!confirmLogout) return
    function onKey(event) {
      if (event.key === 'Escape') setConfirmLogout(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmLogout])

  function logout() {
    clearSession('patient')
    navigate('/login', { replace: true })
  }

  return (
    <main className="q-page">
      <div className="q-wrap">
        <div className="q-header-row">
          <header className="q-head">
            <span className="q-eyebrow">Assessments</span>
            <h1 className="q-title">
              Take a <span>Quiz</span>
            </h1>
            <p className="q-sub">Choose an assessment below to begin. It only takes a few minutes.</p>
          </header>
          <button className="q-logout-btn" type="button" onClick={() => setConfirmLogout(true)}>
            <LogoutIcon />
            Log out
          </button>
        </div>

        {error ? (
          <div className="q-state">
            <p className="q-error">{error}</p>
          </div>
        ) : (
          <div className="q-grid">
            {quizzes.map((quiz) => (
              <Link className="q-card" key={quiz.code} to={`/questions/${quiz.code}`}>
                <div className="q-top">
                  <div className="q-icon">
                    <CardIcon />
                  </div>
                  <span className="q-cat">{quiz.category}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p className="q-desc">{quiz.description}</p>
                <div className="q-foot">
                  <span className="q-count">
                    <CountIcon />
                    {quiz.question_count} questions
                  </span>
                  <span className="q-start">
                    Start
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {confirmLogout ? (
        <div className="q-modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div
            className="q-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="q-modal-icon">
              <LogoutIcon />
            </div>
            <h2 id="logout-title">Log out?</h2>
            <p>Are you sure you want to log out of your account? You will need to log back in to access your quizzes.</p>
            <div className="q-modal-actions">
              <button className="q-modal-btn cancel" type="button" onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
              <button className="q-modal-btn danger" type="button" onClick={logout}>
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function CountIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

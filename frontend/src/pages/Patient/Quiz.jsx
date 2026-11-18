import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clearSession, getJson, postJson, readSession } from '../../auth'
import './Quiz.css'

export default function Quiz() {
  const { code } = useParams()
  const navigate = useNavigate()
  const session = readSession('patient')
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [savedIds, setSavedIds] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [openBlock, setOpenBlock] = useState(0)

  useEffect(() => {
    if (!session?.token) {
      navigate('/login', { replace: true })
      return
    }
    setQuiz(null)
    setOpenBlock(0)
    getJson(`/api/patient/quiz/${code}`, session.token)
      .then((data) => {
        const stored = {}
        const saved = {}
        Object.entries(data.answers || {}).forEach(([questionId, optionId]) => {
          stored[String(questionId)] = Number(optionId)
          saved[String(questionId)] = true
        })
        setQuiz(data)
        setAnswers(stored)
        setSavedIds(saved)
      })
      .catch((err) => {
        if (err.status === 401) {
          clearSession('patient')
          navigate('/login', { replace: true })
          return
        }
        setError(err.message)
      })
  }, [code, navigate, session?.token])

  const submitted = quiz?.status === 'submitted'
  const total = quiz?.questions.length || 0
  const answered = quiz ? quiz.questions.filter((question) => answers[String(question.id)]).length : 0
  const progress = total ? Math.round((answered / total) * 100) : 0

  async function choose(question, option) {
    if (!session?.token) return
    const key = String(question.id)
    const previous = answers[key]
    setAnswers((current) => ({ ...current, [key]: Number(option.id) }))
    setSavedIds((current) => ({ ...current, [key]: false }))
    setSavingId(question.id)
    setNotice('')
    try {
      const result = await postJson(
        `/api/patient/quiz/${code}/answers`,
        { question_id: question.id, option_id: option.id },
        session.token,
      )
      setSavedIds((current) => ({ ...current, [key]: true }))
      if (result.total_score != null) {
        setQuiz((current) => ({ ...current, total_score: result.total_score }))
      }
    } catch (err) {
      setAnswers((current) => ({ ...current, [key]: previous }))
      setNotice(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function submit() {
    if (!session?.token || submitted) return
    setSubmitting(true)
    setNotice('')
    try {
      const result = await postJson(`/api/patient/quiz/${code}/submit`, {}, session.token)
      setQuiz((current) => ({ ...current, status: 'submitted', total_score: result.total_score }))
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="ap-page">
      <header className="ap-header">
        <Link className="ap-back" to="/questions">
          <BackIcon />
          <span>Back to Categories</span>
        </Link>
        <div className="ap-head-right">
          <span className="ap-head-title">{quiz?.title || 'Assessment'}</span>
          <span className="ap-head-pill">{quiz?.answer_kind === 'yes-no' ? 'Yes/No' : 'Multiple choice'}</span>
        </div>
      </header>

      <div className="ap-body">
        <aside className="ap-left">
          <h3 className="ap-section-label">Assessment Info</h3>
          <div className="ap-info">
            <div className="ap-info-icon">
              <InfoIcon />
            </div>
            <h2>{quiz?.title || 'Assessment'}</h2>
            <p className="ap-info-sub">{quiz?.description}</p>
            <div className="ap-instr">
              <CheckIcon />
              <span>
                {quiz?.answer_kind === 'yes-no'
                  ? 'Please answer each question with Yes or No based on your experience.'
                  : 'Please choose the option that best matches your experience.'}
              </span>
            </div>
            <div className="ap-info-chips">
              <span className="ap-info-chip">
                <ListIcon />
                {total || 0} Questions
              </span>
              <span className="ap-info-chip">
                <ClockIcon />
                {quiz?.duration_label || ''}
              </span>
            </div>
          </div>

          <div className="ap-overall">
            <div className="ap-stat-row">
              <span>Overall progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="ap-bar">
              <div className="ap-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="ap-stats">
              <div className="ap-stat-row">
                <span>Answered</span>
                <strong>
                  {answered} / {total || 0}
                </strong>
              </div>
              <div className="ap-stat-row">
                <span>Remaining</span>
                <span className="ap-red">{Math.max((total || 0) - answered, 0)}</span>
              </div>
            </div>
          </div>

          {quiz?.next_title ? (
            quiz.next_code ? (
              <Link className="ap-next" to={`/questions/${quiz.next_code}`}>
                <small>UP NEXT</small>
                <span>{quiz.next_title}</span>
              </Link>
            ) : (
              <div className="ap-next">
                <small>UP NEXT</small>
                <span>{quiz.next_title}</span>
              </div>
            )
          ) : null}

          <div className="ap-autosave">
            <CheckIcon />
            Answers are saved automatically
          </div>
          <div className="ap-mascot">
            <p>Take your time, we're here with you</p>
          </div>
        </aside>

        <section className="ap-center">
          <div className="ap-center-inner">
            {error ? <div className="ap-state"><p className="ap-error">{error}</p></div> : null}
            {quiz?.questions.map((question) => {
              const key = String(question.id)
              const selected = answers[key]
              return (
                <article className={selected ? 'ap-q answered' : 'ap-q'} key={question.id} id={`q-${question.number}`}>
                  <div className="ap-qnum">{question.number}</div>
                  {savingId === question.id ? <span className="ap-badge ap-badge-saving">Saving</span> : null}
                  {savingId !== question.id && savedIds[key] ? (
                    <span className="ap-badge ap-badge-saved">
                      <CheckIcon /> Saved
                    </span>
                  ) : null}
                  <p className="ap-q-en">{question.prompt}</p>
                  <p className="ap-q-ta">{question.prompt_ta}</p>
                  <div className={`ap-options ${optionLayout(question.options)}`}>
                    {question.options.map((option) => (
                      <label className={`ap-opt${selected === Number(option.id) ? ' selected' : ''}`} key={option.id}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selected === Number(option.id)}
                          onChange={() => choose(question, option)}
                        />
                        <span className="ap-opt-pill">{optionText(option.label)}</span>
                      </label>
                    ))}
                  </div>
                </article>
              )
            })}

            {quiz ? (
              <div className="ap-footer">
                {notice ? <p className="ap-hint">{notice}</p> : null}
                {submitted ? (
                  <p className="ap-hint">
                    Your answers are submitted. You can still change them. Total score {quiz.code === 'gds-15' ? quiz.max_score - quiz.total_score : quiz.total_score} / {quiz.max_score}.
                    {quiz.code === 'gds-15'
                      ? quiz.max_score - quiz.total_score > 5
                        ? ' A score greater than 5 suggests depression.'
                        : ' A score of 0 to 5 is normal.'
                      : ''}
                  </p>
                ) : null}
                <button className="ap-btn primary" type="button" disabled={submitted || submitting || answered < total} onClick={submit}>
                  {submitted ? 'Submitted' : submitting ? 'Please wait...' : 'Submit answers'}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="ap-right">
          <h3 className="ap-section-label">Question Blocks</h3>
          <div className="ap-blocks">
            {(quiz?.blocks || []).map((block, index) => {
              const inBlock = quiz.questions.filter(
                (question) => question.number >= block.start && question.number <= block.end && answers[String(question.id)],
              ).length
              const open = openBlock === index
              return (
                <div className="ap-block-wrap" key={block.label}>
                  <button
                    className={`ap-block${open ? ' open' : ' closed'}${inBlock === block.count ? ' done' : ''}`}
                    type="button"
                    onClick={() => setOpenBlock(open ? -1 : index)}
                  >
                    <span className="ap-block-num">{inBlock === block.count ? '✓' : index + 1}</span>
                    <span className="ap-block-main">
                      <strong>{block.label}</strong>
                      <span>{block.count} questions</span>
                    </span>
                    <span className="ap-block-count">
                      {inBlock}/{block.count}
                    </span>
                    <ChevronIcon open={open} />
                  </button>
                  {open ? (
                    <div className="ap-block-items">
                      {quiz.questions
                        .filter((question) => question.number >= block.start && question.number <= block.end)
                        .map((question) => (
                          <a
                            className={answers[String(question.id)] ? 'ap-block-item done' : 'ap-block-item'}
                            href={`#q-${question.number}`}
                            key={question.id}
                          >
                            {question.number}
                          </a>
                        ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </main>
  )
}

function optionText(label) {
  if (label === 'Yes') return 'Yes  ஆம்'
  if (label === 'No') return 'No  இல்லை'
  return label
}

function optionLayout(options) {
  if (options.some((option) => option.label.length > 28)) return 'stack'
  if (options.length === 6) return 'grid'
  return 'wrap'
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg className={open ? 'ap-chevron open' : 'ap-chevron'} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  )
}

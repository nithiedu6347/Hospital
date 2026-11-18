import { useEffect, useState } from 'react'
import { getJson } from '../../auth'

const files = {
  monthly: 'monthly-assessment-summary.csv',
  'high-risk': 'high-risk-follow-ups.csv',
  responses: 'question-response-analysis.csv',
}

export default function AdminReports({ token }) {
  const [cards, setCards] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getJson('/api/admin/reports', token)
      .then((data) => setCards(data.cards))
      .catch((err) => setError(err.message))
  }, [token])

  async function download(card) {
    const response = await fetch(`/api/admin/reports/${card.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      setError('That report is not ready.')
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = files[card.id] || `${card.id}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rp">
      {error ? <p className="ad-empty">{error}</p> : null}
      <div className="rp-grid">
        {cards.map((card) => (
          <article className="rp-card" key={card.id}>
            <span className="rp-badge">{card.badge}</span>
            <div>
              <h3>{card.title}</h3>
              <p>{card.detail}</p>
            </div>
            {card.ready ? (
              <button type="button" onClick={() => download(card)}>
                Download
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

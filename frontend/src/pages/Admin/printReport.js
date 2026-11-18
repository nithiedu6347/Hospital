export function printAssessmentReport(patient, quiz) {
  const html = reportHtml(patient, quiz)
  const popup = window.open('', '_blank')
  if (!popup) {
    printInFrame(html)
    return
  }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  const run = () => {
    popup.focus()
    popup.print()
  }
  if (popup.document.readyState === 'complete') setTimeout(run, 200)
  else popup.addEventListener('load', () => setTimeout(run, 200))
}

function printInFrame(html) {
  const frame = document.createElement('iframe')
  frame.setAttribute('title', 'Assessment report')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open()
  doc.write(html)
  doc.close()
  setTimeout(() => {
    frame.contentWindow.focus()
    frame.contentWindow.print()
    setTimeout(() => frame.remove(), 1000)
  }, 200)
}

function reportHtml(patient, quiz) {
  const generated = formatDate(new Date().toISOString())
  const questions = quiz.questions || []
  const answered = questions.filter((question) => question.answer).length
  const missed = questions.length - answered
  const title = `${patient.full_name || 'Patient'} - Assessment report`
  const rows = [
    ['Patient ID', patient.id ?? 'NA', 'Age / Gender', ageGender(patient)],
    ['Phone', patient.phone || 'NA', 'Email', patient.email || 'NA'],
    ['Address', addressOf(patient), 'Registered on', formatDate(patient.created)],
  ]
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1c1917;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }
    h1 { margin: 0; font-size: 26px; letter-spacing: -0.03em; }
    .sub { margin: 4px 0 18px; color: #78716c; font-size: 13px; }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 32px;
      margin: 0 0 22px;
      padding-bottom: 8px;
    }
    .meta small { display: block; color: #a8a29e; font-size: 11px; }
    .meta b { display: block; margin-top: 2px; font-weight: 600; }
    h2 {
      margin: 8px 0 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ea580c;
      font-size: 16px;
    }
    .stats { margin: 0 0 8px; color: #78716c; font-size: 12.5px; }
    ol { margin: 0; padding: 0; list-style: none; }
    li {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid #f1e7df;
      break-inside: avoid;
    }
    .num {
      display: grid;
      flex: none;
      width: 26px;
      height: 26px;
      place-items: center;
      border-radius: 8px;
      background: #fff7ed;
      color: #c2410c;
      font-size: 12px;
      font-weight: 700;
    }
    .prompt { margin: 2px 0 8px; font-size: 14px; }
    .choice {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .choice span { color: #ea580c; font-weight: 600; }
    .choice b, .miss {
      padding: 2px 8px;
      border-radius: 6px;
      background: #fafaf9;
      color: #44403c;
      font-size: 12px;
      font-weight: 600;
    }
    .miss { color: #a8a29e; font-style: italic; font-weight: 500; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(patient.full_name || 'Patient')}</h1>
  <p class="sub">Assessment report · Generated on ${escapeHtml(generated)}</p>
  <div class="meta">
    ${rows
      .map(
        ([leftLabel, leftValue, rightLabel, rightValue]) => `
      <div><small>${escapeHtml(leftLabel)}</small><b>${escapeHtml(leftValue)}</b></div>
      <div><small>${escapeHtml(rightLabel)}</small><b>${escapeHtml(rightValue)}</b></div>`,
      )
      .join('')}
  </div>
  <h2>${escapeHtml(quiz.title || 'Assessment')}</h2>
  <p class="stats">${answered} answered · ${missed} not attended · ${questions.length} questions</p>
  <ol>
    ${questions
      .map(
        (question) => `
      <li>
        <span class="num">${question.number}</span>
        <div>
          <p class="prompt">${escapeHtml(question.prompt)}</p>
          ${
            question.answer
              ? `<div class="choice"><span>${escapeHtml(question.answer)}</span>${
                  question.score != null ? `<b>Score ${escapeHtml(question.score)}</b>` : ''
                }</div>`
              : '<span class="miss">Not answered</span>'
          }
        </div>
      </li>`,
      )
      .join('')}
  </ol>
</body>
</html>`
}

function ageGender(patient) {
  const parts = []
  if (patient.age) parts.push(`${patient.age} yrs`)
  if (patient.gender) parts.push(patient.gender)
  return parts.join(', ') || 'NA'
}

function addressOf(patient) {
  const parts = [patient.full_address, patient.city, patient.state, patient.pincode].filter(Boolean)
  return parts.join(', ') || 'NA'
}

function formatDate(value) {
  if (!value) return 'NA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'NA'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

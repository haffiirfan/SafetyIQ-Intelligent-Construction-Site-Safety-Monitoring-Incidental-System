import { useState } from 'react'

const SAMPLE_QUESTIONS = [
  'Which zone had the most violations this week?',
  'Summarize all helmet violations from yesterday',
  'How many NO-Mask violations were recorded today?',
  'What is the compliance rate for Zone B?',
]

export default function AIQuery() {
  const [question, setQuestion] = useState('')

  return (
    <div className="page">
      <h1 className="hero">AI Safety Query</h1>
      <p className="hero-sub">Ask natural language questions about safety incidents and violations.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div className="card card-pad">
          <div className="query-row">
            <input
              className="query-input"
              placeholder="Which zone had most violations this week?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn-pill active">Ask</button>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Sample questions</div>
          {SAMPLE_QUESTIONS.map((q) => (
            <div
              key={q}
              className="sample-q"
              onClick={() => setQuestion(q)}
            >
              {q}
            </div>
          ))}

          <div className="eyebrow" style={{ marginTop: 24 }}>RAG engine status</div>
          <span className="badge" style={{ color: 'var(--medium)', background: 'var(--medium-soft)' }}>
            Placeholder — connects in Stage 4
          </span>
        </div>
      </div>
    </div>
  )
}
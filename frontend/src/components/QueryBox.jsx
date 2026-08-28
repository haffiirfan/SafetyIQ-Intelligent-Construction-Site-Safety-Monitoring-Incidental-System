import { useState, useEffect } from 'react'
import axios from 'axios'

export default function QueryBox({ presetQuestion, presetVersion }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

  // When a parent page clicks a sample question, presetVersion increments —
  // that's what triggers this, even if the same question is clicked twice.
  useEffect(() => {
    if (presetQuestion !== undefined && presetVersion !== undefined) {
      setQuestion(presetQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetVersion])

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer(null)
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/query/', { question })
      setAnswer(res.data.answer)
    } catch (err) {
      setAnswer('Something went wrong reaching the AI query service.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAsk()
  }

  return (
    <div>
      <h2 className="hero" style={{ fontSize: 22, marginBottom: 20 }}>AI Safety Query</h2>
      <div className="query-row">
        <input
          className="query-input"
          placeholder="Which zone had most violations this week?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn-pill active" onClick={handleAsk} disabled={loading}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      {answer && (
        <div
          className="card card-pad"
          style={{ marginTop: 16, background: 'var(--surface-raised)' }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>Answer</div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
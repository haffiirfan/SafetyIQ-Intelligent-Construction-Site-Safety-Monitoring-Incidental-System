import { useState } from 'react'

export default function QueryBox() {
  const [question, setQuestion] = useState('')

  const handleAsk = () => {
    // wire this to your actual query API call
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
        />
        <button className="btn-pill active" onClick={handleAsk}>Ask</button>
      </div>
    </div>
  )
}
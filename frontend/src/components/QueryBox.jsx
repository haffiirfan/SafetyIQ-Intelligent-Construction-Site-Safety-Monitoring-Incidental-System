// ══════════════════════════════════════════
// components/QueryBox.jsx — RAG query UI
// ══════════════════════════════════════════
import { useState } from 'react'
import { queryAPI } from '../api/client'

export default function QueryBox() {
  const [question, setQuestion] = useState('')
  const [answer,   setAnswer]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [history,  setHistory]  = useState([])

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await queryAPI.ask(question)
      const entry = { question, answer: res.data.answer }
      setAnswer(res.data.answer)
      setHistory((h) => [entry, ...h].slice(0, 10))
      setQuestion('')
    } catch (err) {
      setAnswer('Error connecting to RAG engine.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        AI Safety Query
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Which zone had most violations this week?"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </div>

      {answer && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 mb-4">
          <p className="font-semibold text-gray-500 mb-1">Answer:</p>
          <p>{answer}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-semibold uppercase">History</p>
          {history.map((h, i) => (
            <div key={i} className="text-xs bg-gray-50 rounded p-2">
              <p className="font-semibold text-gray-600">Q: {h.question}</p>
              <p className="text-gray-500">A: {h.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
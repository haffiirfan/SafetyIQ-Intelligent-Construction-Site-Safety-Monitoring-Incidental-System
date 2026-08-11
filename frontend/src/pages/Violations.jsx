// ══════════════════════════════════════════
// pages/Violations.jsx
// ══════════════════════════════════════════
import { useState, useEffect } from 'react'
import ViolationCard from '../components/ViolationCard'
import { violationsAPI } from '../api/client'

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')

  const fetchViolations = () => {
    setLoading(true)
    const params = filter !== 'all' ? { severity: filter } : {}
    violationsAPI.getAll(params)
      .then((r) => setViolations(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchViolations() }, [filter])

  const handleResolve = async (id) => {
    await violationsAPI.resolve(id)
    fetchViolations()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Violations</h1>
        <div className="flex gap-2">
          {['all', 'Critical', 'High', 'Medium'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                filter === f
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : violations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No violations found
        </div>
      ) : (
        <div className="grid gap-3">
          {violations.map((v) => (
            <ViolationCard
              key={v.id}
              violation={v}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  )
}
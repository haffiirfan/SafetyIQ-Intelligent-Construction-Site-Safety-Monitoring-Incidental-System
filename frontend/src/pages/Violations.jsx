import { useState, useEffect } from 'react'
import { violationsAPI } from '../api/client'

const RISK = {
  Critical: { color: '#E0625F', soft: 'rgba(224,98,95,0.14)' },
  High:     { color: '#E8A548', soft: 'rgba(232,165,72,0.14)' },
  Medium:   { color: '#D9C27E', soft: 'rgba(217,194,126,0.14)' },
}

const FILTERS = ['all', 'Critical', 'High', 'Medium']

function ViolationModal({ v, onClose, onResolve }) {
  if (!v) return null
  const r = RISK[v.severity] || RISK.Medium
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-titlebar">
          <span className="modal-dot" style={{ background: '#E0625F' }} />
          <span className="modal-dot" style={{ background: '#E8A548' }} />
          <span className="modal-dot" style={{ background: '#5CB88A' }} />
          <span style={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Violation Detail — {v.risk_type}
          </span>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="badge" style={{ color: r.color, background: r.soft }}>{v.severity}</span>
            <span className="hero" style={{ fontSize: 20, margin: 0 }}>{v.risk_type}</span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            Detected in <strong style={{ color: 'var(--text-primary)' }}>{v.zone}</strong> at{' '}
            {new Date(v.created_at).toLocaleString('en-GB', { hour12: false })}. This detection was
            logged automatically by the real-time YOLO11m inference pipeline and flagged by confidence
            threshold as a {v.severity.toLowerCase()}-severity compliance issue.
          </p>

          <div className="eyebrow">Status</div>
          <div style={{ fontSize: 14, color: v.resolved ? 'var(--compliant)' : 'var(--text-primary)', marginBottom: 4 }}>
            {v.resolved ? 'Resolved' : 'Open — awaiting review'}
          </div>
        </div>

        <div className="modal-actions">
          {!v.resolved && (
            <button className="btn-pill solid-success" onClick={() => { onResolve(v.id); onClose() }}>
              Mark resolved
            </button>
          )}
          <button className="btn-pill" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Violations() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const fetchViolations = () => {
    setLoading(true)
    const params = filter !== 'all' ? { severity: filter } : {}
    violationsAPI.getAll(params).then((r) => setViolations(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchViolations() }, [filter])

  const handleResolve = async (id) => {
    await violationsAPI.resolve(id)
    fetchViolations()
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="hero" style={{ fontSize: 32, marginBottom: 6 }}>Violations</h1>
          <p className="hero-sub" style={{ marginBottom: 0 }}>Every logged compliance issue, ordered by most recent.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn-pill${filter === f ? ' active' : ''}`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading</div>
      ) : violations.length === 0 ? (
        <div className="card"><div className="empty-state">No violations recorded</div></div>
      ) : (
        <div className="card card-pad">
          {violations.map((v) => {
            const r = RISK[v.severity] || RISK.Medium
            return (
              <div key={v.id} className="row">
                <span className="badge" style={{ color: r.color, background: r.soft }}>{v.severity}</span>

                <div style={{ flex: 1 }}>
                  <div className="row-title">{v.risk_type}</div>
                  <div className="row-meta">
                    {v.zone} · {new Date(v.created_at).toLocaleString('en-GB', { hour12: false })}
                  </div>
                </div>

                <button className="btn-pill" onClick={() => setSelected(v)}>Details</button>

                {v.resolved ? (
                  <span style={{ fontSize: 12.5, color: 'var(--compliant)' }}>Resolved</span>
                ) : (
                  <button className="btn-pill success" onClick={() => handleResolve(v.id)}>Resolve</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ViolationModal v={selected} onClose={() => setSelected(null)} onResolve={handleResolve} />
    </div>
  )
}
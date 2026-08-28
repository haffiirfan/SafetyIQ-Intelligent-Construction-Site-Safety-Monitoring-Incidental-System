import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const VIOLATION_TYPES = ['All types', 'NO-Hardhat', 'NO-Safety Vest', 'NO-Mask', 'NO-Gloves']
const ZONES = ['All zones', 'Zone 1', 'Zone 2']

const RISK = {
  'NO-Hardhat':     { color: '#E0625F', soft: 'rgba(224,98,95,0.14)' },
  'NO-Safety Vest': { color: '#E8A548', soft: 'rgba(232,165,72,0.14)' },
  'NO-Mask':        { color: '#D9C27E', soft: 'rgba(217,194,126,0.14)' },
  Mixed:            { color: '#7EA6D9', soft: 'rgba(126,166,217,0.14)' },
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [genZone, setGenZone] = useState('All zones')
  const [genType, setGenType] = useState('All types')
  const [genDate, setGenDate] = useState('')

  const [listType, setListType] = useState('All types')
  const [listDate, setListDate] = useState('')

  const fetchReports = () => {
    setLoadingList(true)
    axios.get('http://127.0.0.1:8000/api/v1/reports/')
      .then((r) => setReports(r.data))
      .finally(() => setLoadingList(false))
  }

  useEffect(() => { fetchReports() }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await axios.post('http://127.0.0.1:8000/api/v1/reports/generate', {
        zone: genZone !== 'All zones' ? genZone : null,
        risk_type: genType !== 'All types' ? genType : null,
        date: genDate || null,
      })
      fetchReports()
    } catch (err) {
      alert('Report generation failed — check the backend terminal.')
    } finally {
      setGenerating(false)
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (listType !== 'All types' && r.risk_type !== listType) return false
      if (listDate) {
        const rDate = new Date(r.created_at).toISOString().slice(0, 10)
        if (rDate !== listDate) return false
      }
      return true
    })
  }, [reports, listType, listDate])

  return (
    <div className="page">
      <h1 className="hero">Incident Reports</h1>
      <p className="hero-sub">
        AI-written narrative summaries of logged violations, generated on demand
        and saved for later review.
      </p>

      <div className="card card-pad" style={{ marginBottom: 32 }}>
        <div className="eyebrow">Generate a new report</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="btn-pill" value={genZone} onChange={(e) => setGenZone(e.target.value)} style={{ cursor: 'pointer' }}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <select className="btn-pill" value={genType} onChange={(e) => setGenType(e.target.value)} style={{ cursor: 'pointer' }}>
            {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" className="btn-pill" value={genDate} onChange={(e) => setGenDate(e.target.value)} style={{ cursor: 'pointer' }} />
          <button className="btn-pill active" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Writing report…' : 'Generate report'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 0 }}>Saved reports</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="btn-pill" value={listType} onChange={(e) => setListType(e.target.value)} style={{ cursor: 'pointer' }}>
            {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" className="btn-pill" value={listDate} onChange={(e) => setListDate(e.target.value)} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {loadingList ? (
        <div className="empty-state">Loading</div>
      ) : filteredReports.length === 0 ? (
        <div className="card"><div className="empty-state">No reports yet — generate one above</div></div>
      ) : (
        filteredReports.map((r) => {
          const c = RISK[r.risk_type] || RISK.Mixed
          return (
            <div key={r.id} className="card card-pad" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className="badge" style={{ color: c.color, background: c.soft }}>{r.risk_type}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                  {new Date(r.created_at).toLocaleString('en-GB', { hour12: false })} · {r.generated_by}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {r.summary_text}
              </p>
            </div>
          )
        })
      )}
    </div>
  )
}

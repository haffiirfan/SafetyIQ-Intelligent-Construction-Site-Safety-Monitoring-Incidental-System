import { useState } from 'react'
import QueryBox from '../components/QueryBox'
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions'

export default function AIQuery() {
  const [preset, setPreset] = useState('')
  const [presetVersion, setPresetVersion] = useState(0)

  const handleSampleClick = (q) => {
    setPreset(q)
    setPresetVersion((v) => v + 1)
  }

  return (
    <div className="page">
      <h1 className="hero">AI Safety Query</h1>
      <p className="hero-sub">Ask natural language questions about safety incidents and violations.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div className="card card-pad">
          <QueryBox presetQuestion={preset} presetVersion={presetVersion} />
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Sample questions</div>
          {SAMPLE_QUESTIONS.map((q) => (
            <div key={q} className="sample-q" onClick={() => handleSampleClick(q)}>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
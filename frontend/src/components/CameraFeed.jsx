import { useRef, useState } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const RISK = {
  Critical: { color: '#E0625F', soft: 'rgba(224,98,95,0.14)' },
  High:     { color: '#E8A548', soft: 'rgba(232,165,72,0.14)' },
  Medium:   { color: '#D9C27E', soft: 'rgba(217,194,126,0.14)' },
  Low:      { color: '#7EA6D9', soft: 'rgba(126,166,217,0.14)' },
  None:     { color: '#5CB88A', soft: 'rgba(92,184,138,0.14)' },
}

export default function CameraFeed({ cameraId = 1, zoneLabel = 'Zone 1' }) {
  const { detections, connected } = useWebSocket(cameraId)
  const videoRef = useRef(null)
  const [dims, setDims] = useState({ w: 640, h: 360 })

  const videoSrc = `/Site_${cameraId}.mp4`

  const handleLoaded = () => {
    if (videoRef.current) {
      setDims({
        w: videoRef.current.videoWidth || 640,
        h: videoRef.current.videoHeight || 360,
      })
    }
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
          Camera {cameraId} · {zoneLabel}
        </span>
        <span className="status-pill" style={{ padding: '3px 10px' }}>
          <span className="live-dot" style={{ background: connected ? 'var(--critical)' : 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 10 }}>{connected ? 'Live' : 'Offline'}</span>
        </span>
      </div>

      <div
        className="cam-frame"
        style={{
          width: '100%',
          aspectRatio: `${dims.w} / ${dims.h}`,
          background: '#060607',
        }}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay loop muted playsInline
          onLoadedMetadata={handleLoaded}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          preserveAspectRatio="none"
        >
          {detections.map((d, i) => {
            if (!d.bbox || d.bbox.length < 4) return null
            const [x1, y1, x2, y2] = d.bbox
            const r = RISK[d.risk] || RISK.None
            return (
              <g key={i}>
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={r.color} strokeWidth="2" rx="2" />
                <rect x={x1} y={y1 - 16} width={(d.class.length + 6) * 5.2} height="14" fill={r.color} rx="4" />
                <text x={x1 + 4} y={y1 - 5} fontFamily="Inter, sans-serif" fontSize="9" fontWeight="600" fill="#141414">
                  {d.class} {Math.round(d.confidence * 100)}%
                </text>
              </g>
            )
          })}
        </svg>

        {detections.length > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 8, fontSize: 9, color: '#fff',
            background: 'rgba(0,0,0,0.55)', padding: '2px 7px', borderRadius: 999,
          }}>
            {detections.length} detected
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, minHeight: 20 }}>
        {detections.length === 0 ? (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>No active detections</span>
        ) : (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {detections.slice(0, 2).map((d, i) => {
              const r = RISK[d.risk] || RISK.None
              return (
                <span key={i} className="chip" style={{ fontSize: 10, padding: '3px 8px', color: r.color, borderColor: r.color }}>
                  {d.class} · {(d.confidence * 100).toFixed(0)}%
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
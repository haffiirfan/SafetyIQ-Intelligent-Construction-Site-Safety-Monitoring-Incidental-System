import { useEffect } from 'react'
import CameraFeed from '../components/CameraFeed'
import QueryBox from '../components/QueryBox'
import { detectionsAPI } from '../api/client'
import useAppStore from '../store/useAppStore'

export default function Dashboard() {
  const { stats, setStats, alerts } = useAppStore()

  useEffect(() => {
    detectionsAPI.getStats().then((r) => setStats(r.data))
  }, [])

  return (
    <div className="page">
      <h1 className="hero">Dashboard</h1>
      <p className="hero-sub">
        Real-time PPE compliance across all monitored zones, powered by on-site YOLO11m inference.
      </p>

      <div className="stat-grid">
        <div className="card card-pad">
          <div className="eyebrow">Detections</div>
          <div className="stat-value">{stats?.total_detections ?? 0}</div>
        </div>
        <div className="card card-pad">
          <div className="eyebrow">Violations</div>
          <div className="stat-value" style={{ color: 'var(--critical)' }}>{stats?.total_violations ?? 0}</div>
        </div>
        <div className="card card-pad">
          <div className="eyebrow">Compliance</div>
          <div className="stat-value" style={{ color: 'var(--compliant)' }}>{stats?.compliance_rate ?? 0}%</div>
        </div>
      </div>

      <div className="cam-grid">
        <CameraFeed cameraId={1} zoneLabel="Main gate" />
        <CameraFeed cameraId={2} zoneLabel="Zone 2" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 40 }}>
        <QueryBox />
      </div>

      <div className="section-title">
        <span>⚠</span> Live Alerts
      </div>
      <div className="card card-pad">
        {alerts.length === 0 ? (
          <div className="empty-state">No active alerts</div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="row">
              <div style={{ flex: 1 }}>
                <div className="row-title">{a.type}</div>
                <div className="row-meta">Camera {a.camera_id} · {a.time}</div>
              </div>
              <span className="badge" style={{ color: 'var(--critical)', background: 'var(--critical-soft)' }}>
                {a.risk}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
// ══════════════════════════════════════════
// pages/Dashboard.jsx
// ══════════════════════════════════════════
import { useEffect } from 'react'
import CameraFeed from '../components/CameraFeed'
import QueryBox   from '../components/QueryBox'
import { detectionsAPI, violationsAPI } from '../api/client'
import useAppStore from '../store/useAppStore'

export default function Dashboard() {
  const { stats, setStats, alerts } = useAppStore()

  useEffect(() => {
    detectionsAPI.getStats().then((r) => setStats(r.data))
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Detections</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats?.total_detections ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Total Violations</p>
          <p className="text-3xl font-bold text-red-600">
            {stats?.total_violations ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Compliance Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.compliance_rate ? `${stats.compliance_rate}%` : '—'}
          </p>
        </div>
      </div>

      {/* Camera + Query row */}
      <div className="grid grid-cols-2 gap-6">
        <CameraFeed cameraId={1} />
        <QueryBox />
      </div>

      {/* Live alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Live Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id}
                className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <span className="text-red-700 font-semibold text-sm">
                  {a.type}
                </span>
                <span className="text-gray-500 text-xs">
                  Camera {a.camera_id} — {a.time}
                </span>
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {a.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
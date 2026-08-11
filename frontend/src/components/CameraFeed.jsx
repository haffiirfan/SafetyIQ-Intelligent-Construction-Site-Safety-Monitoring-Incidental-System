// ══════════════════════════════════════════
// components/CameraFeed.jsx — Live feed
// ══════════════════════════════════════════
import useWebSocket from '../hooks/useWebSocket'

const RISK_COLORS = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#3b82f6',
  None:     '#22c55e',
}

export default function CameraFeed({ cameraId = 1 }) {
  const { detections, connected } = useWebSocket(cameraId)

  const violations = detections.filter((d) => d.risk !== 'None')

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-white text-sm font-semibold">
          Camera {cameraId}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
          connected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Mock camera view */}
      <div className="relative bg-gray-800 h-64 flex items-center justify-center">
        <div className="text-gray-500 text-sm text-center">
          <div className="text-4xl mb-2">📷</div>
          <p>Camera feed active</p>
          <p className="text-xs mt-1">
            {connected ? 'Receiving detections...' : 'Connecting...'}
          </p>
        </div>

        {/* Overlay detection count */}
        {detections.length > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {detections.length} detected
          </div>
        )}
      </div>

      {/* Detection list */}
      <div className="p-3 space-y-1 max-h-32 overflow-y-auto">
        {detections.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-2">
            No detections
          </p>
        ) : (
          detections.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span style={{ color: RISK_COLORS[d.risk] }} className="font-semibold">
                {d.class}
              </span>
              <span className="text-gray-400">
                {(d.confidence * 100).toFixed(0)}%
              </span>
              <span style={{ color: RISK_COLORS[d.risk] }}>
                {d.risk}
              </span>
            </div>
          ))
        )}
      </div>

      {violations.length > 0 && (
        <div className="bg-red-900 px-3 py-2">
          <p className="text-red-300 text-xs font-bold">
            {violations.length} violation(s) detected
          </p>
        </div>
      )}
    </div>
  )
}
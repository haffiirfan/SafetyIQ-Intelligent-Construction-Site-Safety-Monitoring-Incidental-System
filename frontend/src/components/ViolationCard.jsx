// ══════════════════════════════════════════
// components/ViolationCard.jsx
// ══════════════════════════════════════════
const RISK_COLORS = {
  Critical: 'bg-red-100 border-red-500 text-red-700',
  High:     'bg-orange-100 border-orange-500 text-orange-700',
  Medium:   'bg-yellow-100 border-yellow-500 text-yellow-700',
  Low:      'bg-blue-100 border-blue-500 text-blue-700',
}

const RISK_BADGES = {
  Critical: 'bg-red-600',
  High:     'bg-orange-500',
  Medium:   'bg-yellow-500',
  Low:      'bg-blue-500',
}

export default function ViolationCard({ violation, onResolve }) {
  const colorClass = RISK_COLORS[violation.severity] || RISK_COLORS.Low
  const badgeClass = RISK_BADGES[violation.severity] || RISK_BADGES.Low

  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-white text-xs px-2 py-1 rounded-full font-bold ${badgeClass}`}>
            {violation.severity}
          </span>
          <span className="font-semibold text-gray-800">
            {violation.risk_type || violation.zone}
          </span>
        </div>
        {!violation.resolved && (
          <button
            onClick={() => onResolve(violation.id)}
            className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition"
          >
            Resolve
          </button>
        )}
        {violation.resolved && (
          <span className="text-xs text-green-600 font-semibold">Resolved</span>
        )}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>Zone: <span className="font-medium">{violation.zone}</span></p>
        <p>Time: <span className="font-medium">
          {new Date(violation.created_at).toLocaleString()}
        </span></p>
        {violation.notes && <p>Notes: {violation.notes}</p>}
      </div>
    </div>
  )
}
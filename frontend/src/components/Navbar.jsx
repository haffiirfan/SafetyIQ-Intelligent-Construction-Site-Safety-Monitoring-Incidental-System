// ══════════════════════════════════════════
// components/Navbar.jsx
// ══════════════════════════════════════════
import { Link, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

export default function Navbar() {
  const { user, logout, alerts } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-xl font-bold">SafetyIQ</span>
        <span className="text-gray-400 text-sm">Construction Safety Monitor</span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <Link to="/"          className="hover:text-yellow-400 transition">Dashboard</Link>
        <Link to="/violations" className="hover:text-yellow-400 transition">Violations</Link>
        <Link to="/reports"    className="hover:text-yellow-400 transition">Reports</Link>
        <Link to="/query"      className="hover:text-yellow-400 transition">AI Query</Link>
      </div>

      <div className="flex items-center gap-4">
        {alerts.length > 0 && (
          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
            {alerts.length} alerts
          </span>
        )}
        <span className="text-gray-400 text-sm">{user?.username || 'Manager'}</span>
        <button
          onClick={handleLogout}
          className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
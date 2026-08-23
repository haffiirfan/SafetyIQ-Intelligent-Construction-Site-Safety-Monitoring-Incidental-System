import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/violations', label: 'Violations', icon: '⚠' },
  { to: '/reports', label: 'Reports', icon: '▤' },
  { to: '/query', label: 'AI Query', icon: '◈' },
]

export default function Navbar({ alertCount = 0, connected = true }) {
  return (
    <div className="nav-wrap">
      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--critical)', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--compliant)', display: 'inline-block' }} />
          <span className="font-display" style={{ fontSize: 17, fontWeight: 700, marginLeft: 6 }}>
            Safety<span style={{ color: 'var(--critical)' }}>IQ</span>
          </span>
        </div>

        <div className="nav-pill-group">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}
            >
              <span>{l.icon}</span>{l.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="status-pill">
            <span className="live-dot" style={{ background: connected ? 'var(--compliant)' : 'var(--critical)' }} />
            {connected ? 'System live' : 'Disconnected'}
          </span>
          {alertCount > 0 && (
            <span className="status-pill" style={{ borderColor: 'var(--critical)', color: 'var(--critical)' }}>
              {alertCount} alerts
            </span>
          )}
          <button className="btn-pill">Log out</button>
        </div>
      </nav>
    </div>
  )
}
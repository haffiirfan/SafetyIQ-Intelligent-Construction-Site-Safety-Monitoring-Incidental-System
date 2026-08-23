import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-soft)', marginTop: 60 }}>
      <div className="page" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 32 }}>
          <div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Safety<span style={{ color: 'var(--critical)' }}>IQ</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 260 }}>
              Real-time construction site safety monitoring, powered by YOLO11m and a
              retrieval-grounded incident reporting pipeline.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Navigate</div>
            {[
              ['/', 'Dashboard'],
              ['/violations', 'Violations'],
              ['/reports', 'Reports'],
              ['/query', 'AI Query'],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={{ display: 'block', fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                {label}
              </Link>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>System</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              <span className="live-dot" />
              Inference active
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
              YOLO11m · FastAPI · PostgreSQL
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
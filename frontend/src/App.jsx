// ══════════════════════════════════════════
// App.jsx — Router setup
// ══════════════════════════════════════════
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar      from './components/Navbar'
import Dashboard   from './pages/Dashboard'
import Violations  from './pages/Violations'
import Reports     from './pages/Reports'
import QueryPage   from './pages/QueryPage'
import Login       from './pages/Login'
import useAppStore from './store/useAppStore'

function ProtectedLayout({ children }) {
  const token = useAppStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/violations" element={
          <ProtectedLayout><Violations /></ProtectedLayout>
        } />
        <Route path="/reports" element={
          <ProtectedLayout><Reports /></ProtectedLayout>
        } />
        <Route path="/query" element={
          <ProtectedLayout><QueryPage /></ProtectedLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
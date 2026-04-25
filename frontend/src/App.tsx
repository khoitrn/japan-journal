import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthGate from './components/AuthGate'
import Feed from './pages/Feed'
import DayView from './pages/DayView'

function RoleBadge() {
  const { role, logout } = useAuth()
  if (role === 'none') return null
  return (
    <div style={{
      position: 'fixed', top: 10, right: 12, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        background: role === 'admin' ? '#bd93f9' : '#44475a',
        color: role === 'admin' ? '#1e1f29' : '#f8f8f2',
        fontSize: 11, fontWeight: 700, padding: '3px 8px',
        borderRadius: 10, letterSpacing: '0.05em',
      }}>
        {role === 'admin' ? '⚙ ADMIN' : '👤 GUEST'}
      </span>
      <button onClick={logout} style={{
        background: 'none', border: '1px solid #44475a', borderRadius: 8,
        color: '#6272a4', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
      }}>
        Sign out
      </button>
    </div>
  )
}

function AppRoutes() {
  const { role } = useAuth()
  if (role === 'none') return <AuthGate />
  return (
    <>
      <RoleBadge />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/day/:dayNum" element={<DayView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

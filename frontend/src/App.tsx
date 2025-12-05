import { Route, Routes, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import MessagePage from './pages/MessagePage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={user ? <MainPage /> : <Navigate to="/login" replace />} />
      <Route path="/messages/:id" element={user ? <MessagePage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={user && user.role === 'ADMIN' ? <AdminPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

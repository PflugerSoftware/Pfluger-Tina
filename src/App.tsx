import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import TinaApp from './TinaApp'
import ViewerPage from './components/ViewerPage'
import LoginPage from './components/LoginPage'
import ClientApp from './components/ClientApp'
import ProtectedRoute from './components/ProtectedRoute'

function RootRedirect() {
  const { isAuthenticated, mode, projectName } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (mode === 'client' && projectName) {
    const slug = projectName.toLowerCase().replace(/\s+/g, '-')
    return <Navigate to={`/${slug}`} replace />
  }
  return <TinaApp />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/viewer" element={<ViewerPage />} />
      <Route path="/:projectSlug" element={
        <ProtectedRoute requiredMode="client">
          <ClientApp />
        </ProtectedRoute>
      } />
      <Route path="/:projectSlug/360" element={
        <ProtectedRoute requiredMode="client">
          <ClientApp />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App

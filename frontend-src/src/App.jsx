import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ApiaryPage from './pages/ApiaryPage'
import HivePage from './pages/HivePage'
import VisitPage from './pages/VisitPage'
import FeedingPage from './pages/FeedingPage'
import CommunityPage from './pages/CommunityPage'
import MarketplacePage from './pages/MarketplacePage'
import AIPage from './pages/AIPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
      <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Duke ngarkuar...</span>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <div className="page-layout">
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/apiary/:id" element={
            <ProtectedRoute><ApiaryPage /></ProtectedRoute>
          } />
          <Route path="/hive/:id" element={
            <ProtectedRoute><HivePage /></ProtectedRoute>
          } />
          <Route path="/apiary/:id/visit" element={
            <ProtectedRoute><VisitPage /></ProtectedRoute>
          } />
          <Route path="/apiary/:id/feeding" element={
            <ProtectedRoute><FeedingPage /></ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute><AIPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🐝</div>
              <h2 style={{ marginBottom: '0.5rem' }}>404 - Faqja nuk u gjet</h2>
              <p style={{ marginBottom: '1.5rem' }}>Ky URL nuk ekziston.</p>
              <a href="/" className="btn btn-primary">Kthehu në shtëpi</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageLoader from './components/PageLoader'

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
import DonatePage from './pages/DonatePage'

function ProtectedRoute({ children, beekeeper = true }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Admini s'menaxhon kopshte — vetëm statistika dhe regjistrime
  if (beekeeper && isAdmin) return <Navigate to="/admin" replace />
  return children
}

// Admini s'ka pse ta shohë faqen e mbështetjes
function NotForAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/admin" replace /> : children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <div className={`page-layout${isAuthenticated ? ' has-tabbar' : ''}`}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/donate" element={<NotForAdmin><DonatePage /></NotForAdmin>} />
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
            <ProtectedRoute beekeeper={false}><ProfilePage /></ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={
            <div className="container empty-state" style={{ padding: '80px 16px' }}>
              <h2 className="page-title" style={{ marginBottom: 8 }}>Kjo faqe nuk ekziston</h2>
              <p>Lidhja mund të jetë e vjetër ose e shkruar gabim.</p>
              <a href="/" className="btn btn-primary">Shko te faqja kryesore</a>
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

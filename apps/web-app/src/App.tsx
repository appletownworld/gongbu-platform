// React import removed - not needed in modern React
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout components
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

// Page components
import HomePage from '@/pages/HomePage'
import CoursesPage from '@/pages/CoursesPage'
import CourseDetailPage from '@/pages/CourseDetailPage'
import CreateCoursePage from '@/pages/CreateCoursePage'
import MyCoursesPage from '@/pages/MyCoursesPage'
import CourseEditorPage from '@/pages/CourseEditorPage'
import StudentApp from '@/pages/StudentApp'
import LoginPage from '@/pages/auth/LoginPage'
import AccessDeniedPage from '@/pages/auth/AccessDeniedPage'
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'

// Auth components
import ProtectedRoute, { StudentRoute, CreatorRoute } from '@/components/auth/ProtectedRoute'
import AuthDebugPanel from '@/components/auth/AuthDebugPanel'

// Providers
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-secondary-50">
        <Header />
        
        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:slug" element={<CourseDetailPage />} />
            
            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} /> {/* Backwards compatibility */}
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            
            {/* Protected routes for all authenticated users */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Creator/Admin routes */}
            <Route 
              path="/create-course" 
              element={
                <CreatorRoute>
                  <CreateCoursePage />
                </CreatorRoute>
              } 
            />
            <Route 
              path="/my-courses" 
              element={
                <CreatorRoute>
                  <MyCoursesPage />
                </CreatorRoute>
              } 
            />
            <Route 
              path="/courses/:slug/edit" 
              element={
                <CreatorRoute>
                  <CourseEditorPage />
                </CreatorRoute>
              } 
            />
            
            {/* Student routes (включая Telegram WebApp) */}
            <Route 
              path="/student/:slug" 
              element={
                <StudentRoute>
                  <StudentApp />
                </StudentRoute>
              } 
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <Footer />
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'bg-white shadow-lg border border-secondary-200',
          }}
        />

        {/* Auth Debug Panel (development only) */}
        <AuthDebugPanel />
      </div>
    </AuthProvider>
  )
}

export default App

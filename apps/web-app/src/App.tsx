import React from 'react'
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
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'

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
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create-course" element={<CreateCoursePage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/courses/:slug/edit" element={<CourseEditorPage />} />
            
            {/* Student Telegram WebApp */}
            <Route path="/student/:slug" element={<StudentApp />} />
            
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
      </div>
    </AuthProvider>
  )
}

export default App

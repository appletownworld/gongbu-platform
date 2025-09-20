import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { autoAuthService } from '@/services/autoAuth'
import { authApi } from '@/services/api'
import { 
  UserIcon, 
  CogIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AuthDebugPanelProps {
  className?: string
}

const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ className }) => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    authSource, 
    login, 
    autoLogin, 
    hasRole,
    isTelegramWebApp 
  } = useAuth()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  // Test functions
  const testTokenStorage = () => {
    const accessToken = autoAuthService.getAccessToken()
    const refreshToken = autoAuthService.getRefreshToken()
    const userData = autoAuthService.getStoredUser()
    
    const result = !!(accessToken && refreshToken && userData)
    setTestResults(prev => ({ ...prev, tokenStorage: result }))
    
    toast.success(`Token Storage: ${result ? '✅ OK' : '❌ FAIL'}`)
    return result
  }

  const testTelegramIntegration = () => {
    const isTgWebApp = isTelegramWebApp()
    const telegramData = autoAuthService.getTelegramInitData()
    const telegramUser = autoAuthService.getTelegramUser()
    
    const result = isTgWebApp && !!telegramData
    setTestResults(prev => ({ ...prev, telegram: result }))
    
    console.log('Telegram Debug:', {
      isTgWebApp,
      telegramData: telegramData?.substring(0, 50) + '...',
      telegramUser
    })
    
    toast.success(`Telegram Integration: ${result ? '✅ OK' : '❌ FAIL'}`)
    return result
  }

  const testApiConnection = async () => {
    try {
      // Test profile endpoint (protected)
      if (isAuthenticated) {
        await authApi.getProfile()
        setTestResults(prev => ({ ...prev, api: true }))
        toast.success('API Connection: ✅ OK')
        return true
      } else {
        // Test public endpoint or login
        const mockData = autoAuthService.generateMockTelegramData()
        await login(mockData)
        setTestResults(prev => ({ ...prev, api: true }))
        toast.success('API Connection: ✅ OK')
        return true
      }
    } catch (error: any) {
      console.error('API Test failed:', error)
      setTestResults(prev => ({ ...prev, api: false }))
      toast.error(`API Connection: ❌ ${error.message}`)
      return false
    }
  }

  const testRolePermissions = () => {
    if (!user) {
      toast.error('Role Permissions: ❌ No user')
      return false
    }

    const tests = [
      { role: 'STUDENT', expected: hasRole('STUDENT' as any) },
      { role: 'CREATOR', expected: hasRole('CREATOR' as any) },
      { role: 'ADMIN', expected: hasRole('ADMIN' as any) }
    ]

    const passed = tests.filter(test => test.expected).length > 0
    setTestResults(prev => ({ ...prev, roles: passed }))
    
    toast.success(`Role Permissions: ${passed ? '✅ OK' : '❌ FAIL'} (Current: ${user.role})`)
    return passed
  }

  const testAutoAuth = async () => {
    try {
      const result = await autoLogin()
      setTestResults(prev => ({ ...prev, autoAuth: result }))
      
      toast.success(`Auto Auth: ${result ? '✅ OK' : '❌ FAIL'}`)
      return result
    } catch (error: any) {
      console.error('Auto auth test failed:', error)
      setTestResults(prev => ({ ...prev, autoAuth: false }))
      toast.error(`Auto Auth: ❌ ${error.message}`)
      return false
    }
  }

  const runAllTests = async () => {
    toast.loading('Running all tests...')
    
    const results = {
      tokenStorage: testTokenStorage(),
      telegram: testTelegramIntegration(),
      api: await testApiConnection(),
      roles: testRolePermissions(),
      autoAuth: await testAutoAuth()
    }
    
    const passed = Object.values(results).filter(Boolean).length
    const total = Object.keys(results).length
    
    toast.dismiss()
    toast.success(`All Tests Complete: ${passed}/${total} passed`, {
      duration: 5000
    })
  }

  const generateMockAuth = async () => {
    try {
      const mockData = autoAuthService.generateMockTelegramData()
      await login(mockData)
      toast.success('Mock authentication successful!')
    } catch (error: any) {
      toast.error(`Mock auth failed: ${error.message}`)
    }
  }

  const clearAuthData = () => {
    autoAuthService.clearAuthData()
    window.location.reload()
    toast.success('Auth data cleared, page reloaded')
  }

  if (!import.meta.env.DEV) {
    return null // Only show in development
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 ${className}`}>
      <div 
        className="p-3 cursor-pointer flex items-center space-x-2 border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CogIcon className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Auth Debug</span>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 w-80 max-h-96 overflow-y-auto">
          
          {/* Current Status */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Current Status</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {isLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Auth Source:</span>
                <span className="font-mono">{authSource || 'none'}</span>
              </div>
              <div className="flex justify-between">
                <span>Telegram WebApp:</span>
                <span className={isTelegramWebApp() ? 'text-green-600' : 'text-red-600'}>
                  {isTelegramWebApp() ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                User Info
              </h3>
              <div className="space-y-1 text-xs bg-gray-50 p-2 rounded">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Name:</strong> {user.firstName} {user.lastName}</div>
                <div><strong>Username:</strong> {user.username || 'N/A'}</div>
                <div><strong>Role:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{user.role}</span></div>
                <div><strong>Telegram ID:</strong> {user.telegramId}</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Test Results</h3>
              <div className="space-y-1 text-xs">
                {Object.entries(testResults).map(([test, result]) => (
                  <div key={test} className="flex justify-between">
                    <span>{test}:</span>
                    <span className={result ? 'text-green-600' : 'text-red-600'}>
                      {result ? '✅ PASS' : '❌ FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-800">Actions</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runAllTests}
                className="text-xs btn-primary py-1"
                disabled={isLoading}
              >
                🧪 Run All Tests
              </button>
              
              <button
                onClick={testTokenStorage}
                className="text-xs btn-outline py-1"
              >
                🔑 Test Tokens
              </button>
              
              <button
                onClick={testTelegramIntegration}
                className="text-xs btn-outline py-1"
              >
                📱 Test Telegram
              </button>
              
              <button
                onClick={testApiConnection}
                className="text-xs btn-outline py-1"
                disabled={isLoading}
              >
                🌐 Test API
              </button>
              
              <button
                onClick={generateMockAuth}
                className="text-xs btn-warning py-1"
                disabled={isLoading}
              >
                🤖 Mock Auth
              </button>
              
              <button
                onClick={clearAuthData}
                className="text-xs btn-danger py-1"
              >
                🧹 Clear Data
              </button>
            </div>

            {!isAuthenticated && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Tip:</strong> Click "Mock Auth" to test with fake Telegram data
                </p>
              </div>
            )}

            {isAuthenticated && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-800">
                  ✅ <strong>Ready:</strong> All auth functions should be working
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthDebugPanel

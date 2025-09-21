import { UserRole, UserStatus, SubscriptionPlan, User } from '@/types/auth'

// Mock данные для демонстрации
export const mockUsers = [
  {
    id: '1',
    telegramId: '123456789',
    username: 'john_doe',
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isVerified: true,
    subscriptionPlan: SubscriptionPlan.PRO,
    language: 'ru',
    timezone: 'Europe/Moscow',
    notificationPrefs: {
      email: true,
      push: true,
      sms: false
    },
    lastLoginAt: new Date().toISOString(),
    loginCount: 42,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    telegramId: '987654321',
    username: 'jane_smith',
    firstName: 'Анна',
    lastName: 'Петрова',
    email: 'anna@example.com',
    role: UserRole.CREATOR,
    status: UserStatus.ACTIVE,
    isVerified: true,
    subscriptionPlan: SubscriptionPlan.PREMIUM,
    language: 'ru',
    timezone: 'Europe/Moscow',
    notificationPrefs: {
      email: true,
      push: true,
      sms: false
    },
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    loginCount: 15,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    telegramId: '555666777',
    username: 'student1',
    firstName: 'Петр',
    lastName: 'Сидоров',
    email: 'petr@example.com',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    isVerified: false,
    subscriptionPlan: SubscriptionPlan.FREE,
    language: 'ru',
    timezone: 'Europe/Moscow',
    notificationPrefs: {
      email: true,
      push: true,
      sms: false
    },
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    loginCount: 8,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    telegramId: '111222333',
    username: 'banned_user',
    firstName: 'Заблокированный',
    lastName: 'Пользователь',
    email: 'banned@example.com',
    role: UserRole.STUDENT,
    status: UserStatus.BANNED,
    isVerified: false,
    subscriptionPlan: SubscriptionPlan.FREE,
    language: 'ru',
    timezone: 'Europe/Moscow',
    lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    loginCount: 3,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const mockUserStats = {
  totalUsers: 150,
  activeUsers: 120,
  newUsersToday: 5,
  usersByRole: {
    [UserRole.STUDENT]: 120,
    [UserRole.CREATOR]: 25,
    [UserRole.ADMIN]: 5,
  },
  usersByStatus: {
    [UserStatus.ACTIVE]: 120,
    [UserStatus.INACTIVE]: 25,
    [UserStatus.BANNED]: 5,
  },
  usersBySubscription: {
    [SubscriptionPlan.FREE]: 100,
    [SubscriptionPlan.PREMIUM]: 35,
    [SubscriptionPlan.PRO]: 15,
  },
}

// Mock API функции
export const mockApi = {
  getUsers: async (params: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Имитация задержки
    
    const { page = 1, limit = 20, search, role } = params
    let filteredUsers = [...mockUsers]
    
    // Фильтрация по поиску
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Фильтрация по роли
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }
    
    // Пагинация
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)
    
    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      pages: Math.ceil(filteredUsers.length / limit),
    }
  },
  
  getUserStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockUserStats
  },
  
  updateUserRole: async (userId: string, role: UserRole): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      user.role = role
      user.updatedAt = new Date().toISOString()
      return user as User
    }
    
    throw new Error('User not found')
  },
  
  banUser: async (userId: string, _reason?: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      user.status = UserStatus.BANNED
      user.updatedAt = new Date().toISOString()
      return user as User
    }
    
    throw new Error('User not found')
  },
  
  unbanUser: async (userId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      user.status = UserStatus.ACTIVE
      user.updatedAt = new Date().toISOString()
      return user as User
    }
    
    throw new Error('User not found')
  },
  
  generateServiceToken: async (_serviceName: string, _permissions: string[]) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const token = `service_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      token,
      expiresIn: 3600,
    }
  },
  
  cleanupExpiredSessions: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      deletedSessions: Math.floor(Math.random() * 50) + 10,
    }
  },
}

export interface User {
  id: string
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  role: UserRole
  subscription: SubscriptionType
  permissions: string[]
  isActive: boolean
  isBanned: boolean
  banReason?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT',
}

export enum SubscriptionType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  PRO = 'PRO',
}

export interface LoginRequest {
  initData: string
  deviceInfo: {
    userAgent: string
    platform: string
    version: string
  }
  ipAddress?: string
  userAgent?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UserSession {
  id: string
  deviceInfo: {
    userAgent: string
    platform: string
    version: string
  }
  ipAddress: string
  location?: string
  isCurrentSession: boolean
  lastActiveAt: string
  createdAt: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  usersByRole: Record<UserRole, number>
  usersBySubscription: Record<SubscriptionType, number>
}

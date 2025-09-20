// User roles enum
export enum UserRole {
  STUDENT = 'STUDENT',
  CREATOR = 'CREATOR', 
  ADMIN = 'ADMIN'
}

// User status enum
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED'
}

// Subscription plans enum
export enum SubscriptionPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PRO = 'PRO'
}

// User interface
export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: string;
  subscriptionCanceledAt?: string;
  language: string;
  timezone: string;
  notificationPrefs: Record<string, any>;
  lastLoginAt?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

// Auth requests and responses
export interface LoginRequest {
  initData: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    version: string;
    isTelegramWebApp?: boolean;
  };
  ipAddress: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// User session
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
}

// User statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  usersByRole: {
    [key in UserRole]: number;
  };
  usersByStatus: {
    [key in UserStatus]: number;
  };
  usersBySubscription: {
    [key in SubscriptionPlan]: number;
  };
}

// Permission system
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Auth context types
export interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authSource: 'telegram' | 'stored_tokens' | 'none' | null;
}

// Telegram WebApp types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  auth_date?: number;
  hash?: string;
}

// Auth error types
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED', 
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_BANNED = 'USER_BANNED',
  USER_INACTIVE = 'USER_INACTIVE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TELEGRAM_AUTH_FAILED = 'TELEGRAM_AUTH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Auth configuration
export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  userDataStorageKey: string;
  autoRefreshEnabled: boolean;
  refreshTokenThreshold: number; // seconds before expiry to refresh
}

// Device info for login tracking
export interface DeviceInfo {
  userAgent: string;
  platform: 'web' | 'mobile' | 'desktop';
  version: string;
  isTelegramWebApp?: boolean;
  language?: string;
  timezone?: string;
}

// Auth hooks return types
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authSource: 'telegram' | 'stored_tokens' | 'none' | null;
  login: (initData: string) => Promise<void>;
  autoLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isTelegramWebApp: () => boolean;
}

export interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean;
  isLoading: boolean;
}

// Form validation schemas
export interface LoginFormData {
  initData: string;
  remember: boolean;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  notificationPrefs?: Record<string, any>;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: AuthError[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Advanced auth features
export interface TwoFactorAuth {
  enabled: boolean;
  method: 'sms' | 'email' | 'app';
  backupCodes?: string[];
}

export interface SecuritySettings {
  twoFactorAuth: TwoFactorAuth;
  sessionTimeout: number; // minutes
  ipWhitelist?: string[];
  deviceLimit?: number;
  requireReauthForSensitive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default User
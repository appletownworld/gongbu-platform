import { useState, useEffect } from 'react';

interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check URL parameters for fresh session flag
    const urlParams = new URLSearchParams(window.location.search);
    const freshSession = urlParams.get('fresh') === 'true';
    
    if (freshSession) {
      console.log('🧹 Параметр fresh=true - очищаем все данные для нового сеанса');
      localStorage.clear();
      sessionStorage.clear();
      
      // Remove fresh parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('fresh');
      window.history.replaceState({}, '', newUrl.toString());
      console.log('✅ Данные очищены, готов к новой регистрации');
    }
    
    // Check if user is already authenticated
    const savedUser = localStorage.getItem('gongbu_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('👤 Найден сохраненный пользователь:', userData.first_name, userData.id);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Автоматический вход для существующего пользователя');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('gongbu_user');
      }
    } else {
      console.log('🔍 Сохраненный пользователь не найден - ожидаем автоматическую регистрацию');
    }
  }, []);

  const login = async (initData: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would send initData to your backend
      // to verify the Telegram WebApp data and get user information
      
      // For now, we'll parse the initData locally (this is not secure for production)
      const urlParams = new URLSearchParams(initData);
      const userParam = urlParams.get('user');
      
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('📋 Данные пользователя получены:', userData);
        
        // Check if user exists in our system (localStorage for demo)
        const existingUsers = JSON.parse(localStorage.getItem('gongbu_users') || '{}');
        const userId = userData.id.toString();
        const isNewUser = !existingUsers[userId];
        
        console.log('🔍 Проверка пользователя:', {
          userId,
          isNewUser,
          existingUsersCount: Object.keys(existingUsers).length
        });
        
        if (isNewUser) {
          // New user - register them
          console.log('🆕 Новый пользователь! Регистрируем:', userData.first_name);
          
          // Add registration timestamp and additional info
          const newUserData = {
            ...userData,
            registeredAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            isNewUser: true,
            coursesCompleted: 0,
            preferredLanguage: userData.language_code || 'en'
          };
          
          // Save to users database (localStorage for demo)
          existingUsers[userId] = newUserData;
          localStorage.setItem('gongbu_users', JSON.stringify(existingUsers));
          
          // Set current user
          setUser(newUserData);
          setIsAuthenticated(true);
          localStorage.setItem('gongbu_user', JSON.stringify(newUserData));
          
          // Show welcome feedback for new users
          if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
          }
          
          console.log('✅ Пользователь успешно зарегистрирован!');
        } else {
          // Existing user - just login
          console.log('👋 Добро пожаловать обратно:', userData.first_name);
          
          // Update last login time
          const existingUserData = {
            ...existingUsers[userId],
            lastLoginAt: new Date().toISOString(),
            isNewUser: false
          };
          
          // Update in database
          existingUsers[userId] = existingUserData;
          localStorage.setItem('gongbu_users', JSON.stringify(existingUsers));
          
          // Set current user
          setUser(existingUserData);
          setIsAuthenticated(true);
          localStorage.setItem('gongbu_user', JSON.stringify(existingUserData));
          
          // Show light feedback for returning users
          if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          }
          
          console.log('✅ Пользователь успешно вошел в систему!');
        }
      } else {
        throw new Error('Invalid init data');
      }
    } catch (error) {
      console.error('Login/Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('gongbu_user');
    
    // Show feedback
    if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};
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
    // Check if user is already authenticated
    const savedUser = localStorage.getItem('gongbu_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('gongbu_user');
      }
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
        
        // Save user data
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('gongbu_user', JSON.stringify(userData));
        
        // Show success feedback
        if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } else {
        throw new Error('Invalid init data');
      }
    } catch (error) {
      console.error('Login error:', error);
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
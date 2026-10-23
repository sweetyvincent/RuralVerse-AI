import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher';
    preferred_language?: string;
    grade?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ruralverse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('ruralverse_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    // If it's a static demo token, preserve saved user
    if (token === 'demo_jwt_token_for_static_preview') {
      const saved = localStorage.getItem('ruralverse_user');
      if (saved) setUser(JSON.parse(saved));
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      localStorage.setItem('ruralverse_user', JSON.stringify(profile));
    } catch (err: any) {
      // In case backend is temporarily unreachable on static demo / GitHub Pages
      const saved = localStorage.getItem('ruralverse_user');
      const isStaticOrUnreachable =
        !err.response ||
        [404, 405, 500, 502, 503, 504].includes(err.response?.status) ||
        window.location.hostname.includes('github.io');

      if (saved && isStaticOrUnreachable) {
        setUser(JSON.parse(saved));
      } else {
        localStorage.removeItem('ruralverse_token');
        localStorage.removeItem('ruralverse_user');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // If running on GitHub Pages (static hosting with no live backend server attached)
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

    if (isGitHubPages) {
      let fallbackRole: 'admin' | 'teacher' | 'student' = 'student';
      let fallbackName = 'Arun Kumar';

      const emailLower = (email || '').toLowerCase();
      if (emailLower.includes('admin')) {
        fallbackRole = 'admin';
        fallbackName = 'Platform Administrator';
      } else if (emailLower.includes('teacher') || emailLower.includes('curriculum')) {
        fallbackRole = 'teacher';
        fallbackName = 'Dr. Meenakshi Sundaram';
      }

      const fallbackUser: User = {
        id: fallbackRole === 'admin' ? 2 : fallbackRole === 'teacher' ? 3 : 4,
        email: email || `${fallbackRole}@ruralverse.org`,
        full_name: fallbackName,
        role: fallbackRole,
        preferred_language: 'ta',
        grade: fallbackRole === 'student' ? '8th Grade' : undefined,
        is_active: true,
      };
      localStorage.setItem('ruralverse_token', 'demo_jwt_token_for_static_preview');
      localStorage.setItem('ruralverse_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('ruralverse_token', response.access_token);
      localStorage.setItem('ruralverse_user', JSON.stringify(response.user));
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      // If backend is unreachable (offline, GitHub Pages static hosting, 405 Not Allowed, or Vite proxy 500/502/504)
      const isOfflineOrStatic =
        !err.response ||
        [404, 405, 500, 502, 503, 504].includes(err.response?.status) ||
        err.code === 'ERR_NETWORK' ||
        window.location.hostname.includes('github.io');

      if (isOfflineOrStatic) {
        let fallbackRole: 'admin' | 'teacher' | 'student' = 'student';
        let fallbackName = 'Arun Kumar';

        const emailLower = (email || '').toLowerCase();
        if (emailLower.includes('admin')) {
          fallbackRole = 'admin';
          fallbackName = 'Platform Administrator';
        } else if (emailLower.includes('teacher') || emailLower.includes('curriculum')) {
          fallbackRole = 'teacher';
          fallbackName = 'Dr. Meenakshi Sundaram';
        }

        const fallbackUser: User = {
          id: fallbackRole === 'admin' ? 2 : fallbackRole === 'teacher' ? 3 : 4,
          email: email || `${fallbackRole}@ruralverse.org`,
          full_name: fallbackName,
          role: fallbackRole,
          preferred_language: 'ta',
          grade: fallbackRole === 'student' ? '8th Grade' : undefined,
          is_active: true,
        };
        localStorage.setItem('ruralverse_token', 'demo_jwt_token_for_static_preview');
        localStorage.setItem('ruralverse_user', JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        return fallbackUser;
      }
      throw err;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher';
    preferred_language?: string;
    grade?: string;
  }): Promise<User> => {
    const newUser = await authService.register(data);
    return newUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Auth context logout error caught:', err);
    } finally {
      localStorage.removeItem('ruralverse_token');
      localStorage.removeItem('ruralverse_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

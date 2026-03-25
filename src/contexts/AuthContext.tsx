import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

type AuthMode = 'admin' | 'client';

interface AuthState {
  isAuthenticated: boolean;
  mode: AuthMode | null;
  projectId: string | null;
  projectName: string | null;
}

interface AuthContextType extends AuthState {
  login: (mode: AuthMode, projectId?: string, projectName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'tina-360-auth';

function loadStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.isAuthenticated && parsed.mode) {
        return parsed;
      }
    }
  } catch {
    // Invalid stored data
  }
  return { isAuthenticated: false, mode: null, projectId: null, projectName: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>(loadStoredAuth);

  const login = useCallback((mode: AuthMode, projectId?: string, projectName?: string) => {
    const state: AuthState = {
      isAuthenticated: true,
      mode,
      projectId: projectId ?? null,
      projectName: projectName ?? null,
    };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const logout = useCallback(() => {
    const state: AuthState = {
      isAuthenticated: false,
      mode: null,
      projectId: null,
      projectName: null,
    };
    setAuth(state);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

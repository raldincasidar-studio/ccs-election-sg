import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, Student } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  updateStudentAuth: (student: Student) => void;
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function loadStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem('election_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(loadStoredAuth);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const setAuthUser = useCallback((user: AuthUser | null) => {
    setAuthUserState(user);
    if (user) {
      localStorage.setItem('election_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('election_user');
      localStorage.removeItem('election_token');
    }
  }, []);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateStudentAuth = useCallback((student: Student) => {
    const newAuth: AuthUser = { type: 'student', data: student };
    setAuthUserState(newAuth);
    localStorage.setItem('election_user', JSON.stringify(newAuth));
  }, []);

  return (
    <AppContext.Provider
      value={{ authUser, setAuthUser, updateStudentAuth, toasts, showToast, removeToast }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

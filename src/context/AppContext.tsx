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

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
    setAuthUser({ type: 'student', data: student });
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

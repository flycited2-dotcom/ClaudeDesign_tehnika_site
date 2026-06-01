import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '../../lib/api';
import { tokenStorage } from '../../lib/token-storage';

export type User = {
  id: number;
  name: string;
  phone: string;
  telegram?: string;
  role?: string;
  created_at?: string;
};

type SessionContextValue = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string, telegram: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await api<{ user: User }>('profile');
      setUser(result.user);
    } catch {
      await tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      refreshProfile,
      login: async (phone, password) => {
        const result = await api<{ token: string; user: User }>('login', {
          method: 'POST',
          body: JSON.stringify({ phone, password }),
        });
        await tokenStorage.set(result.token);
        setUser(result.user);
      },
      register: async (name, phone, password, telegram) => {
        const result = await api<{ token: string; user: User }>('register', {
          method: 'POST',
          body: JSON.stringify({ name, phone, password, telegram }),
        });
        await tokenStorage.set(result.token);
        setUser(result.user);
      },
      logout: async () => {
        try {
          await api('logout', { method: 'POST' });
        } finally {
          await tokenStorage.clear();
          setUser(null);
        }
      },
    }),
    [loading, refreshProfile, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}

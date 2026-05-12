import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { AuthSession, FirstAccessState } from '@/types/auth';
import {
  getStoredItem,
  removeStoredItem,
  setStoredItem,
} from '@/services/session-storage';

const SESSION_STORAGE_KEY = '@tecarral/session';

type AuthContextValue = {
  isHydrating: boolean;
  session: AuthSession | null;
  firstAccess: FirstAccessState | null;
  completeSignIn: (session: AuthSession) => Promise<void>;
  updateSessionUser: (user: AuthSession['user']) => Promise<void>;
  startFirstAccess: (state: FirstAccessState) => void;
  clearFirstAccess: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [firstAccess, setFirstAccess] = useState<FirstAccessState | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const rawSession = await getStoredItem(SESSION_STORAGE_KEY);

        if (!rawSession || !isMounted) {
          return;
        }

        setSession(JSON.parse(rawSession) as AuthSession);
      } catch {
        if (isMounted) {
          await removeStoredItem(SESSION_STORAGE_KEY);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrating,
      session,
      firstAccess,
      async completeSignIn(nextSession) {
        await setStoredItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        setFirstAccess(null);
        setSession(nextSession);
      },
      async updateSessionUser(nextUser) {
        setSession((current) => {
          if (!current) {
            return current;
          }

          const nextSession = {
            ...current,
            user: nextUser,
          };

          void setStoredItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
          return nextSession;
        });
      },
      startFirstAccess(state) {
        void removeStoredItem(SESSION_STORAGE_KEY);
        setSession(null);
        setFirstAccess(state);
      },
      clearFirstAccess() {
        setFirstAccess(null);
      },
      async signOut() {
        await removeStoredItem(SESSION_STORAGE_KEY);
        setFirstAccess(null);
        setSession(null);
      },
    }),
    [firstAccess, isHydrating, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}

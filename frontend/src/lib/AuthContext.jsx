import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .get('/auth/me')
      .then(setUser)
      .catch(logout)
      .finally(() => setReady(true));
  }, [logout]);

  const startSession = useCallback(({ token, user: sessionUser }) => {
    tokenStore.set(token);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      logout,
      login: async (username, password) => startSession(await api.post('/auth/login', { username, password })),
      demoLogin: async (username) => startSession(await api.post('/auth/demo-login', { username })),
      register: async (data) => startSession(await api.post('/auth/register', data)),
      is: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, ready, logout, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

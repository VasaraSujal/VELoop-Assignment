import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { giveawayService } from '../services/giveawayService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({ VEs: 0, SVEs: 0, Tokens: 0 });
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  // Fetch live profile & balance using stored token
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('veloop_token');
    if (!token) {
      setUser(null);
      setBalances({ VEs: 0, SVEs: 0, Tokens: 0 });
      setLoading(false);
      return;
    }

    try {
      const data = await giveawayService.getMe();
      if (data) {
        setUser(data);
        setBalances(data.balances || { VEs: 0, SVEs: 0, Tokens: 0 });
      }
    } catch (_err) {
      // If token is invalid or expired, clear it
      localStorage.removeItem('veloop_token');
      setUser(null);
      setBalances({ VEs: 0, SVEs: 0, Tokens: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available demo users for reviewer testing
  const loadDemoUsers = useCallback(async () => {
    try {
      const list = await giveawayService.getDemoUsers();
      if (Array.isArray(list)) {
        setDemoUsers(list);
      }
    } catch (_err) {
      // Non-critical if offline
    }
  }, []);

  useEffect(() => {
    loadDemoUsers();
    // Default to logging in as demo user Alex on first start if no token exists
    const token = localStorage.getItem('veloop_token');
    if (!token) {
      giveawayService
        .demoLogin('user_alex')
        .then((res) => {
          if (res?.token) {
            localStorage.setItem('veloop_token', res.token);
            setUser(res.user);
            setBalances(res.user?.balances || { VEs: 1500, SVEs: 1000, Tokens: 5000 });
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      refreshProfile();
    }
  }, [refreshProfile, loadDemoUsers]);

  const login = async (userId) => {
    setLoading(true);
    try {
      const res = await giveawayService.demoLogin(userId);
      if (res?.token) {
        localStorage.setItem('veloop_token', res.token);
        setUser(res.user);
        setBalances(res.user?.balances || { VEs: 0, SVEs: 0, Tokens: 0 });
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('veloop_token');
    setUser(null);
    setBalances({ VEs: 0, SVEs: 0, Tokens: 0 });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        balances,
        isAuthenticated: Boolean(user && user.userId),
        loading,
        demoUsers,
        login,
        logout,
        refreshBalance: refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

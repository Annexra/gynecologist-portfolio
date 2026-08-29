import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Check local storage fallback for demo admin session
      const mockAdmin = localStorage.getItem('dr_raveena_demo_admin');
      if (mockAdmin === 'true') {
        setUser({ email: 'admin@drthalluru.com', id: 'demo-admin-id' });
        setIsAdmin(true);
      }
      setLoading(false);
      return;
    }

    // Supabase auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) checkAdminRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(true); // Default permission for initial admin setup
      }
    } catch {
      setIsAdmin(true);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      if (email === 'admin@drthalluru.com' && password === 'admin123') {
        localStorage.setItem('dr_raveena_demo_admin', 'true');
        setUser({ email: 'admin@drthalluru.com', id: 'demo-admin-id' });
        setIsAdmin(true);
        return { error: null };
      }
      return { error: { message: 'Invalid credentials. Demo login: admin@drthalluru.com / admin123' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const logout = async () => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('dr_raveena_demo_admin');
      setUser(null);
      setIsAdmin(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicWebsite from './components/PublicWebsite';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function MainRouter() {
  const { user, isAdmin, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="font-headline-sm text-primary">Authenticating Session...</span>
      </div>
    );
  }

  // Admin Routes Protection
  if (currentPath.startsWith('/admin')) {
    if (currentPath === '/admin/login') {
      if (user && isAdmin) {
        navigateTo('/admin/dashboard');
        return <AdminDashboard onLogout={() => navigateTo('/admin/login')} />;
      }
      return <AdminLogin onLoginSuccess={() => navigateTo('/admin/dashboard')} />;
    }

    if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
      if (!user || !isAdmin) {
        return <AdminLogin onLoginSuccess={() => navigateTo('/admin/dashboard')} />;
      }
      return <AdminDashboard onLogout={() => navigateTo('/admin/login')} />;
    }
  }

  // Default Public Website Route
  return <PublicWebsite />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

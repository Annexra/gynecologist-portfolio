import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@drthalluru.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        setError(loginError.message);
      } else if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-xl border border-outline-variant/30 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary-container mx-auto flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-on-primary-container text-2xl">admin_panel_settings</span>
          </div>
          <h1 className="font-display-lg text-primary text-3xl">Dr. Raveena Thallur</h1>
          <p className="font-body-md text-on-surface-variant text-sm">Protected Administrator Authentication</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-lg">error</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-label-md text-on-surface text-xs font-semibold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary text-sm"
              placeholder="admin@drthalluru.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-label-md text-on-surface text-xs font-semibold uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:border-primary text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-on-primary font-label-md rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-outline-variant/30 text-center">
          <a href="/" className="font-body-sm text-secondary hover:text-primary text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Public Website</span>
          </a>
        </div>
      </div>
    </div>
  );
}

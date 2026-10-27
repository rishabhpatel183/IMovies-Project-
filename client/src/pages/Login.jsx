import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Welcome back to iMovies!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setBusy(false);
    }
  }

  // Quick fill helper for testing
  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-card">
      <div className="text-center mb-4">
        <span className="fs-1">🎬</span>
        <h1 className="h3 fw-bold mt-2">Welcome Back</h1>
        <p className="text-secondary small">Sign in to manage and view your movie bookings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small text-secondary">Email address</label>
          <input
            required
            type="email"
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label small text-secondary">Password</label>
          <input
            required
            type="password"
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-danger w-100 py-2 fw-bold" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo Credentials Box */}
      <div className="mt-4 p-3 bg-dark bg-opacity-50 border border-secondary rounded-3 text-secondary small">
        <div className="fw-bold text-light mb-1">Quick Demo Accounts:</div>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span>Admin: admin@imovies.com</span>
          <button
            type="button"
            className="btn btn-link btn-sm text-danger p-0"
            onClick={() => fillCredentials('admin@imovies.com', 'Admin@12345')}
          >
            Auto-fill
          </button>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>User: user@imovies.com</span>
          <button
            type="button"
            className="btn btn-link btn-sm text-danger p-0"
            onClick={() => fillCredentials('user@imovies.com', 'User@12345')}
          >
            Auto-fill
          </button>
        </div>
      </div>

      <p className="mt-4 mb-0 text-center text-secondary small">
        Don't have an account?{' '}
        <Link to="/register" className="text-danger fw-semibold">
          Create one now
        </Link>
      </p>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      toast.warning('Password must be at least 8 characters long.');
      return;
    }

    setBusy(true);
    try {
      await register(name, email, password);
      toast.success('Account created successfully! Welcome aboard.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-4">
        <span className="fs-1">🎟️</span>
        <h1 className="h3 fw-bold mt-2">Create Account</h1>
        <p className="text-secondary small">Join iMovies to book seats and track reservations.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small text-secondary">Full Name</label>
          <input
            required
            maxLength="80"
            className="form-control"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
          <label className="form-label small text-secondary">Password (8+ characters)</label>
          <input
            required
            minLength="8"
            type="password"
            className="form-control"
            placeholder="Create a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-danger w-100 py-2 fw-bold" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <p className="mt-4 mb-0 text-center text-secondary small">
        Already have an account?{' '}
        <Link to="/login" className="text-danger fw-semibold">
          Sign In
        </Link>
      </p>
    </div>
  );
}

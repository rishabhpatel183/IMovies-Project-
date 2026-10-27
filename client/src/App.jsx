import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import MoviePage from './pages/MoviePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Bookings from './pages/Bookings';
import Admin from './pages/Admin';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbg sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span>🎬</span>
          <span>iMovies</span>
        </Link>

        <div className="d-flex gap-3 align-items-center">
          <Link className="nav-link" to="/">
            Movies
          </Link>

          {user && (
            <Link className="nav-link" to="/bookings">
              My Bookings
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link className="nav-link badge bg-danger text-light px-2 py-1" to="/admin">
              Admin Portal
            </Link>
          )}

          {user ? (
            <div className="d-flex align-items-center gap-2 ms-2">
              <span className="text-secondary small d-none d-md-inline">
                Hi, <strong>{user.name.split(' ')[0]}</strong>
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 ms-2">
              <Link className="btn btn-outline-light btn-sm" to="/login">
                Login
              </Link>
              <Link className="btn btn-danger btn-sm" to="/register">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies/:id" element={<MoviePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="text-center py-5">
                <h2 className="fw-bold">404 - Page not found</h2>
                <p className="text-secondary">The page you were looking for does not exist.</p>
                <Link className="btn btn-danger mt-2" to="/">
                  Back to Movies
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="text-center py-4 text-secondary">
        <p className="mb-1">🎬 iMovies Cinema Ticketing Platform</p>
        <small>Built with React 18, Vite, Express, Node.js, Socket.IO & MongoDB</small>
      </footer>
    </>
  );
}

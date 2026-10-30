import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Admin() {
  const { user } = useAuth();

  const [tab, setTab] = useState('analytics');
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states - Movie
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [director, setDirector] = useState('Christopher Nolan');
  const [producers, setProducers] = useState('Emma Thomas');
  const [castInput, setCastInput] = useState('Christian Bale as Bruce Wayne, Heath Ledger as Joker');
  const [genres, setGenres] = useState('Action, Sci-Fi');
  const [languages, setLanguages] = useState('Hindi, English');
  const [durationMinutes, setDuration] = useState(135);
  const [rating, setRating] = useState(8.5);
  const [certificate, setCertificate] = useState('U/A');

  // Form states - Theatre
  const [theatreName, setTheatreName] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [screens, setScreens] = useState('Screen 1, Screen 2, IMAX');
  const [facilities, setFacilities] = useState('Dolby Atmos, Recliner Seats, Parking');

  // Form states - Show
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedTheatre, setSelectedTheatre] = useState('');
  const [screenName, setScreenName] = useState('Screen 1');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [price, setPrice] = useState(250);
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);

  const [busy, setBusy] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [mRes, tRes, aRes] = await Promise.all([
        api.get('/movies?limit=100'),
        api.get('/theatres'),
        api.get('/admin/analytics').catch(() => ({ data: null })),
      ]);
      setMovies(mRes.data.items);
      setTheatres(tRes.data);
      if (aRes?.data) {
        setAnalytics(aRes.data);
      }

      if (mRes.data.items.length > 0 && !selectedMovie) {
        setSelectedMovie(mRes.data.items[0]._id);
      }
      if (tRes.data.length > 0 && !selectedTheatre) {
        setSelectedTheatre(tRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load admin catalog');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="auth-card text-center">
        <h4>Authentication Required</h4>
        <p className="text-secondary">Please log in with an administrator account to access this portal.</p>
        <Link to="/login" className="btn btn-danger">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="empty text-center py-5">
        <span className="fs-1 d-block mb-2">🔒</span>
        <h3>Admin Access Restricted</h3>
        <p className="text-secondary">
          Your current account (<strong>{user.email}</strong>) does not have administrator privileges.
        </p>
        <Link to="/" className="btn btn-outline-light">
          Return to Home
        </Link>
      </div>
    );
  }

  async function handleAddMovie(e) {
    e.preventDefault();
    setBusy(true);

    const parsedCast = castInput
      .split(',')
      .map((item) => {
        const parts = item.split(' as ');
        return {
          name: parts[0]?.trim() || '',
          role: parts[1]?.trim() || '',
        };
      })
      .filter((c) => c.name);

    try {
      await api.post('/movies', {
        title,
        description,
        posterUrl,
        trailerUrl,
        director,
        producers: producers.split(',').map((s) => s.trim()).filter(Boolean),
        cast: parsedCast,
        genres: genres.split(',').map((s) => s.trim()).filter(Boolean),
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        durationMinutes: Number(durationMinutes),
        rating: Number(rating),
        certificate,
      });

      toast.success(`Movie "${title}" created successfully!`);
      setTitle('');
      setDescription('');
      setPosterUrl('');
      setTrailerUrl('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTheatre(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/theatres', {
        name: theatreName,
        location,
        city,
        screens: screens.split(',').map((s) => s.trim()).filter(Boolean),
        facilities: facilities.split(',').map((s) => s.trim()).filter(Boolean),
      });

      toast.success(`Theatre "${theatreName}" added in ${city}!`);
      setTheatreName('');
      setLocation('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add theatre');
    } finally {
      setBusy(false);
    }
  }

  async function handleScheduleShow(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const calculatedEnd = endsAt
        ? new Date(endsAt).toISOString()
        : new Date(new Date(startsAt).getTime() + 150 * 60000).toISOString();

      await api.post('/shows', {
        movie: selectedMovie,
        theatre: selectedTheatre,
        screen: screenName,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: calculatedEnd,
        price: Number(price),
        rows: Number(rows),
        cols: Number(cols),
      });

      toast.success('New show scheduled successfully!');
      setStartsAt('');
      setEndsAt('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="eyebrow">CONTROL PANEL</span>
          <h1 className="h3 fw-bold mt-1">Admin Dashboard</h1>
          <p className="text-secondary mb-0">
            Manage movie catalogue, cinema branches, screens, and scheduled showtimes.
          </p>
        </div>
        <span className="badge bg-danger px-3 py-2">Logged in as Admin</span>
      </div>

      {/* Tabs */}
      <div className="btn-group mb-4 flex-wrap gap-1">
        <button
          className={`btn ${tab === 'analytics' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setTab('analytics')}
        >
          📊 Revenue & Analytics
        </button>
        <button
          className={`btn ${tab === 'movie' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setTab('movie')}
        >
          🎬 Add Movie
        </button>
        <button
          className={`btn ${tab === 'theatre' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setTab('theatre')}
        >
          🏛️ Add Theatre
        </button>
        <button
          className={`btn ${tab === 'show' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setTab('show')}
        >
          🕒 Schedule Show
        </button>
        <button
          className={`btn ${tab === 'overview' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => setTab('overview')}
        >
          📋 Overview ({movies.length} movies, {theatres.length} theatres)
        </button>
      </div>

      <div className="admin-card">
        {/* TAB 0: ANALYTICS & REVENUE */}
        {tab === 'analytics' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h2 className="h5 fw-bold mb-1 text-light">Multiplex Revenue & Operational Analytics</h2>
                <p className="text-secondary small mb-0">
                  Real-time ticket sales, gross revenue, food & beverage breakdown, and customer audit trail.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
                onClick={loadData}
              >
                <span>🔄</span> Refresh Analytics
              </button>
            </div>

            {/* 4 Top KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-50 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase">Gross Revenue</span>
                    <span className="fs-5">💰</span>
                  </div>
                  <div className="h3 fw-bold text-success mb-1">
                    ₹{(analytics?.summary?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <small className="text-secondary">Across all cinema branches</small>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-50 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase">Tickets Sold</span>
                    <span className="fs-5">🎟️</span>
                  </div>
                  <div className="h3 fw-bold text-light mb-1">
                    {(analytics?.summary?.totalTicketsSold || 0).toLocaleString()}
                  </div>
                  <small className="text-secondary">
                    From {analytics?.summary?.totalBookings || 0} completed bookings
                  </small>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-50 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase">F&B Snack Sales</span>
                    <span className="fs-5">🍿</span>
                  </div>
                  <div className="h3 fw-bold text-warning mb-1">
                    ₹{(analytics?.summary?.totalSnacksRevenue || 0).toLocaleString()}
                  </div>
                  <small className="text-secondary">Cinema concessions & combos</small>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-50 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase">Promo Savings</span>
                    <span className="fs-5">🏷️</span>
                  </div>
                  <div className="h3 fw-bold text-danger mb-1">
                    ₹{(analytics?.summary?.totalDiscountGiven || 0).toLocaleString()}
                  </div>
                  <small className="text-secondary">Discounts through coupons</small>
                </div>
              </div>
            </div>

            {/* Middle Section: Top Grossing Movies & City Breakdown */}
            <div className="row g-4 mb-4">
              {/* Top Movies Leaderboard */}
              <div className="col-12 col-lg-7">
                <div className="p-3 p-sm-4 rounded-3 bg-dark bg-opacity-25 border border-secondary border-opacity-50 h-100">
                  <h3 className="h6 fw-bold text-light mb-3 d-flex align-items-center gap-2">
                    <span>🏆</span> Top Grossing Films Leaderboard
                  </h3>

                  {(!analytics?.topMovies || analytics.topMovies.length === 0) ? (
                    <p className="text-secondary small py-3 mb-0 text-center">
                      No movie sales recorded yet. Once bookings occur, top performers will rank here.
                    </p>
                  ) : (
                    <div className="d-grid gap-3">
                      {analytics.topMovies.map((m, idx) => {
                        const maxRev = analytics.topMovies[0]?.revenue || 1;
                        const pct = Math.round((m.revenue / maxRev) * 100);

                        return (
                          <div key={m.id} className="d-flex align-items-center gap-3">
                            <span className="fw-bold fs-5 text-secondary" style={{ width: '22px' }}>
                              #{idx + 1}
                            </span>
                            {m.posterUrl ? (
                              <img
                                src={m.posterUrl}
                                alt={m.title}
                                style={{
                                  width: '42px',
                                  height: '56px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '42px',
                                  height: '56px',
                                  background: '#334155',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                🎬
                              </div>
                            )}
                            <div className="flex-grow-1 overflow-hidden">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-light small text-truncate" title={m.title}>
                                  {m.title}
                                </span>
                                <span className="fw-bold text-success small">
                                  ₹{m.revenue.toLocaleString()}
                                </span>
                              </div>
                              <div
                                className="progress bg-secondary bg-opacity-25"
                                style={{ height: '6px' }}
                              >
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
                                <span>🎟️ {m.tickets} tickets</span>
                                <span>⭐ {m.rating}/10</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* City Revenue Distribution */}
              <div className="col-12 col-lg-5">
                <div className="p-3 p-sm-4 rounded-3 bg-dark bg-opacity-25 border border-secondary border-opacity-50 h-100">
                  <h3 className="h6 fw-bold text-light mb-3 d-flex align-items-center gap-2">
                    <span>📍</span> Sales by City / Multiplex
                  </h3>

                  {(!analytics?.cityDistribution || analytics.cityDistribution.length === 0) ? (
                    <p className="text-secondary small py-3 mb-0 text-center">
                      City analytics will populate once orders are placed.
                    </p>
                  ) : (
                    <div className="d-grid gap-3">
                      {analytics.cityDistribution.map((c) => {
                        const totalRev = analytics.summary.totalRevenue || 1;
                        const share = Math.round((c.revenue / totalRev) * 100);

                        return (
                          <div key={c.city}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-light small">
                                {c.city}
                              </span>
                              <span className="text-light-emphasis small">
                                ₹{c.revenue.toLocaleString()}{' '}
                                <small className="text-secondary">({share}%)</small>
                              </span>
                            </div>
                            <div
                              className="progress bg-secondary bg-opacity-25"
                              style={{ height: '6px' }}
                            >
                              <div
                                className="progress-bar bg-warning"
                                role="progressbar"
                                style={{ width: `${share}%` }}
                              ></div>
                            </div>
                            <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                              {c.tickets} seats booked
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings Audit Table */}
            <div>
              <h3 className="h6 fw-bold text-light mb-3 d-flex align-items-center gap-2">
                <span>🧾</span> Recent 10 Transactions & Audit Log
              </h3>
              {(!analytics?.recentBookings || analytics.recentBookings.length === 0) ? (
                <div className="p-4 text-center border border-secondary border-opacity-25 rounded-3">
                  <p className="text-secondary mb-0">No transaction records available yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover small align-middle mb-0">
                    <thead className="table-secondary text-dark">
                      <tr>
                        <th>Booking Code</th>
                        <th>Film & Screen</th>
                        <th>Customer</th>
                        <th>Seats</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Booked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentBookings.map((b) => (
                        <tr key={b._id}>
                          <td>
                            <span className="font-monospace fw-bold text-warning">
                              {b.bookingCode}
                            </span>
                          </td>
                          <td>
                            <strong className="text-light d-block text-truncate" style={{ maxWidth: '160px' }}>
                              {b.movieTitle}
                            </strong>
                            <small className="text-secondary">
                              {b.theatreName} ({b.city})
                            </small>
                          </td>
                          <td>
                            <span className="text-light d-block">{b.userName}</span>
                            <small className="text-secondary">{b.userEmail}</small>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                              {b.paymentMethod}
                            </span>
                            {b.discount > 0 && (
                              <small className="d-block text-danger">
                                -₹{b.discount} off
                              </small>
                            )}
                          </td>
                          <td>
                            <strong className="text-light fs-6">₹{b.amount}</strong>
                          </td>
                          <td className="text-secondary" style={{ fontSize: '0.75rem' }}>
                            {new Date(b.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: ADD MOVIE */}
        {tab === 'movie' && (
          <form onSubmit={handleAddMovie}>
            <h2 className="h5 fw-bold mb-3">Add New Film to Catalogue</h2>

            <div className="mb-3">
              <label className="form-label small text-secondary">Movie Title *</label>
              <input
                required
                className="form-control"
                placeholder="e.g. Gladiator II"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">Description / Plot Synopsis</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Brief summary of the film..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small text-secondary">Director *</label>
                <input
                  required
                  className="form-control"
                  placeholder="e.g. Christopher Nolan"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-secondary">Producers (comma-separated)</label>
                <input
                  className="form-control"
                  placeholder="e.g. Emma Thomas, Kevin Feige"
                  value={producers}
                  onChange={(e) => setProducers(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">Starring Cast (Format: Actor as Character, ...)</label>
              <input
                className="form-control"
                placeholder="e.g. Cillian Murphy as Oppenheimer, Emily Blunt as Kitty"
                value={castInput}
                onChange={(e) => setCastInput(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small text-secondary">Poster Image URL (TMDB / High-Res)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://image.tmdb.org/t/p/w780/..."
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-secondary">Trailer URL (YouTube)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label small text-secondary">Genres (comma-separated)</label>
                <input
                  className="form-control"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-secondary">Languages (comma-sep)</label>
                <input
                  className="form-control"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small text-secondary">Duration (mins)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={durationMinutes}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small text-secondary">Rating (0-10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="form-control"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>

              <div className="col-md-1">
                <label className="form-label small text-secondary">Cert</label>
                <input
                  className="form-control"
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-danger px-4" disabled={busy}>
              {busy ? 'Saving Movie...' : '+ Create Movie'}
            </button>
          </form>
        )}

        {/* TAB 2: ADD THEATRE */}
        {tab === 'theatre' && (
          <form onSubmit={handleAddTheatre}>
            <h2 className="h5 fw-bold mb-3">Add Cinema Theatre / Branch</h2>

            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="form-label small text-secondary">Cinema Brand / Name *</label>
                <input
                  required
                  className="form-control"
                  placeholder="e.g. Cinepolis IMAX: Forum Mall"
                  value={theatreName}
                  onChange={(e) => setTheatreName(e.target.value)}
                />
              </div>

              <div className="col-md-5">
                <label className="form-label small text-secondary">City / Region *</label>
                <select
                  required
                  className="form-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary">Address / Location Details *</label>
              <input
                required
                className="form-control"
                placeholder="e.g. Koramangala, Hosur Main Road, Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small text-secondary">Screens (comma-separated)</label>
                <input
                  className="form-control"
                  value={screens}
                  onChange={(e) => setScreens(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-secondary">Facilities (comma-separated)</label>
                <input
                  className="form-control"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-danger px-4" disabled={busy}>
              {busy ? 'Saving Theatre...' : '+ Create Theatre'}
            </button>
          </form>
        )}

        {/* TAB 3: SCHEDULE SHOW */}
        {tab === 'show' && (
          <form onSubmit={handleScheduleShow}>
            <h2 className="h5 fw-bold mb-3">Schedule a New Movie Showtime</h2>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small text-secondary">Select Movie *</label>
                <select
                  required
                  className="form-select"
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small text-secondary">Select Theatre *</label>
                <select
                  required
                  className="form-select"
                  value={selectedTheatre}
                  onChange={(e) => setSelectedTheatre(e.target.value)}
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} [{t.city || 'India'}] — {t.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label small text-secondary">Screen Name</label>
                <input
                  required
                  className="form-control"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary">Show Starts At *</label>
                <input
                  required
                  type="datetime-local"
                  className="form-control"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary">Show Ends At (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label small text-secondary">Ticket Price (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="form-control"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary">Seat Rows (A, B, C...)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  className="form-control"
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary">Seat Columns (1, 2, 3...)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-control"
                  value={cols}
                  onChange={(e) => setCols(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-danger px-4"
              disabled={busy || !movies.length || !theatres.length}
            >
              {busy ? 'Scheduling...' : '+ Schedule Show'}
            </button>

            {(!movies.length || !theatres.length) && (
              <p className="text-warning mt-2 small">
                ⚠️ You must create at least one movie and one theatre before scheduling shows.
              </p>
            )}
          </form>
        )}

        {/* TAB 4: OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <h2 className="h5 fw-bold mb-3">System Catalogue Overview</h2>

            <h3 className="h6 text-danger fw-bold mt-3">Movies ({movies.length})</h3>
            <div className="table-responsive">
              <table className="table table-dark table-hover small">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Director</th>
                    <th>Genres</th>
                    <th>Duration</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((m) => (
                    <tr key={m._id}>
                      <td className="fw-bold">{m.title}</td>
                      <td>{m.director || 'N/A'}</td>
                      <td>{m.genres?.join(', ')}</td>
                      <td>{m.durationMinutes} mins</td>
                      <td>⭐ {m.rating}</td>
                      <td>
                        <Link to={`/movies/${m._id}`} className="btn btn-outline-light btn-sm py-0">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="h6 text-danger fw-bold mt-4">Theatres ({theatres.length})</h3>
            <div className="table-responsive">
              <table className="table table-dark table-hover small">
                <thead>
                  <tr>
                    <th>Theatre Name</th>
                    <th>City</th>
                    <th>Location</th>
                    <th>Facilities</th>
                  </tr>
                </thead>
                <tbody>
                  {theatres.map((t) => (
                    <tr key={t._id}>
                      <td className="fw-bold">{t.name}</td>
                      <td>
                        <span className="badge bg-danger">{t.city || 'India'}</span>
                      </td>
                      <td>{t.location}</td>
                      <td>{t.facilities?.join(', ') || 'Standard'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

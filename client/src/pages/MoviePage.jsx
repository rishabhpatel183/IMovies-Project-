import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const SNACK_OPTIONS = [
  {
    id: 'caramel-popcorn',
    name: 'Jumbo Caramel Popcorn (300g)',
    desc: 'Freshly popped warm golden caramel crunch',
    price: 240,
    icon: '🍿',
    tag: 'Bestseller',
  },
  {
    id: 'cheese-popcorn',
    name: 'Cheese & Salted Popcorn Mix',
    desc: 'Double cheese burst gourmet seasoned popcorn',
    price: 220,
    icon: '🍿',
    tag: 'Popular',
  },
  {
    id: 'combo-duo',
    name: 'Couple Combo: 2 Popcorn + 2 Coke',
    desc: '2 Large Butter Popcorn & two 650ml chilled Cokes',
    price: 490,
    icon: '🥤',
    tag: 'Save ₹90',
  },
  {
    id: 'nachos-salsa',
    name: 'Crispy Nachos & Warm Cheese Dip',
    desc: 'Tortilla crisps with spicy jalapeno cheese & salsa',
    price: 210,
    icon: '🧀',
  },
  {
    id: 'cold-brew',
    name: 'Chilled Hazelnut Cold Coffee (450ml)',
    desc: 'Rich creamy roast blend served ice-cold',
    price: 160,
    icon: '☕',
  },
  {
    id: 'coke-large',
    name: 'Chilled Coca-Cola (650ml)',
    desc: 'Fountain dispenser chilled soft beverage',
    price: 130,
    icon: '🥤',
  },
];

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : null;
}

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');
  const [seats, setSeats] = useState([]);
  const [chosenSeats, setChosenSeats] = useState([]);
  const [selectedSnacks, setSelectedSnacks] = useState({});
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(true);

  // 1. Fetch movie details and shows
  async function loadShows() {
    try {
      const res = await api.get('/shows', { params: { movieId: id } });
      setShows(res.data);
      if (res.data.length > 0 && !selectedShow) {
        setSelectedShow(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load shows:', err);
    }
  }

  async function loadSeats(showId) {
    try {
      const res = await api.get(`/shows/${showId}/seats`);
      setSeats(res.data.seats);
      setChosenSeats([]);
    } catch (err) {
      toast.error('Could not load seat map');
    }
  }

  useEffect(() => {
    setLoadingMovie(true);
    api
      .get(`/movies/${id}`)
      .then((res) => {
        setMovie(res.data);
      })
      .catch(() => toast.error('Movie not found'))
      .finally(() => setLoadingMovie(false));

    loadShows();
  }, [id]);

  // 2. Real-time updates via Socket.IO
  useEffect(() => {
    if (!selectedShow) return;

    loadSeats(selectedShow._id);

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.emit('show:join', selectedShow._id);

    socket.on('seats:changed', (data) => {
      if (data.showId === selectedShow._id) {
        loadSeats(selectedShow._id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedShow?._id]);

  // Group shows by Theatre and extract unique cities
  const { availableCities, groupedShowsByTheatre } = useMemo(() => {
    const citiesSet = new Set(['All']);
    const theatreMap = new Map();

    shows.forEach((s) => {
      const t = s.theatre;
      const city = t?.city || 'Mumbai';
      citiesSet.add(city);

      if (selectedCity !== 'All' && city !== selectedCity) {
        return;
      }

      const tId = t?._id || 'unknown';
      if (!theatreMap.has(tId)) {
        theatreMap.set(tId, {
          theatre: t,
          shows: [],
        });
      }
      theatreMap.get(tId).shows.push(s);
    });

    return {
      availableCities: Array.from(citiesSet),
      groupedShowsByTheatre: Array.from(theatreMap.values()),
    };
  }, [shows, selectedCity]);

  // Toggle seat selection
  function handleSeatClick(code) {
    if (chosenSeats.includes(code)) {
      setChosenSeats((prev) => prev.filter((s) => s !== code));
    } else {
      if (chosenSeats.length >= 8) {
        toast.warning('You can select a maximum of 8 seats per booking.');
        return;
      }
      setChosenSeats((prev) => [...prev, code]);
    }
  }

  // Update snack quantity
  function updateSnackQty(id, delta) {
    setSelectedSnacks((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  }

  const snacksTotal = useMemo(() => {
    return Object.entries(selectedSnacks).reduce((sum, [id, qty]) => {
      const item = SNACK_OPTIONS.find((s) => s.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [selectedSnacks]);

  const ticketsTotal = chosenSeats.length * (selectedShow?.price || 0);
  const grandTotal = ticketsTotal + snacksTotal;

  // Confirm booking
  async function handleBook() {
    if (!user) {
      toast.info('Please log in to complete your booking.');
      navigate('/login');
      return;
    }

    if (!chosenSeats.length) {
      toast.info('Please select at least one seat.');
      return;
    }

    setBusy(true);
    try {
      // Step 1: Hold selected seats
      await api.post(`/shows/${selectedShow._id}/hold`, { seats: chosenSeats });

      // Step 2: Prepare snacks payload
      const snacksPayload = Object.entries(selectedSnacks)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const s = SNACK_OPTIONS.find((opt) => opt.id === id);
          return {
            name: s.name,
            price: s.price,
            quantity: qty,
          };
        });

      // Step 3: Finalize booking
      const res = await api.post(`/shows/${selectedShow._id}/book`, {
        seats: chosenSeats,
        snacks: snacksPayload,
      });

      toast.success(`Booking Confirmed! Code: ${res.data.booking.bookingCode}`);
      navigate('/bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      toast.error(msg);
      if (selectedShow) {
        loadSeats(selectedShow._id);
      }
    } finally {
      setBusy(false);
    }
  }

  if (loadingMovie) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="text-secondary mt-2">Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="empty text-center py-5">
        <h3>Movie not found</h3>
        <p className="text-secondary">This movie might have been removed or archived.</p>
        <Link to="/" className="btn btn-danger mt-2">
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Movie Poster & Metadata */}
      <div className="col-lg-4">
        {movie.posterUrl ? (
          <img
            className="detail-poster"
            src={movie.posterUrl}
            alt={movie.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="detail-poster poster-placeholder">🎬</div>
        )}

        {movie.trailerUrl && (
          <button
            type="button"
            onClick={() => setTrailerModalOpen(true)}
            className="btn btn-danger w-100 mt-3 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm"
          >
            <span>▶</span> Watch Official Trailer
          </button>
        )}

        {/* Director & Producer Side Panel */}
        <div className="crew-box mt-3">
          <div className="mb-2">
            <span className="text-secondary small d-block">🎬 Directed By</span>
            <strong className="text-light fs-6">{movie.director || 'N/A'}</strong>
          </div>
          {movie.producers?.length > 0 && (
            <div>
              <span className="text-secondary small d-block">💼 Produced By</span>
              <span className="text-light-emphasis small">{movie.producers.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Movie Details, Cast & Show Selection */}
      <div className="col-lg-8">
        <span className="eyebrow">MOVIE OVERVIEW</span>
        <h1 className="display-6 fw-bold mt-2">{movie.title}</h1>

        <div className="d-flex flex-wrap gap-2 align-items-center text-secondary mb-3">
          <span className="badge bg-secondary">{movie.certificate || 'U/A'}</span>
          <span>·</span>
          <span>{movie.durationMinutes} mins</span>
          <span>·</span>
          <span>{movie.genres?.join(', ') || 'Feature Film'}</span>
          <span>·</span>
          <span>{movie.languages?.join(', ') || 'English'}</span>
          <span>·</span>
          <span className="text-warning fw-bold">⭐ {movie.rating || '8.5'}/10</span>
        </div>

        <p className="lead fs-6 text-light-emphasis mb-4">
          {movie.description || 'No detailed synopsis available for this feature.'}
        </p>

        {/* CAST & CREW SECTION */}
        {movie.cast && movie.cast.length > 0 && (
          <section className="mb-4 pt-3 border-top border-secondary-subtle">
            <h2 className="h6 fw-bold text-uppercase text-secondary tracking-wider mb-3">
              Starring Cast & Characters
            </h2>
            <div className="cast-grid">
              {movie.cast.map((actor, idx) => {
                const initials = actor.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('');

                return (
                  <div className="cast-card" key={idx}>
                    <div className="cast-avatar">{initials}</div>
                    <div className="overflow-hidden">
                      <div className="fw-bold text-light small text-truncate" title={actor.name}>
                        {actor.name}
                      </div>
                      {actor.role && (
                        <div className="text-secondary small text-truncate" title={actor.role}>
                          as {actor.role}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* MULTIPLE THEATRES & SHOWTIME SELECTOR */}
        <section className="mt-4 pt-3 border-top border-secondary-subtle">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-0">Select Cinema & Showtime</h2>
              <small className="text-secondary">Available across multiple cities and multiplex screens</small>
            </div>

            {/* City Selector Pills */}
            <div className="d-flex gap-1 flex-wrap">
              {availableCities.map((c) => (
                <button
                  key={c}
                  className={`btn btn-sm ${
                    selectedCity === c ? 'btn-danger' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setSelectedCity(c)}
                >
                  📍 {c}
                </button>
              ))}
            </div>
          </div>

          {groupedShowsByTheatre.length === 0 ? (
            <div className="empty">
              <p className="mb-0 text-secondary">
                No shows currently scheduled in <strong>{selectedCity}</strong> for this film. Try selecting "All" or another city!
              </p>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {groupedShowsByTheatre.map(({ theatre, shows: tShows }) => (
                <div className="theatre-card" key={theatre?._id || Math.random()}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <h3 className="h6 fw-bold text-light mb-1">
                        🏛️ {theatre?.name || 'Multiplex Cinema'}
                      </h3>
                      <p className="text-secondary small mb-1">
                        📍 {theatre?.location || 'City'} · <span className="badge bg-dark border border-secondary">{theatre?.city || 'India'}</span>
                      </p>
                    </div>

                    {/* Facilities Tags */}
                    {theatre?.facilities?.length > 0 && (
                      <div className="d-flex gap-1 flex-wrap">
                        {theatre.facilities.slice(0, 3).map((f, i) => (
                          <span className="facility-pill" key={i}>
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Showtimes Buttons */}
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {tShows.map((s) => {
                      const isSelected = selectedShow?._id === s._id;
                      const formattedDate = new Date(s.startsAt).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      });
                      const formattedTime = new Date(s.startsAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={s._id}
                          className={`btn text-start p-2 px-3 ${
                            isSelected ? 'btn-danger' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setSelectedShow(s)}
                        >
                          <div className="fw-bold">{formattedTime}</div>
                          <small className="d-block text-truncate" style={{ maxWidth: '140px' }}>
                            {s.screen || 'Screen 1'}
                          </small>
                          <small className="opacity-75">
                            {formattedDate} · ₹{s.price}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEAT BOOKING MATRIX */}
        {selectedShow && (
          <section className="seat-panel mt-4 p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 fw-bold mb-0">Select Your Seats</h3>
                <small className="text-secondary">
                  {selectedShow.theatre?.name} · {selectedShow.screen || 'Screen 1'}
                </small>
              </div>
              <span className="badge bg-danger fs-6">₹{selectedShow.price} / seat</span>
            </div>

            {/* Cinema Screen Curve */}
            <div className="screen">SCREEN THIS WAY</div>

            {/* Seat Status Legend */}
            <div className="seat-legend">
              <span className="d-flex align-items-center gap-1">
                <span style={{ color: '#22c55e' }}>●</span> Available
              </span>
              <span className="d-flex align-items-center gap-1">
                <span style={{ color: '#facc15' }}>●</span> Selected
              </span>
              <span className="d-flex align-items-center gap-1">
                <span style={{ color: '#dc2626' }}>●</span> Booked / Held
              </span>
            </div>

            {/* Grid */}
            <div className="seat-grid">
              {seats.map((s) => {
                const isUnavailable = s.status === 'booked' || s.status === 'held';
                const isChosen = chosenSeats.includes(s.code);

                return (
                  <button
                    key={s.code}
                    title={`${s.code}: ${isUnavailable ? 'Unavailable' : 'Available'}`}
                    disabled={isUnavailable}
                    onClick={() => handleSeatClick(s.code)}
                    className={`seat ${
                      isUnavailable ? 'unavailable' : isChosen ? 'chosen' : ''
                    }`}
                  >
                    {s.code}
                  </button>
                );
              })}
            </div>

            {/* CINEMA SNACKS & BEVERAGES SELECTOR */}
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-50">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="h6 fw-bold mb-0 text-light d-flex align-items-center gap-2">
                    <span>🍿</span> Grab Cinema Bites & Beverages
                  </h4>
                  <small className="text-secondary">Delivered directly to your cinema hall seat</small>
                </div>
                {snacksTotal > 0 && (
                  <span className="badge bg-warning text-dark fw-bold">
                    Snacks: +₹{snacksTotal}
                  </span>
                )}
              </div>

              <div className="row g-2">
                {SNACK_OPTIONS.map((snack) => {
                  const qty = selectedSnacks[snack.id] || 0;
                  return (
                    <div className="col-12 col-md-6" key={snack.id}>
                      <div
                        className={`snack-card p-2 p-sm-3 rounded-3 d-flex align-items-center justify-content-between ${
                          qty > 0 ? 'snack-card-selected' : ''
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                          <div className="snack-icon fs-3 flex-shrink-0">{snack.icon}</div>
                          <div className="overflow-hidden">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-semibold text-light small text-truncate">
                                {snack.name}
                              </span>
                              {snack.tag && (
                                <span
                                  className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25"
                                  style={{ fontSize: '0.65rem' }}
                                >
                                  {snack.tag}
                                </span>
                              )}
                            </div>
                            <div className="text-secondary small text-truncate" style={{ fontSize: '0.75rem' }}>
                              {snack.desc}
                            </div>
                            <div className="text-danger fw-bold small mt-1">₹{snack.price}</div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                          {qty > 0 ? (
                            <div className="qty-control d-flex align-items-center bg-dark border border-secondary rounded-pill px-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-light text-decoration-none px-2 py-0"
                                onClick={() => updateSnackQty(snack.id, -1)}
                              >
                                -
                              </button>
                              <span className="fw-bold px-1 text-light small">{qty}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-light text-decoration-none px-2 py-0"
                                onClick={() => updateSnackQty(snack.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary px-3 rounded-pill"
                              onClick={() => updateSnackQty(snack.id, 1)}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booking Summary Bar */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary flex-wrap gap-2">
              <div>
                <div className="fw-bold fs-6">
                  Selected Seats: {chosenSeats.length ? chosenSeats.join(', ') : 'None'}
                </div>
                <div className="text-secondary small">
                  {chosenSeats.length} seats × ₹{selectedShow.price} = ₹{ticketsTotal}
                  {snacksTotal > 0 && (
                    <span className="text-warning ms-2">
                      + Snacks: ₹{snacksTotal}
                    </span>
                  )}
                  {' '}· Total: <strong className="text-light fs-6">₹{grandTotal}</strong>
                </div>
              </div>

              <button
                className="btn btn-danger px-4 py-2"
                disabled={!chosenSeats.length || busy}
                onClick={handleBook}
              >
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  `Confirm Booking · ₹${grandTotal}`
                )}
              </button>
            </div>

            <small className="text-secondary d-block mt-3 text-center">
              ⚡ Real-time seat updates enabled via Socket.IO. Demo payment is simulated.
            </small>
          </section>
        )}
      </div>

      {/* Trailer Modal Overlay */}
      {trailerModalOpen && (
        <div className="trailer-modal-backdrop" onClick={() => setTrailerModalOpen(false)}>
          <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
              <h3 className="h6 fw-bold mb-0 text-light d-flex align-items-center gap-2">
                <span className="text-danger">▶</span> {movie.title} · Official Trailer
              </h3>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={() => setTrailerModalOpen(false)}
              ></button>
            </div>
            <div className="ratio ratio-16x9">
              {getYouTubeEmbedUrl(movie.trailerUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(movie.trailerUrl)}
                  title={`${movie.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
                  <p className="text-secondary mb-3">Trailer video cannot be embedded directly.</p>
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-danger"
                  >
                    Open Trailer on YouTube
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

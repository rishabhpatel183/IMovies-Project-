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

const AVAILABLE_COUPONS = [
  { code: 'IMOVIES50', desc: 'Flat ₹50 OFF on orders above ₹200', minSpend: 200, type: 'flat', val: 50 },
  { code: 'POPCORN100', desc: 'Flat ₹100 OFF on orders above ₹450', minSpend: 450, type: 'flat', val: 100 },
  { code: 'BLOCKBUSTER20', desc: '20% OFF up to ₹150 (min ₹300)', minSpend: 300, type: 'percent', val: 0.2, max: 150 },
  { code: 'WELCOME75', desc: 'Flat ₹75 OFF on orders above ₹250', minSpend: 250, type: 'flat', val: 75 },
];

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : null;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [allMovies, setAllMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');
  const [seats, setSeats] = useState([]);
  const [chosenSeats, setChosenSeats] = useState([]);
  const [selectedSnacks, setSelectedSnacks] = useState({});
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(true);

  // Watchlist
  const [inWatchlist, setInWatchlist] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Payment Gateway Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CARD', 'NETBANKING'
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Initialize watchlist status
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('imovies_watchlist') || '[]');
      setInWatchlist(stored.includes(id));
    } catch {
      setInWatchlist(false);
    }
  }, [id]);

  const toggleWatchlist = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('imovies_watchlist') || '[]');
      let updated;
      if (stored.includes(id)) {
        updated = stored.filter((item) => item !== id);
        toast.info(`Removed "${movie?.title}" from your Watchlist`);
        setInWatchlist(false);
      } else {
        updated = [...stored, id];
        toast.success(`Added "${movie?.title}" to your Watchlist ❤️`);
        setInWatchlist(true);
      }
      localStorage.setItem('imovies_watchlist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Fetch movie details, catalog for recommendations, and shows
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
    // Reset coupon when movie changes
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');

    api
      .get(`/movies/${id}`)
      .then((res) => {
        setMovie(res.data);
      })
      .catch(() => toast.error('Movie not found'))
      .finally(() => setLoadingMovie(false));

    // Also fetch movies list for "Similar Movies" recommendations
    api.get('/movies?limit=25').then((res) => {
      setAllMovies(res.data.items || []);
    }).catch(() => {});

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
  const subtotal = ticketsTotal + snacksTotal;

  // Recalculate coupon discount whenever subtotal changes
  useEffect(() => {
    if (!appliedCoupon) {
      setCouponDiscount(0);
      return;
    }
    const match = AVAILABLE_COUPONS.find((c) => c.code === appliedCoupon);
    if (!match || subtotal < match.minSpend) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      if (match && subtotal > 0) {
        toast.info(`Coupon ${match.code} removed because subtotal fell below ₹${match.minSpend}.`);
      }
    } else {
      let disc = 0;
      if (match.type === 'flat') {
        disc = match.val;
      } else if (match.type === 'percent') {
        disc = Math.min(match.max || 150, Math.round(subtotal * match.val));
      }
      setCouponDiscount(disc);
    }
  }, [subtotal, appliedCoupon]);

  const grandTotal = Math.max(0, subtotal - couponDiscount);

  // Apply Coupon Handler
  function handleApplyCoupon(codeToApply) {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      toast.info('Please enter a coupon code.');
      return;
    }
    const match = AVAILABLE_COUPONS.find((c) => c.code === code);
    if (!match) {
      toast.error(`Invalid promo code "${code}". Try IMOVIES50 or POPCORN100!`);
      return;
    }
    if (subtotal < match.minSpend) {
      toast.warning(`Coupon requires a minimum order of ₹${match.minSpend}. (Current: ₹${subtotal})`);
      return;
    }

    let disc = 0;
    if (match.type === 'flat') {
      disc = match.val;
    } else if (match.type === 'percent') {
      disc = Math.min(match.max || 150, Math.round(subtotal * match.val));
    }

    setAppliedCoupon(match.code);
    setCouponDiscount(disc);
    setCouponInput('');
    toast.success(`🎉 Promo code "${match.code}" applied! You saved ₹${disc}!`);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast.info('Coupon removed.');
  }

  // Open Checkout / Payment Modal
  function handleOpenCheckout() {
    if (!user) {
      toast.info('Please log in to complete your booking.');
      navigate('/login');
      return;
    }

    if (!chosenSeats.length) {
      toast.info('Please select at least one seat first.');
      return;
    }

    setPaymentModalOpen(true);
    setPaymentSuccess(false);
  }

  // Finalize booking through payment simulation
  async function handleConfirmPayment() {
    setPaymentProcessing(true);
    try {
      // Step 1: Hold selected seats
      await api.post(`/shows/${selectedShow._id}/hold`, { seats: chosenSeats });

      // Step 2: Prepare snacks payload
      const snacksPayload = Object.entries(selectedSnacks)
        .filter(([_, qty]) => qty > 0)
        .map(([snackId, qty]) => {
          const s = SNACK_OPTIONS.find((opt) => opt.id === snackId);
          return {
            name: s.name,
            price: s.price,
            quantity: qty,
          };
        });

      // Step 3: Finalize booking with coupon and payment method
      const res = await api.post(`/shows/${selectedShow._id}/book`, {
        seats: chosenSeats,
        snacks: snacksPayload,
        couponCode: appliedCoupon,
        paymentMethod: paymentMethod,
      });

      // Step 4: Show payment success animation
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentModalOpen(false);
        toast.success(`🎉 Booking Confirmed! Code: ${res.data.booking.bookingCode}`);
        navigate('/bookings');
      }, 1400);
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment / Booking failed. Please try again.';
      toast.error(msg);
      setPaymentProcessing(false);
      if (selectedShow) {
        loadSeats(selectedShow._id);
      }
    }
  }

  // Real Razorpay Payment Gateway integration
  async function handleRazorpayCheckout() {
    if (!user) {
      toast.info('Please log in to complete your booking.');
      navigate('/login');
      return;
    }

    setBusy(true);
    try {
      // Step 1: Hold seats
      await api.post(`/shows/${selectedShow._id}/hold`, { seats: chosenSeats });

      // Step 2: Prepare snacks payload
      const snacksPayload = Object.entries(selectedSnacks)
        .filter(([_, qty]) => qty > 0)
        .map(([snackId, qty]) => {
          const s = SNACK_OPTIONS.find((opt) => opt.id === snackId);
          return { name: s.name, price: s.price, quantity: qty };
        });

      // Step 3: Create Razorpay order on backend
      const orderRes = await api.post('/payments/create-order', {
        showId: selectedShow._id,
        seats: chosenSeats,
        snacks: snacksPayload,
        couponCode: appliedCoupon,
      });

      const { order, keyId } = orderRes.data;

      // Step 4: Dynamically load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setBusy(false);
        return;
      }

      // Step 5: Configure and launch Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'iMovies Multiplex Cinemas',
        description: `${movie.title} · ${chosenSeats.length} Seats (${chosenSeats.join(', ')})`,
        image: movie.posterUrl || 'https://i.imgur.com/gK6w7m2.png',
        order_id: order.id.startsWith('order_mock_') ? undefined : order.id,
        handler: async function (response) {
          try {
            setPaymentModalOpen(false);
            toast.info('Payment received! Verifying and finalizing tickets...');

            const verifyRes = await api.post('/payments/verify', {
              showId: selectedShow._id,
              seats: chosenSeats,
              snacks: snacksPayload,
              couponCode: appliedCoupon,
              razorpay_order_id: response.razorpay_order_id || order.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'mock_signature',
            });

            toast.success(`🎉 Tickets Confirmed! Code: ${verifyRes.data.booking.bookingCode}`);
            navigate('/bookings');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: '9999999999',
        },
        theme: {
          color: '#dc2626',
        },
        modal: {
          ondismiss: function () {
            setBusy(false);
            toast.info('Checkout was cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate Razorpay checkout.');
    } finally {
      setBusy(false);
    }
  }

  // Similar Movies recommendations (filter by shared genre)
  const similarMovies = useMemo(() => {
    if (!movie || !allMovies.length) return [];
    const currentGenres = new Set(movie.genres || []);
    return allMovies
      .filter((m) => m._id !== movie._id)
      .filter((m) => m.genres?.some((g) => currentGenres.has(g)))
      .slice(0, 4);
  }, [movie, allMovies]);

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
    <>
      <div className="row g-4">
        {/* Movie Poster & Metadata */}
        <div className="col-lg-4">
          <div className="position-relative">
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

            {/* Watchlist Floating Heart Button */}
            <button
              type="button"
              className={`btn btn-sm position-absolute top-0 end-0 m-3 rounded-circle shadow-lg d-flex align-items-center justify-content-center ${
                inWatchlist ? 'btn-danger' : 'btn-dark bg-opacity-75 border-secondary'
              }`}
              style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
              onClick={toggleWatchlist}
              title={inWatchlist ? 'In your Watchlist (Click to remove)' : 'Add to Watchlist'}
            >
              {inWatchlist ? '❤️' : '🤍'}
            </button>
          </div>

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

              {/* PROMO CODES / COUPONS SECTION */}
              <div className="mt-4 pt-3 border-top border-secondary border-opacity-50">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <h4 className="h6 fw-bold mb-0 text-light d-flex align-items-center gap-2">
                    <span>🎟️</span> Apply Promo Code / Discount
                  </h4>
                  {appliedCoupon && (
                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">
                      ✓ Coupon Applied: {appliedCoupon} (-₹{couponDiscount})
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-2 px-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex justify-content-between align-items-center">
                    <span className="small text-success fw-bold">
                      🎉 Coupon <strong>{appliedCoupon}</strong> active! You are saving ₹{couponDiscount} on this booking.
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="input-group input-group-sm mb-2" style={{ maxWidth: '340px' }}>
                      <input
                        type="text"
                        className="form-control bg-dark border-secondary text-light font-monospace"
                        placeholder="Enter Promo Code..."
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        className="btn btn-danger fw-semibold px-3"
                        onClick={() => handleApplyCoupon()}
                      >
                        Apply
                      </button>
                    </div>

                    {/* Available Coupon Chips */}
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        Suggested:
                      </span>
                      {AVAILABLE_COUPONS.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          className="btn btn-sm py-0 px-2 rounded-pill btn-outline-secondary"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleApplyCoupon(c.code)}
                          title={c.desc}
                        >
                          🏷️ {c.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    {couponDiscount > 0 && (
                      <span className="text-success ms-2 fw-semibold">
                        - Discount: ₹{couponDiscount}
                      </span>
                    )}
                    {' '}· Total: <strong className="text-light fs-6">₹{grandTotal}</strong>
                  </div>
                </div>

                <button
                  className="btn btn-danger px-4 py-2 fw-semibold shadow-sm"
                  disabled={!chosenSeats.length || busy}
                  onClick={handleOpenCheckout}
                >
                  Proceed to Pay · ₹{grandTotal}
                </button>
              </div>

              <small className="text-secondary d-block mt-3 text-center">
                ⚡ Real-time seat updates enabled via Socket.IO. Secure simulated payment with instant e-ticket.
              </small>
            </section>
          )}
        </div>
      </div>

      {/* SIMILAR MOVIES RECOMMENDATION SECTION */}
      {similarMovies.length > 0 && (
        <section className="mt-5 pt-4 border-top border-secondary border-opacity-50">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1 text-light">More Blockbusters You May Like</h2>
              <p className="text-secondary small mb-0">
                Recommended based on genres: {movie.genres?.join(', ')}
              </p>
            </div>
            <Link to="/" className="btn btn-outline-light btn-sm">
              Explore All Movies →
            </Link>
          </div>

          <div className="row g-3">
            {similarMovies.map((simMovie) => (
              <div className="col-6 col-md-3" key={simMovie._id}>
                <div className="movie-card h-100 d-flex flex-column p-2 rounded-3">
                  <Link to={`/movies/${simMovie._id}`} className="poster-link mb-2">
                    {simMovie.posterUrl ? (
                      <img
                        src={simMovie.posterUrl}
                        alt={simMovie.title}
                        className="poster"
                        style={{ height: '200px' }}
                      />
                    ) : (
                      <div className="poster poster-placeholder" style={{ height: '200px' }}>
                        🎬
                      </div>
                    )}
                  </Link>
                  <div className="flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start gap-1 mb-1">
                        <strong className="text-light small text-truncate d-block" title={simMovie.title}>
                          {simMovie.title}
                        </strong>
                        <span className="rating" style={{ fontSize: '0.72rem' }}>
                          ⭐ {simMovie.rating || '8.0'}
                        </span>
                      </div>
                      <small className="text-secondary d-block text-truncate mb-2" style={{ fontSize: '0.75rem' }}>
                        {simMovie.genres?.slice(0, 2).join(' · ')} · {simMovie.durationMinutes}m
                      </small>
                    </div>
                    <Link
                      to={`/movies/${simMovie._id}`}
                      className="btn btn-outline-danger btn-sm w-100 py-1"
                      style={{ fontSize: '0.78rem' }}
                    >
                      View Shows
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRAILER MODAL OVERLAY */}
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

      {/* REALISTIC MULTIPLEX CHECKOUT & PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="payment-modal-backdrop" onClick={() => !paymentProcessing && setPaymentModalOpen(false)}>
          <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-5">🔒</span>
                <div>
                  <h3 className="h6 fw-bold mb-0 text-light">iMovies Secure Multiplex Checkout</h3>
                  <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                    256-Bit Encrypted Simulated Banking Gateway
                  </small>
                </div>
              </div>
              {!paymentProcessing && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPaymentModalOpen(false)}
                ></button>
              )}
            </div>

            {/* Body */}
            <div className="p-3 p-sm-4">
              {paymentSuccess ? (
                /* Success Celebration View */
                <div className="text-center py-4">
                  <div className="display-4 mb-2 animate-bounce">🎉</div>
                  <h4 className="fw-bold text-success mb-1">Payment Approved!</h4>
                  <p className="text-secondary small mb-3">
                    Your tickets and cinema snack orders have been reserved successfully.
                  </p>
                  <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                  <span className="text-secondary small ms-2">Redirecting to your E-Ticket...</span>
                </div>
              ) : paymentProcessing ? (
                /* Processing State */
                <div className="text-center py-5">
                  <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                  <h5 className="fw-bold text-light">Authorizing Payment...</h5>
                  <p className="text-secondary small mb-0">
                    Connecting to {paymentMethod} secure banking servers. Please do not refresh.
                  </p>
                </div>
              ) : (
                /* Payment Selection View */
                <div className="row g-4">
                  {/* Left Column: Order Summary */}
                  <div className="col-12 col-md-5 border-end-dashed-md">
                    <span className="text-secondary small fw-semibold text-uppercase d-block mb-2">
                      Booking Summary
                    </span>
                    <h5 className="fw-bold text-light mb-1">{movie.title}</h5>
                    <p className="text-secondary small mb-2">
                      🏛️ {selectedShow.theatre?.name} · {selectedShow.screen || 'Screen 1'}
                    </p>
                    <p className="text-secondary small mb-3">
                      🕒 {new Date(selectedShow.startsAt).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <div className="p-2 rounded-2 bg-dark border border-secondary border-opacity-50 small mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Seats ({chosenSeats.join(', ')})</span>
                        <span className="text-light">₹{ticketsTotal}</span>
                      </div>
                      {snacksTotal > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-secondary">Snacks & Combos</span>
                          <span className="text-warning">₹{snacksTotal}</span>
                        </div>
                      )}
                      {couponDiscount > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-success">Promo ({appliedCoupon})</span>
                          <span className="text-success">-₹{couponDiscount}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-50 fw-bold">
                        <span>Total Payable</span>
                        <span className="text-danger fs-6">₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment Methods */}
                  <div className="col-12 col-md-7">
                    <span className="text-secondary small fw-semibold text-uppercase d-block mb-2">
                      Select Payment Method
                    </span>

                    <div className="btn-group w-100 mb-3">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          paymentMethod === 'UPI' ? 'btn-danger' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setPaymentMethod('UPI')}
                      >
                        ⚡ UPI / QR
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          paymentMethod === 'CARD' ? 'btn-danger' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setPaymentMethod('CARD')}
                      >
                        💳 Debit/Credit Card
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          paymentMethod === 'NETBANKING' ? 'btn-danger' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setPaymentMethod('NETBANKING')}
                      >
                        🏛️ Net Banking
                      </button>
                    </div>

                    {/* METHOD 1: UPI */}
                    {paymentMethod === 'UPI' && (
                      <div className="text-center p-3 rounded-3 bg-dark border border-secondary border-opacity-50">
                        <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 mb-2">
                          ⚡ Instant QR Scanner
                        </span>

                        {/* Simulated QR Code */}
                        <div className="upi-qr-wrapper mx-auto p-2 bg-white rounded-3 mb-2" style={{ width: '130px', height: '130px' }}>
                          <svg className="w-100 h-100" viewBox="0 0 100 100" fill="#111">
                            <rect x="5" y="5" width="25" height="25" fill="#111" />
                            <rect x="8" y="8" width="19" height="19" fill="#fff" />
                            <rect x="12" y="12" width="11" height="11" fill="#111" />

                            <rect x="70" y="5" width="25" height="25" fill="#111" />
                            <rect x="73" y="8" width="19" height="19" fill="#fff" />
                            <rect x="77" y="12" width="11" height="11" fill="#111" />

                            <rect x="5" y="70" width="25" height="25" fill="#111" />
                            <rect x="8" y="73" width="19" height="19" fill="#fff" />
                            <rect x="12" y="77" width="11" height="11" fill="#111" />

                            <rect x="35" y="10" width="8" height="8" />
                            <rect x="48" y="15" width="12" height="6" />
                            <rect x="35" y="35" width="30" height="30" />
                            <rect x="42" y="42" width="16" height="16" fill="#fff" />
                            <rect x="47" y="47" width="6" height="6" fill="#dc2626" />
                            <rect x="70" y="40" width="10" height="20" />
                            <rect x="10" y="40" width="15" height="10" />
                            <rect x="40" y="75" width="20" height="10" />
                            <rect x="70" y="70" width="20" height="20" />
                            <rect x="75" y="75" width="10" height="10" fill="#fff" />
                          </svg>
                        </div>

                        <div className="font-monospace text-light small mb-2">
                          UPI ID: <strong className="text-warning">imovies.pay@hdfcbank</strong>
                        </div>

                        <div className="d-flex justify-content-center gap-2 mb-1">
                          <span className="badge bg-secondary">Google Pay</span>
                          <span className="badge bg-secondary">PhonePe</span>
                          <span className="badge bg-secondary">Paytm UPI</span>
                        </div>
                        <small className="text-secondary" style={{ fontSize: '0.7rem' }}>
                          Scan with any UPI app on your phone to complete demo authorization
                        </small>
                      </div>
                    )}

                    {/* METHOD 2: DEBIT / CREDIT CARD */}
                    {paymentMethod === 'CARD' && (
                      <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-50">
                        <div className="mb-2">
                          <label className="form-label text-secondary small mb-1">Card Number</label>
                          <input
                            type="text"
                            maxLength="19"
                            className="form-control form-control-sm bg-dark border-secondary text-light font-monospace"
                            placeholder="4532 •••• •••• 8892"
                            value={cardForm.number}
                            onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                          />
                        </div>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <label className="form-label text-secondary small mb-1">Expiry Date</label>
                            <input
                              type="text"
                              maxLength="5"
                              className="form-control form-control-sm bg-dark border-secondary text-light font-monospace"
                              placeholder="MM/YY"
                              value={cardForm.expiry}
                              onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label text-secondary small mb-1">CVV</label>
                            <input
                              type="password"
                              maxLength="3"
                              className="form-control form-control-sm bg-dark border-secondary text-light font-monospace"
                              placeholder="•••"
                              value={cardForm.cvv}
                              onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="mb-1">
                          <label className="form-label text-secondary small mb-1">Name on Card</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-dark border-secondary text-light"
                            placeholder="e.g. Rishabh Patel"
                            value={cardForm.name}
                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                          />
                        </div>
                        <small className="text-secondary" style={{ fontSize: '0.68rem' }}>
                          Simulated card payment. Real cards will not be charged.
                        </small>
                      </div>
                    )}

                    {/* METHOD 3: NET BANKING */}
                    {paymentMethod === 'NETBANKING' && (
                      <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-50 text-center">
                        <span className="small text-secondary d-block mb-2">Popular Retail Banks</span>
                        <div className="d-grid gap-2">
                          {['HDFC Bank', 'State Bank of India (SBI)', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              className="btn btn-sm btn-outline-secondary text-start px-3 text-light d-flex justify-content-between align-items-center"
                            >
                              <span>🏦 {b}</span>
                              <span className="badge bg-secondary">Select</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Real Razorpay vs Instant Simulation */}
                    <div className="mt-3 pt-2 border-top border-secondary border-opacity-50">
                      <button
                        type="button"
                        className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-2"
                        onClick={handleRazorpayCheckout}
                        disabled={busy}
                        style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8' }}
                      >
                        <span>💳</span> Pay with Razorpay Gateway · ₹{grandTotal}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        onClick={handleConfirmPayment}
                        disabled={busy}
                      >
                        <span>⚡</span> Instant Simulated Payment · ₹{grandTotal}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

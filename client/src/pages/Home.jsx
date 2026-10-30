import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Horror', 'Thriller'];
const LANGUAGES = ['All', 'Hindi', 'English', 'Telugu', 'Tamil', 'Japanese'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load watchlist on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('imovies_watchlist') || '[]');
      setWatchlist(stored);
    } catch {
      setWatchlist([]);
    }
  }, []);

  const toggleWatchlist = (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = JSON.parse(localStorage.getItem('imovies_watchlist') || '[]');
      let updated;
      if (stored.includes(movie._id)) {
        updated = stored.filter((id) => id !== movie._id);
        toast.info(`Removed "${movie.title}" from Watchlist`);
      } else {
        updated = [...stored, movie._id];
        toast.success(`Saved "${movie.title}" to Watchlist ❤️`);
      }
      setWatchlist(updated);
      localStorage.setItem('imovies_watchlist', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = { limit: 40 };
      if (search.trim()) params.search = search.trim();
      if (selectedGenre !== 'All') params.genre = selectedGenre;
      if (selectedLang !== 'All') params.language = selectedLang;

      api
        .get('/movies', { params })
        .then((res) => setItems(res.data.items))
        .catch((err) => toast.error(err.response?.data?.message || 'Could not load movies'))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedGenre, selectedLang]);

  // Filter for watchlist if active
  const displayedMovies = useMemo(() => {
    if (!watchlistOnly) return items;
    return items.filter((m) => watchlist.includes(m._id));
  }, [items, watchlistOnly, watchlist]);

  return (
    <>
      {/* Hero Banner */}
      <section className="hero p-4 p-md-5 mb-4">
        <span className="eyebrow">PREMIUM CINEMA EXPERIENCE</span>
        <h1 className="display-5 fw-bold mt-2">
          Big stories. <span className="accent">Bigger screen.</span>
        </h1>
        <p className="lead text-light-emphasis mb-4">
          Explore the latest blockbusters and reserve your favourite seats in real-time.
        </p>

        <div className="d-flex flex-wrap gap-3 align-items-center">
          <input
            className="form-control searchbox"
            placeholder="Search movies by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="d-flex gap-2 flex-wrap align-items-center">
            {/* Watchlist Quick Filter Pill */}
            <button
              className={`btn btn-sm d-flex align-items-center gap-1 ${
                watchlistOnly ? 'btn-danger' : 'btn-outline-danger'
              }`}
              onClick={() => setWatchlistOnly(!watchlistOnly)}
            >
              <span>{watchlistOnly ? '❤️' : '🤍'}</span>
              <span>My Watchlist ({watchlist.length})</span>
            </button>

            {GENRES.map((g) => (
              <button
                key={g}
                className={`btn btn-sm ${
                  selectedGenre === g && !watchlistOnly ? 'btn-danger' : 'btn-outline-secondary'
                }`}
                onClick={() => {
                  setSelectedGenre(g);
                  setWatchlistOnly(false);
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="w-100 d-flex gap-2 flex-wrap align-items-center pt-2 border-top border-secondary border-opacity-25">
            <span className="small text-secondary fw-semibold">Languages:</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`btn btn-sm py-0 px-2 rounded-pill ${
                  selectedLang === lang ? 'btn-light text-dark fw-bold' : 'btn-outline-secondary text-secondary'
                }`}
                onClick={() => setSelectedLang(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Movie Section Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0 fw-bold">
          {watchlistOnly ? 'My Watchlist Movies' : 'Now Showing'}
        </h2>
        <span className="text-secondary small">{displayedMovies.length} titles available</span>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-secondary mt-2">Loading movies...</p>
        </div>
      ) : displayedMovies.length === 0 ? (
        <div className="empty">
          <h5>No movies found</h5>
          <p className="text-secondary mb-3">
            {watchlistOnly
              ? "You haven't bookmarked any films to your Watchlist yet. Click the heart icon on any movie poster to save it!"
              : search || selectedGenre !== 'All'
              ? 'Try adjusting your search query or genre filter.'
              : 'No movies are currently in the catalogue. Log in with an admin account to add movies or run the seed script!'}
          </p>
          {(search || selectedGenre !== 'All' || watchlistOnly) && (
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                setSearch('');
                setSelectedGenre('All');
                setSelectedLang('All');
                setWatchlistOnly(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {displayedMovies.map((movie) => {
            const isSaved = watchlist.includes(movie._id);

            return (
              <div className="col-6 col-md-4 col-lg-3" key={movie._id}>
                <article className="movie-card h-100 d-flex flex-column position-relative">
                  <div className="position-relative">
                    <Link to={`/movies/${movie._id}`} className="poster-link">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="poster"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="poster poster-placeholder">
                          <span>🎬</span>
                          <span>{movie.title}</span>
                        </div>
                      )}
                    </Link>

                    {/* Quick Heart Watchlist Toggle Button */}
                    <button
                      type="button"
                      className={`btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center ${
                        isSaved
                          ? 'btn-danger text-white'
                          : 'btn-dark bg-opacity-75 text-white border border-secondary border-opacity-50'
                      }`}
                      style={{ width: '34px', height: '34px', fontSize: '0.95rem', zIndex: 2 }}
                      onClick={(e) => toggleWatchlist(e, movie)}
                      title={isSaved ? 'In your Watchlist' : 'Add to Watchlist'}
                    >
                      {isSaved ? '❤️' : '🤍'}
                    </button>
                  </div>

                  <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <h3 className="h6 mb-0 fw-bold text-truncate" title={movie.title}>
                          {movie.title}
                        </h3>
                        <span className="rating">⭐ {movie.rating || '8.0'}</span>
                      </div>

                      <p className="text-secondary small mb-3">
                        {movie.genres?.slice(0, 2).join(' · ') || 'Cinema'} · {movie.durationMinutes}m ·{' '}
                        <span className="badge bg-secondary py-0 px-1">{movie.certificate || 'U/A'}</span>
                      </p>
                    </div>

                    <Link className="btn btn-danger btn-sm w-100" to={`/movies/${movie._id}`}>
                      View Shows & Seats
                    </Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

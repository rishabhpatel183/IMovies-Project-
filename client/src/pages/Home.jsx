import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

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

          <div className="d-flex gap-2 flex-wrap">
            {GENRES.map((g) => (
              <button
                key={g}
                className={`btn btn-sm ${
                  selectedGenre === g ? 'btn-danger' : 'btn-outline-secondary'
                }`}
                onClick={() => setSelectedGenre(g)}
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
        <h2 className="h4 mb-0 fw-bold">Now Showing</h2>
        <span className="text-secondary small">{items.length} titles available</span>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-secondary mt-2">Loading movies...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <h5>No movies found</h5>
          <p className="text-secondary mb-3">
            {search || selectedGenre !== 'All'
              ? 'Try adjusting your search query or genre filter.'
              : 'No movies are currently in the catalogue. Log in with an admin account to add movies or run the seed script!'}
          </p>
          {(search || selectedGenre !== 'All') && (
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                setSearch('');
                setSelectedGenre('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {items.map((movie) => (
            <div className="col-6 col-md-4 col-lg-3" key={movie._id}>
              <article className="movie-card h-100 d-flex flex-column">
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
          ))}
        </div>
      )}
    </>
  );
}

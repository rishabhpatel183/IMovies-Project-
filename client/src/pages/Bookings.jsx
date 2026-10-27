import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    try {
      const res = await api.get('/bookings/my');
      setItems(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load your bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancelBooking(id) {
    if (!window.confirm('Are you sure you want to cancel this booking? A demo refund will be issued.')) {
      return;
    }

    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully.');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="text-secondary mt-2">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">My Bookings</h1>
          <p className="text-secondary mb-0">View all your confirmed movie tickets and reservations.</p>
        </div>
        <Link to="/" className="btn btn-outline-light btn-sm">
          + Book Another Movie
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty text-center py-5">
          <span className="fs-1 d-block mb-2">🎟️</span>
          <h4>No Bookings Found</h4>
          <p className="text-secondary mb-3">
            You haven't reserved any cinema tickets yet. Explore current movies and choose a showtime!
          </p>
          <Link to="/" className="btn btn-danger">
            Browse Movies Now
          </Link>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {items.map((b) => {
            const showTime = b.show?.startsAt ? new Date(b.show.startsAt) : null;
            const canCancel =
              b.status === 'confirmed' && showTime && showTime.getTime() > Date.now();

            return (
              <article className="booking-card p-3 p-md-4" key={b._id}>
                <div className="row g-3 align-items-center">
                  {/* Poster thumbnail */}
                  <div className="col-auto">
                    {b.movie?.posterUrl ? (
                      <img
                        src={b.movie.posterUrl}
                        alt={b.movie.title}
                        style={{
                          width: '75px',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '75px',
                          height: '110px',
                          background: '#1e293b',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                        }}
                      >
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="col">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h2 className="h5 fw-bold mb-0">{b.movie?.title || 'Feature Film'}</h2>
                      <span
                        className={`badge ${
                          b.status === 'confirmed' ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-secondary mb-1 small">
                      🏛️ <strong>{b.theatre?.name || 'Cinema Theatre'}</strong> · {b.theatre?.location}
                    </p>

                    <p className="mb-1 small">
                      🕒{' '}
                      {showTime
                        ? showTime.toLocaleString([], {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Scheduled Showtime'}{' '}
                      · <span className="text-light">{b.show?.screen || 'Screen 1'}</span>
                    </p>

                    <p className="mb-1 small">
                      🎟️ Reserved Seats:{' '}
                      <strong className="text-warning">
                        {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                      </strong>
                    </p>

                    <small className="text-secondary font-monospace">
                      Confirmation Code: <span className="text-light">{b.bookingCode}</span>
                    </small>
                  </div>

                  {/* Price and Actions */}
                  <div className="col-12 col-md-auto text-md-end pt-2 pt-md-0 border-top border-md-0 border-secondary">
                    <div className="text-secondary small">Total Paid</div>
                    <div className="h4 fw-bold text-danger mb-2">₹{b.amount}</div>

                    {canCancel && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => cancelBooking(b._id)}
                      >
                        Cancel Ticket
                      </button>
                    )}

                    {b.status === 'cancelled' && (
                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger">
                        Refunded
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

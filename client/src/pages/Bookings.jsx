import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

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
      if (selectedTicket?._id === id) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      }
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

                    {b.snacks && b.snacks.length > 0 && (
                      <p className="mb-1 small">
                        🍿 Cinema Snacks:{' '}
                        <span className="text-light-emphasis">
                          {b.snacks.map((s) => `${s.quantity}x ${s.name}`).join(', ')}
                        </span>
                      </p>
                    )}

                    {b.discount > 0 && (
                      <p className="mb-1 small text-success">
                        🏷️ Discount Applied:{' '}
                        <strong>-₹{b.discount}</strong> ({b.couponCode})
                      </p>
                    )}

                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-dark border border-secondary text-light small py-0">
                        Method: {b.paymentMethod || 'UPI'}
                      </span>
                      <small className="text-secondary font-monospace">
                        Code: <span className="text-light">{b.bookingCode}</span>
                      </small>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="col-12 col-md-auto text-md-end pt-2 pt-md-0 border-top border-md-0 border-secondary">
                    <div className="text-secondary small">Total Paid</div>
                    <div className="h4 fw-bold text-danger mb-2">₹{b.amount}</div>

                    <div className="d-flex flex-md-column gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm d-flex align-items-center justify-content-center gap-1 shadow-sm"
                        onClick={() => setSelectedTicket(b)}
                      >
                        <span>🎫</span> View E-Ticket
                      </button>

                      {canCancel && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
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
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CINEMA BOARDING PASS E-TICKET MODAL */}
      {selectedTicket && (
        <div
          className="ticket-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="ticket-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar (Hidden when printed) */}
            <div className="ticket-actions-bar d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small">
                Press <strong>Print</strong> to save PDF or print boarding pass
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-success btn-sm d-flex align-items-center gap-1 fw-semibold shadow-sm"
                  onClick={() => window.print()}
                >
                  <span>🖨️</span> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedTicket(null)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Stylized Boarding Pass */}
            <div className="ticket-boarding-pass">
              {/* Header Banner */}
              <div className="ticket-pass-header d-flex justify-content-between align-items-center p-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">🎬</span>
                  <div>
                    <h3 className="h6 fw-bold mb-0 text-white tracking-wider">iMovies CINEMAS</h3>
                    <small className="ticket-subheading">VIP BOARDING PASS · OFFICIAL ADMISSION</small>
                  </div>
                </div>
                <div className="text-end">
                  <span
                    className={`badge ${
                      selectedTicket.status === 'confirmed'
                        ? 'bg-success text-white'
                        : 'bg-secondary text-white'
                    }`}
                  >
                    {selectedTicket.status === 'confirmed' ? '✓ CONFIRMED' : selectedTicket.status.toUpperCase()}
                  </span>
                  <div className="font-monospace small text-light-emphasis mt-1">
                    #{selectedTicket.bookingCode}
                  </div>
                </div>
              </div>

              {/* Pass Body (Main + Perforated Stub) */}
              <div className="ticket-pass-body row g-0">
                {/* Main Body */}
                <div className="col-12 col-md-8 p-3 p-sm-4 border-end-dashed">
                  <div className="d-flex gap-3 align-items-start mb-3">
                    {selectedTicket.movie?.posterUrl && (
                      <img
                        src={selectedTicket.movie.posterUrl}
                        alt={selectedTicket.movie.title}
                        className="ticket-poster rounded-3 flex-shrink-0"
                      />
                    )}
                    <div>
                      <span className="badge bg-danger mb-1">
                        {selectedTicket.movie?.certificate || 'U/A'}
                      </span>
                      <h4 className="fw-bold mb-1 text-light">
                        {selectedTicket.movie?.title || 'Feature Film'}
                      </h4>
                      <p className="text-secondary small mb-1">
                        {selectedTicket.movie?.durationMinutes ? `${selectedTicket.movie.durationMinutes} mins · ` : ''}
                        Dolby Atmos Surround 7.1 · 4K Laser
                      </p>
                    </div>
                  </div>

                  <div className="ticket-info-grid mb-3">
                    <div>
                      <span className="ticket-label">CINEMA THEATRE</span>
                      <div className="ticket-value fw-bold text-light">
                        {selectedTicket.theatre?.name || 'Multiplex Cinema'}
                      </div>
                      <small className="text-secondary">{selectedTicket.theatre?.location}</small>
                    </div>
                    <div>
                      <span className="ticket-label">AUDI / SCREEN</span>
                      <div className="ticket-value fw-bold text-warning">
                        {selectedTicket.show?.screen || 'Screen 1'}
                      </div>
                      <small className="text-secondary">Audi Entry Gate 2</small>
                    </div>
                    <div>
                      <span className="ticket-label">SHOW DATE & TIME</span>
                      <div className="ticket-value fw-bold text-light">
                        {selectedTicket.show?.startsAt
                          ? new Date(selectedTicket.show.startsAt).toLocaleString([], {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Showtime'}
                      </div>
                    </div>
                    <div>
                      <span className="ticket-label">CONFIRMATION REF</span>
                      <div className="ticket-value font-monospace fw-bold text-danger">
                        {selectedTicket.bookingCode}
                      </div>
                    </div>
                  </div>

                  {/* Seat Badges */}
                  <div className="p-2 px-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-50 mb-3">
                    <span className="ticket-label d-block mb-1">RESERVED SEAT(S)</span>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {(Array.isArray(selectedTicket.seats)
                        ? selectedTicket.seats
                        : [selectedTicket.seats]
                      ).map((seat) => (
                        <span key={seat} className="ticket-seat-badge">
                          💺 {seat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Snacks Row if present */}
                  {selectedTicket.snacks && selectedTicket.snacks.length > 0 && (
                    <div className="p-2 px-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 mb-3">
                      <span className="ticket-label text-warning d-block mb-1">🍿 CINEMA F&B ORDER</span>
                      <div className="small text-light">
                        {selectedTicket.snacks.map((s, idx) => (
                          <span key={idx} className="me-2">
                            • {s.quantity}x {s.name} (₹{s.price * s.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing footer */}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-50 small flex-wrap gap-1">
                    <span className="text-secondary">
                      Paid: <strong className="text-success">₹{selectedTicket.amount}</strong> via{' '}
                      <span className="badge bg-secondary py-0">{selectedTicket.paymentMethod || 'UPI'}</span>
                      {selectedTicket.discount > 0 && (
                        <span className="text-warning ms-1">
                          (Saved ₹{selectedTicket.discount} with {selectedTicket.couponCode})
                        </span>
                      )}
                    </span>
                    <span className="text-secondary">Demo Mode: No refund deduction</span>
                  </div>
                </div>

                {/* Perforated Stub */}
                <div className="col-12 col-md-4 p-3 p-sm-4 bg-dark bg-opacity-25 d-flex flex-column justify-content-between">
                  <div>
                    <div className="text-center mb-2">
                      <span className="ticket-label d-block">ENTRY ADMISSION STUB</span>
                      <strong className="text-light small text-truncate d-block">
                        {selectedTicket.movie?.title}
                      </strong>
                      <span className="text-warning small fw-bold">
                        {selectedTicket.show?.screen || 'Screen 1'}
                      </span>
                    </div>

                    <div className="text-center py-2 bg-dark rounded-3 border border-secondary border-opacity-50 mb-3">
                      <span className="ticket-label d-block" style={{ fontSize: '0.65rem' }}>
                        SEATS
                      </span>
                      <strong className="text-warning fs-5">
                        {Array.isArray(selectedTicket.seats)
                          ? selectedTicket.seats.join(', ')
                          : selectedTicket.seats}
                      </strong>
                    </div>

                    {/* QR Code / Barcode Simulation */}
                    <div className="ticket-barcode-wrap text-center p-2 rounded-2 bg-white mb-2">
                      {/* SVG Barcode pattern */}
                      <svg
                        className="w-100"
                        height="45"
                        viewBox="0 0 200 45"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="0" y="0" width="4" height="40" fill="#111" />
                        <rect x="6" y="0" width="2" height="40" fill="#111" />
                        <rect x="10" y="0" width="6" height="40" fill="#111" />
                        <rect x="18" y="0" width="2" height="40" fill="#111" />
                        <rect x="22" y="0" width="4" height="40" fill="#111" />
                        <rect x="28" y="0" width="8" height="40" fill="#111" />
                        <rect x="38" y="0" width="2" height="40" fill="#111" />
                        <rect x="42" y="0" width="5" height="40" fill="#111" />
                        <rect x="49" y="0" width="3" height="40" fill="#111" />
                        <rect x="54" y="0" width="6" height="40" fill="#111" />
                        <rect x="62" y="0" width="2" height="40" fill="#111" />
                        <rect x="66" y="0" width="4" height="40" fill="#111" />
                        <rect x="72" y="0" width="7" height="40" fill="#111" />
                        <rect x="81" y="0" width="3" height="40" fill="#111" />
                        <rect x="86" y="0" width="2" height="40" fill="#111" />
                        <rect x="90" y="0" width="5" height="40" fill="#111" />
                        <rect x="97" y="0" width="4" height="40" fill="#111" />
                        <rect x="103" y="0" width="2" height="40" fill="#111" />
                        <rect x="107" y="0" width="6" height="40" fill="#111" />
                        <rect x="115" y="0" width="3" height="40" fill="#111" />
                        <rect x="120" y="0" width="4" height="40" fill="#111" />
                        <rect x="126" y="0" width="8" height="40" fill="#111" />
                        <rect x="136" y="0" width="2" height="40" fill="#111" />
                        <rect x="140" y="0" width="5" height="40" fill="#111" />
                        <rect x="147" y="0" width="3" height="40" fill="#111" />
                        <rect x="152" y="0" width="6" height="40" fill="#111" />
                        <rect x="160" y="0" width="2" height="40" fill="#111" />
                        <rect x="164" y="0" width="5" height="40" fill="#111" />
                        <rect x="171" y="0" width="3" height="40" fill="#111" />
                        <rect x="176" y="0" width="6" height="40" fill="#111" />
                        <rect x="184" y="0" width="4" height="40" fill="#111" />
                        <rect x="190" y="0" width="3" height="40" fill="#111" />
                        <rect x="195" y="0" width="5" height="40" fill="#111" />
                      </svg>
                      <div className="font-monospace text-dark fw-bold" style={{ fontSize: '0.7rem' }}>
                        {selectedTicket.bookingCode}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <small className="text-secondary" style={{ fontSize: '0.65rem' }}>
                      SCAN AT MULTIPLEX TURNSTILE FOR ENTRY
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

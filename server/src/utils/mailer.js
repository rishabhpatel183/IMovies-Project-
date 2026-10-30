import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback transporter (mock / ethereal simulation)
    transporter = {
      sendMail: async (mailOptions) => {
        console.log(`[iMovies Mailer] Simulation: Ticket Email sent to ${mailOptions.to}`);
        console.log(`[iMovies Mailer] Subject: ${mailOptions.subject}`);
        return {
          messageId: `sim_${Date.now()}`,
          simulated: true,
        };
      },
    };
  }

  return transporter;
}

export async function sendTicketEmail({ booking, user, movie, theatre, show }) {
  try {
    const mailClient = getTransporter();

    const recipient = user?.email || booking.user?.email;
    if (!recipient) {
      console.warn('[iMovies Mailer] No recipient email address available.');
      return { success: false, reason: 'No recipient email' };
    }

    const showDate = show?.startsAt ? new Date(show.startsAt).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Scheduled Showtime';

    const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;

    const snacksHtml = (booking.snacks && booking.snacks.length > 0)
      ? `<div style="background:#27272a; padding:12px; border-radius:8px; margin-top:12px;">
          <strong style="color:#f59e0b; font-size:13px; text-transform:uppercase;">🍿 Concession & Snacks Order:</strong>
          <ul style="margin:6px 0 0; padding-left:20px; color:#e4e4e7; font-size:14px;">
            ${booking.snacks.map((s) => `<li>${s.quantity}x ${s.name} (₹${(s.price || 0) * (s.quantity || 1)})</li>`).join('')}
          </ul>
        </div>`
      : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>iMovies E-Ticket</title>
      </head>
      <body style="margin:0; padding:24px; background-color:#0b1020; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#f4f4f5;">
        <div style="max-width:600px; margin:0 auto; background:#121a2b; border:1px solid #273249; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <div style="background:linear-gradient(90deg, #dc2626 0%, #991b1b 100%); padding:20px; text-align:center;">
            <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:1px;">🎬 iMovies CINEMAS</h1>
            <p style="margin:4px 0 0; font-size:12px; color:#fecaca; letter-spacing:2px; text-transform:uppercase;">Official Admission Boarding Pass</p>
          </div>

          <!-- Main Body -->
          <div style="padding:24px;">
            <div style="text-align:center; margin-bottom:20px;">
              <span style="background:#22c55e; color:#ffffff; font-weight:bold; font-size:12px; padding:4px 12px; border-radius:20px; text-transform:uppercase;">✓ Booking Confirmed</span>
              <h2 style="margin:12px 0 4px; font-size:24px; color:#ffffff;">${movie?.title || 'Feature Film'}</h2>
              <p style="margin:0; color:#94a3b8; font-size:14px;">${movie?.certificate || 'U/A'} · ${movie?.durationMinutes || 120} mins · Dolby Atmos</p>
            </div>

            <!-- Ticket Details Card -->
            <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; padding:16px; margin-bottom:20px;">
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Cinema Multiplex:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; color:#f1f5f9;">${theatre?.name || 'Multiplex Cinema'} (${theatre?.city || 'India'})</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Screen / Audi:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; color:#facc15;">${show?.screen || 'Screen 1'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Show Date & Time:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; color:#f1f5f9;">${showDate}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Reserved Seats:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; color:#facc15; font-size:16px;">💺 ${seatsList}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Confirmation Code:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; font-family:monospace; color:#ef4444; font-size:16px;">#${booking.bookingCode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#94a3b8;">Total Amount Paid:</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold; color:#22c55e; font-size:16px;">₹${booking.amount} (${booking.paymentMethod || 'UPI'})</td>
                </tr>
              </table>

              ${snacksHtml}
            </div>

            <!-- Instructions -->
            <div style="border-top:1px dashed #334155; padding-top:16px; font-size:12px; color:#94a3b8; line-height:1.6;">
              <p style="margin:0 0 6px;">📌 <strong>Multiplex Admission Terms:</strong></p>
              <ul style="margin:0; padding-left:18px;">
                <li>Please display this confirmation email or QR barcode on your mobile at the turnstile gate.</li>
                <li>Please arrive at least 15 minutes prior to scheduled showtime.</li>
                <li>Outside food and beverages are not permitted inside cinema auditoriums.</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#090d1a; padding:16px; text-align:center; border-top:1px solid #1e293b; font-size:11px; color:#64748b;">
            <p style="margin:0 0 4px;">Thank you for booking with iMovies Multiplex Platform.</p>
            <p style="margin:0;">Support & Inquiries: support@imovies.com</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const info = await mailClient.sendMail({
      from: process.env.SMTP_FROM || '"iMovies Cinemas" <tickets@imovies.com>',
      to: recipient,
      subject: `🎟️ Your iMovies Admission Ticket: ${movie?.title || 'Feature Film'} [#${booking.bookingCode}]`,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId, simulated: info.simulated || false };
  } catch (err) {
    console.error('[iMovies Mailer] Failed to dispatch ticket email:', err);
    return { success: false, error: err.message };
  }
}

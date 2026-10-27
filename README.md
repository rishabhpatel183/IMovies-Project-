# 🎬 iMovies — Full-Stack MERN Cinema Ticket Booking Platform

A comprehensive, production-grade full-stack cinema ticketing and reservation platform built with **React 18 + Vite**, **Express.js**, **Node.js**, **Socket.IO**, and **MongoDB (Mongoose)**.

---

## 🌟 Key Features

1. **🔐 User & Admin Authentication**:
   - Secure registration, login, and profile fetching with JWT and `bcryptjs` password hashing (12 salt rounds).
   - Role-Based Access Control (RBAC): Standard users book tickets; Admin accounts access the Management Portal.
   - Quick auto-promotion for `ADMIN_EMAIL`.

2. **🎟️ Real-Time Seat Selection & Live Synchronization**:
   - Visual cinema hall layout with curved screen and dynamic grid rows (A–F, 1–8).
   - Seat states: 🟢 **Available**, 🟡 **Selected**, 🔴 **Booked / Held**.
   - Live synchronization across multiple browser tabs/devices using **Socket.IO** rooms (`show:${showId}`).

3. **⏱️ Temporary Seat Hold System**:
   - Prevents race conditions: Selected seats are temporarily held for 5 minutes (`HOLD_MINUTES`).
   - Auto-expiry cleanup logic releases expired holds back to available status.

4. **💳 Transactional Booking & Cancellations**:
   - Multi-document ACID transactions on MongoDB Replica Sets/Atlas with fallback atomic updates for local standalone MongoDB instances.
   - Unique alphanumeric booking confirmation codes (e.g. `IM8X29K`).
   - User booking history dashboard (`/bookings`) with real-time cancellation and mock refund handling.

5. **🏛️ Cinema & Multi-Screen Management**:
   - Movies catalog with search by title, genre filtering, poster previews, and duration/rating metadata.
   - Multi-branch theatres with location and screen types (IMAX, Dolby Atmos, VIP).
   - Show scheduling with custom pricing, timings, and configurable seat layouts.

6. **🛠️ Admin Control Panel (`/admin`)**:
   - Form to add new films with high-res poster URLs, genres, trailer links, and ratings.
   - Form to create new cinema halls and branches.
   - Form to schedule shows linking movies, theatres, screens, and pricing.
   - Live overview of current catalog items.

---

## 📁 Directory Structure

```text
imovies-mern/
├── package.json              # Root package with concurrently & seed scripts
├── README.md                 # Complete guide & documentation
├── client/                   # Frontend React 18 + Vite Application
│   ├── package.json
│   ├── vite.config.js        # Vite build configuration with React plugin
│   ├── index.html            # Main HTML entry point
│   ├── .env                  # Client environment configuration
│   └── src/
│       ├── main.jsx          # App bootstrap with Router & Auth Provider
│       ├── App.jsx           # Main routing & persistent navigation
│       ├── api.js            # Axios client with JWT auto-interceptor
│       ├── style.css         # Modern dark cinema design system
│       ├── context/
│       │   └── AuthContext.jsx # Global JWT authentication provider
│       └── pages/
│           ├── Home.jsx      # Film catalog, search bar & genre filters
│           ├── MoviePage.jsx # Movie overview, showtimes & interactive seat matrix
│           ├── Login.jsx     # User/Admin sign in with demo auto-fill
│           ├── Register.jsx  # New user registration
│           ├── Bookings.jsx  # Ticket history, status & cancellation
│           └── Admin.jsx     # Admin dashboard for movies, halls & shows
└── server/                   # Backend Express.js API & Socket.IO Server
    ├── package.json
    ├── .env                  # Backend environment configuration
    └── src/
        ├── index.js          # Express app & Socket.IO server initialization
        ├── seed.js           # Automated seed script for instant priming
        ├── config/
        │   └── db.js         # Mongoose MongoDB connection
        ├── middleware/
        │   ├── auth.js       # JWT protect & adminOnly middleware
        │   └── errors.js     # Global error & 404 handlers
        ├── models/
        │   ├── User.js       # Users & roles (user / admin)
        │   ├── Movie.js      # Films, posters, genres, durations, ratings
        │   ├── Theatre.js    # Cinemas, locations & screen names
        │   ├── Show.js       # Showtimes, seat matrix & temporary holds
        │   └── Booking.js    # Confirmed bookings, seat codes & receipts
        ├── routes/
        │   ├── auth.js       # /api/auth (register, login, me)
        │   ├── movies.js     # /api/movies (CRUD & search/filter)
        │   ├── theatres.js   # /api/theatres (CRUD)
        │   ├── shows.js      # /api/shows (schedules, seats, hold, book)
        │   └── bookings.js   # /api/bookings (my history, cancel)
        └── utils/
            ├── asyncHandler.js
            └── token.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas cloud URI)

### 2. Environment Variables
Both `.env` files are already configured with standard defaults:

**`server/.env`**:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=super_secret_jwt_key_imovies_2026_cinema_booking_app
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
HOLD_MINUTES=5
ADMIN_EMAIL=admin@imovies.com
```

**`client/.env`**:
```ini
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Install Dependencies
From the root `imovies-mern` directory:
```bash
npm install
npm run install:all
```

### 4. Prime the Database (Seed Data)
Run the seed script to automatically populate demo movies, theatres, upcoming shows, and accounts:
```bash
npm run seed
```

### 5. Start the Application
Run both the Express API and the Vite frontend concurrently:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@imovies.com` | `Admin@12345` | Full catalogue & schedule control |
| **Standard User** | `user@imovies.com` | `User@12345` | Movie booking & ticket cancellation |

*(You can also use the **Auto-fill** buttons directly on the Login page for one-click testing!)*

---

## 📡 Core API Endpoints

### Authentication
- `POST /api/auth/register` — Create a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET  /api/auth/me` — Retrieve current authenticated user profile

### Movies
- `GET    /api/movies?search=...&genre=...` — Browse films with pagination
- `GET    /api/movies/:id` — Get single film details
- `POST   /api/movies` — *(Admin)* Create a new film
- `PUT    /api/movies/:id` — *(Admin)* Update a film
- `DELETE /api/movies/:id` — *(Admin)* Archive a film

### Theatres
- `GET  /api/theatres` — List active cinema locations
- `POST /api/theatres` — *(Admin)* Add a new cinema branch

### Shows & Seat Bookings
- `GET  /api/shows?movieId=...&date=YYYY-MM-DD` — List scheduled shows
- `POST /api/shows` — *(Admin)* Schedule a new show
- `GET  /api/shows/:id/seats` — View seat grid & live availability
- `POST /api/shows/:id/hold` — Temporarily hold selected seats (5 min)
- `POST /api/shows/:id/book` — Confirm seats and finalize booking

### Bookings
- `GET  /api/bookings/my` — Get user's confirmed bookings
- `POST /api/bookings/:id/cancel` — Cancel reservation & release seats

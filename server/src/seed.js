import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Theatre from './models/Theatre.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';
import { seatCodes } from './routes/shows.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';

const SAMPLE_MOVIES = [
  {
    title: 'Dune: Part Two',
    description:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    languages: ['English', 'Hindi'],
    durationMinutes: 166,
    rating: 8.8,
    certificate: 'U/A',
  },
  {
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    genres: ['Biography', 'Drama', 'History'],
    languages: ['English', 'Hindi'],
    durationMinutes: 180,
    rating: 8.9,
    certificate: 'A',
  },
  {
    title: 'Interstellar',
    description:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
    posterUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    languages: ['English'],
    durationMinutes: 169,
    rating: 8.7,
    certificate: 'U/A',
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description:
      'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    posterUrl:
      'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    genres: ['Animation', 'Action', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 140,
    rating: 8.6,
    certificate: 'U',
  },
  {
    title: 'The Dark Knight',
    description:
      'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 152,
    rating: 9.0,
    certificate: 'U/A',
  },
  {
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    languages: ['English'],
    durationMinutes: 148,
    rating: 8.8,
    certificate: 'U/A',
  },
];

const SAMPLE_THEATRES = [
  {
    name: 'PVR ICON: Phoenix Palladium',
    location: 'Lower Parel, Mumbai',
    screens: ['IMAX Laser 1', '4DX Screen 2', 'PVR Gold 3'],
  },
  {
    name: 'INOX Megaplex: Mall of India',
    location: 'Sector 18, Noida',
    screens: ['Insignia Screen 1', 'Dolby Atmos Screen 2', 'Kiddles 3'],
  },
  {
    name: 'Cinepolis IMAX: Forum Mall',
    location: 'Koramangala, Bengaluru',
    screens: ['Audi 1 IMAX', 'Audi 2 VIP', 'Audi 3 RealD 3D'],
  },
];

async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing records
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    console.log('[Seed] Cleaned existing collections.');

    // 1. Create Users
    const adminPassword = await bcrypt.hash('Admin@12345', 12);
    const userPassword = await bcrypt.hash('User@12345', 12);

    const [adminUser, normalUser] = await Promise.all([
      User.create({
        name: 'Cinema Admin',
        email: (process.env.ADMIN_EMAIL || 'admin@imovies.com').toLowerCase(),
        password: adminPassword,
        role: 'admin',
      }),
      User.create({
        name: 'John Doe',
        email: 'user@imovies.com',
        password: userPassword,
        role: 'user',
      }),
    ]);
    console.log('[Seed] Created default users:');
    console.log('   - Admin: admin@imovies.com / Admin@12345');
    console.log('   - User : user@imovies.com  / User@12345');

    // 2. Create Theatres
    const createdTheatres = await Theatre.insertMany(SAMPLE_THEATRES);
    console.log(`[Seed] Created ${createdTheatres.length} cinemas/theatres.`);

    // 3. Create Movies
    const createdMovies = await Movie.insertMany(SAMPLE_MOVIES);
    console.log(`[Seed] Created ${createdMovies.length} movies.`);

    // 4. Create Shows for Today, Tomorrow, and Day After Tomorrow
    const showSchedules = [];
    const now = new Date();

    const timeSlots = [
      { hour: 10, minute: 30, price: 220, screen: 'Screen 1' },
      { hour: 14, minute: 0, price: 280, screen: 'IMAX Laser 1' },
      { hour: 17, minute: 45, price: 350, screen: 'Dolby Atmos Screen 2' },
      { hour: 21, minute: 15, price: 320, screen: 'Screen 1' },
    ];

    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      for (let mIdx = 0; mIdx < createdMovies.length; mIdx++) {
        const movie = createdMovies[mIdx];
        const theatre = createdTheatres[mIdx % createdTheatres.length];
        const slot = timeSlots[mIdx % timeSlots.length];

        const startsAt = new Date(now);
        startsAt.setDate(now.getDate() + dayOffset);
        startsAt.setHours(slot.hour, slot.minute, 0, 0);

        const endsAt = new Date(startsAt.getTime() + (movie.durationMinutes + 30) * 60000);

        const seats = seatCodes(6, 8);

        // Pre-book a couple of sample seats so the layout shows live status
        if (dayOffset === 0 && (mIdx === 0 || mIdx === 1)) {
          seats[2].status = 'booked';
          seats[3].status = 'booked';
          seats[10].status = 'booked';
          seats[11].status = 'booked';
        }

        showSchedules.push({
          movie: movie._id,
          theatre: theatre._id,
          screen: slot.screen,
          startsAt,
          endsAt,
          price: slot.price,
          seatLayout: { rows: 6, cols: 8 },
          seats,
        });
      }
    }

    const createdShows = await Show.insertMany(showSchedules);
    console.log(`[Seed] Created ${createdShows.length} upcoming shows.`);

    // 5. Create a sample confirmed booking for normalUser
    const sampleShow = createdShows[0];
    const sampleBooking = await Booking.create({
      user: normalUser._id,
      show: sampleShow._id,
      movie: sampleShow.movie,
      theatre: sampleShow.theatre,
      seats: ['A3', 'A4'],
      amount: sampleShow.price * 2,
      status: 'confirmed',
      payment: 'mock-paid',
      bookingCode: 'IM' + Date.now().toString(36).toUpperCase() + 'DEMO',
    });

    console.log(`[Seed] Created sample booking for user@imovies.com (Code: ${sampleBooking.bookingCode}).`);
    console.log('\n[Seed Completed] Database is fully primed and ready to rock!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Failed]', error);
    process.exit(1);
  }
}

seed();

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Movie from './models/Movie.js';
import Theatre from './models/Theatre.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';
import { seatCodes } from './routes/shows.js';

// Resolve .env from server directory or root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

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
  // --- 20 NEW MOVIES ---
  {
    title: 'Deadpool & Wolverine',
    description:
      'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy and alter the MCU multiverse.',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 128,
    rating: 8.1,
    certificate: 'A',
  },
  {
    title: 'Gladiator II',
    description:
      'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors.',
    posterUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    genres: ['Action', 'Drama', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 148,
    rating: 7.8,
    certificate: 'A',
  },
  {
    title: 'Avengers: Endgame',
    description:
      'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos actions.',
    posterUrl:
      'https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 181,
    rating: 8.4,
    certificate: 'U/A',
  },
  {
    title: 'The Batman',
    description:
      'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city hidden corruption and question his family involvement.',
    posterUrl:
      'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 176,
    rating: 7.9,
    certificate: 'U/A',
  },
  {
    title: 'Avatar: The Way of Water',
    description:
      'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na vi.',
    posterUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    languages: ['English', 'Hindi'],
    durationMinutes: 192,
    rating: 7.7,
    certificate: 'U/A',
  },
  {
    title: 'Inside Out 2',
    description:
      'Joy, Sadness, Anger, Fear, and Disgust have been running a successful operation. However, when Anxiety, Envy, Ennui, and Embarrassment arrive, headquarters undergoes a sudden demolition.',
    posterUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    genres: ['Animation', 'Comedy', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 96,
    rating: 8.0,
    certificate: 'U',
  },
  {
    title: 'Top Gun: Maverick',
    description:
      'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN elite graduates on a dangerous mission.',
    posterUrl:
      'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6f1?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=giXco2nxYKg',
    genres: ['Action', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 130,
    rating: 8.3,
    certificate: 'U/A',
  },
  {
    title: 'John Wick: Chapter 4',
    description:
      'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=qEVUtrk8_B4',
    genres: ['Action', 'Crime', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 169,
    rating: 7.9,
    certificate: 'A',
  },
  {
    title: 'Kalki 2898 AD',
    description:
      'A modern-day avatar of Vishnu, a Hindu god, is believed to have descended to the earth to protect the world from evil forces in a dystopian future post-apocalyptic world.',
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    languages: ['Hindi', 'Telugu', 'English'],
    durationMinutes: 181,
    rating: 7.8,
    certificate: 'U/A',
  },
  {
    title: 'Stree 2',
    description:
      'After the events of Stree, the town of Chanderi is being haunted again. This time, women are mysteriously abducted by a headless entity named Sarkata.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=KVnhefcsm1k',
    genres: ['Comedy', 'Horror'],
    languages: ['Hindi'],
    durationMinutes: 147,
    rating: 7.7,
    certificate: 'U/A',
  },
  {
    title: 'Jawan',
    description:
      'A high-octane action thriller outlining the emotional journey of a man who is set out to rectify the wrongs in the society, with an army of women standing by his side.',
    posterUrl:
      'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=MWOlnZSnXJo',
    genres: ['Action', 'Thriller'],
    languages: ['Hindi', 'Tamil', 'Telugu'],
    durationMinutes: 169,
    rating: 7.5,
    certificate: 'U/A',
  },
  {
    title: 'Spider-Man: No Way Home',
    description:
      'With Spider-Man identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.',
    posterUrl:
      'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 148,
    rating: 8.2,
    certificate: 'U/A',
  },
  {
    title: 'Joker',
    description:
      'During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure.',
    posterUrl:
      'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
    genres: ['Crime', 'Drama', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 122,
    rating: 8.4,
    certificate: 'A',
  },
  {
    title: 'Barbie',
    description:
      'To live in Barbie Land is to be a perfect being in a perfect place. Unless you have a full-on existential crisis. Or you are a Ken.',
    posterUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=pBk4NYhWNMM',
    genres: ['Comedy', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 114,
    rating: 7.4,
    certificate: 'U/A',
  },
  {
    title: 'Mission: Impossible – Dead Reckoning',
    description:
      'Ethan Hunt and his IMF team must track down a dangerous weapon before it falls into the wrong hands, racing against an all-powerful artificial intelligence.',
    posterUrl:
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=avz05PdTbqM',
    genres: ['Action', 'Adventure', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 163,
    rating: 7.8,
    certificate: 'U/A',
  },
  {
    title: 'Spirited Away',
    description:
      'During her family move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    posterUrl:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=ByXuk9QqQkk',
    genres: ['Animation', 'Adventure'],
    languages: ['Japanese', 'English'],
    durationMinutes: 125,
    rating: 8.6,
    certificate: 'U',
  },
  {
    title: 'Fight Club',
    description:
      'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=qtRKDV93gk8',
    genres: ['Drama', 'Thriller'],
    languages: ['English'],
    durationMinutes: 139,
    rating: 8.8,
    certificate: 'A',
  },
  {
    title: 'Pulp Fiction',
    description:
      'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    posterUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=s7EdQ4FqbhY',
    genres: ['Crime', 'Drama'],
    languages: ['English'],
    durationMinutes: 154,
    rating: 8.9,
    certificate: 'A',
  },
  {
    title: 'Sholay',
    description:
      'After his family is murdered by a notorious and ruthless bandit, a former police officer enlists the services of two outlaws to capture him.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=E_sW_97r20w',
    genres: ['Action', 'Adventure', 'Drama'],
    languages: ['Hindi'],
    durationMinutes: 198,
    rating: 8.2,
    certificate: 'U',
  },
  {
    title: 'Animal',
    description:
      'A son undergoing an all-consuming love for his father undergoes a dark transformation when an assassination attempt is made on his father life.',
    posterUrl:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Dydmpfo68DA',
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['Hindi', 'Telugu'],
    durationMinutes: 201,
    rating: 7.6,
    certificate: 'A',
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
  {
    name: 'PVR Superplex: Logix City Center',
    location: 'Noida City, Delhi NCR',
    screens: ['IMAX Screen 1', 'Playhouse Screen 2', 'Gold Screen 3'],
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

    // 3. Create Movies (26 Total!)
    const createdMovies = await Movie.insertMany(SAMPLE_MOVIES);
    console.log(`[Seed] Created ${createdMovies.length} movies in catalogue!`);

    // 4. Create Shows for Today, Tomorrow, and Day After Tomorrow
    const showSchedules = [];
    const now = new Date();

    const timeSlots = [
      { hour: 10, minute: 30, price: 220, screen: 'Screen 1' },
      { hour: 13, minute: 45, price: 280, screen: 'IMAX Laser 1' },
      { hour: 17, minute: 15, price: 350, screen: 'Dolby Atmos Screen 2' },
      { hour: 20, minute: 45, price: 380, screen: 'PVR Gold 3' },
      { hour: 22, minute: 30, price: 300, screen: 'Screen 1' },
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

        // Pre-book a couple of sample seats on some shows so the layout looks authentically active
        if (dayOffset === 0 && (mIdx === 0 || mIdx === 1 || mIdx === 6)) {
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
    console.log(`[Seed] Created ${createdShows.length} scheduled shows across theatres.`);

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
    console.log('\n[Seed Completed Successfully] All 26 movies and showtimes are ready!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Failed]', error);
    process.exit(1);
  }
}

seed();

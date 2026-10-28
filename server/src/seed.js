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
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the known universe.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    director: 'Denis Villeneuve',
    producers: ['Mary Parent', 'Cale Boyter', 'Patrick McCormick', 'Tanya Lapointe', 'Denis Villeneuve'],
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Javier Bardem', role: 'Stilgar' },
      { name: 'Austin Butler', role: 'Feyd-Rautha Harkonnen' },
      { name: 'Florence Pugh', role: 'Princess Irulan' },
    ],
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    languages: ['English', 'Hindi'],
    durationMinutes: 166,
    rating: 8.8,
    certificate: 'U/A',
  },
  {
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his historical role in the Manhattan Project during World War II, culminating in the birth of the atomic age.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    director: 'Christopher Nolan',
    producers: ['Emma Thomas', 'Charles Roven', 'Christopher Nolan'],
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Katherine Kitty Oppenheimer' },
      { name: 'Matt Damon', role: 'Leslie Groves' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
      { name: 'Florence Pugh', role: 'Jean Tatlock' },
    ],
    genres: ['Biography', 'Drama', 'History'],
    languages: ['English', 'Hindi'],
    durationMinutes: 180,
    rating: 8.9,
    certificate: 'A',
  },
  {
    title: 'Interstellar',
    description:
      'When Earth becomes uninhabitable, ex-NASA pilot Joseph Cooper is tasked with traveling through a wormhole near Saturn along with scientists to find humankind a new home.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    director: 'Christopher Nolan',
    producers: ['Emma Thomas', 'Christopher Nolan', 'Lynda Obst'],
    cast: [
      { name: 'Matthew McConaughey', role: 'Joseph Cooper' },
      { name: 'Anne Hathaway', role: 'Dr. Amelia Brand' },
      { name: 'Jessica Chastain', role: 'Murphy Cooper' },
      { name: 'Michael Caine', role: 'Professor John Brand' },
      { name: 'Matt Damon', role: 'Dr. Mann' },
    ],
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    languages: ['English'],
    durationMinutes: 169,
    rating: 8.7,
    certificate: 'U/A',
  },
  {
    title: 'The Dark Knight',
    description:
      'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and DA Harvey Dent, until the sadistic Joker unleashes chaos upon Gotham City.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    director: 'Christopher Nolan',
    producers: ['Emma Thomas', 'Charles Roven', 'Christopher Nolan'],
    cast: [
      { name: 'Christian Bale', role: 'Bruce Wayne / Batman' },
      { name: 'Heath Ledger', role: 'The Joker' },
      { name: 'Aaron Eckhart', role: 'Harvey Dent / Two-Face' },
      { name: 'Michael Caine', role: 'Alfred Pennyworth' },
      { name: 'Gary Oldman', role: 'James Gordon' },
    ],
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 152,
    rating: 9.0,
    certificate: 'U/A',
  },
  {
    title: 'Inception',
    description:
      'Dom Cobb is a skilled thief who steals corporate secrets through the dream-sharing technology. He is offered a chance to have his criminal record erased by pulling off inception.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    director: 'Christopher Nolan',
    producers: ['Emma Thomas', 'Christopher Nolan'],
    cast: [
      { name: 'Leonardo DiCaprio', role: 'Dom Cobb' },
      { name: 'Joseph Gordon-Levitt', role: 'Arthur' },
      { name: 'Elliot Page', role: 'Ariadne' },
      { name: 'Tom Hardy', role: 'Eames' },
      { name: 'Ken Watanabe', role: 'Mr. Saito' },
    ],
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    languages: ['English'],
    durationMinutes: 148,
    rating: 8.8,
    certificate: 'U/A',
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description:
      'Miles Morales catapults across the Multiverse, where he encounters a society of Spider-People charged with protecting its very existence, but clashes with their leader on how to handle a threat.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
    producers: ['Phil Lord', 'Christopher Miller', 'Amy Pascal', 'Avi Arad'],
    cast: [
      { name: 'Shameik Moore', role: 'Miles Morales / Spider-Man' },
      { name: 'Hailee Steinfeld', role: 'Gwen Stacy / Spider-Woman' },
      { name: 'Oscar Isaac', role: 'Miguel O Hara / Spider-Man 2099' },
      { name: 'Daniel Kaluuya', role: 'Hobie Brown / Spider-Punk' },
      { name: 'Jake Johnson', role: 'Peter B. Parker' },
    ],
    genres: ['Animation', 'Action', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 140,
    rating: 8.6,
    certificate: 'U',
  },
  {
    title: 'Deadpool & Wolverine',
    description:
      'A listless Wade Wilson toils in civilian life until a threat to his home world sends him reluctantly suiting up alongside an even more reluctant Wolverine.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    director: 'Shawn Levy',
    producers: ['Kevin Feige', 'Ryan Reynolds', 'Shawn Levy', 'Lauren Shuler Donner'],
    cast: [
      { name: 'Ryan Reynolds', role: 'Wade Wilson / Deadpool' },
      { name: 'Hugh Jackman', role: 'Logan / Wolverine' },
      { name: 'Emma Corrin', role: 'Cassandra Nova' },
      { name: 'Matthew Macfadyen', role: 'Mr. Paradox' },
      { name: 'Morena Baccarin', role: 'Vanessa' },
    ],
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 128,
    rating: 8.1,
    certificate: 'A',
  },
  {
    title: 'Gladiator II',
    description:
      'Years after witnessing the fall of Maximus, Lucius enters the Colosseum after his home is conquered by tyrannical Emperors who rule Rome with an iron fist.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    director: 'Ridley Scott',
    producers: ['Ridley Scott', 'Michael Pruss', 'Douglas Wick', 'Lucy Fisher'],
    cast: [
      { name: 'Paul Mescal', role: 'Lucius Verus' },
      { name: 'Pedro Pascal', role: 'General Marcus Acacius' },
      { name: 'Denzel Washington', role: 'Macrinus' },
      { name: 'Connie Nielsen', role: 'Lucilla' },
      { name: 'Joseph Quinn', role: 'Emperor Geta' },
    ],
    genres: ['Action', 'Drama', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 148,
    rating: 7.8,
    certificate: 'A',
  },
  {
    title: 'Avengers: Endgame',
    description:
      'After Thanos wiped out half of all life, the surviving Avengers assemble one final time in an audacious time heist to restore balance to the universe.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    director: 'Anthony Russo, Joe Russo',
    producers: ['Kevin Feige'],
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man' },
      { name: 'Chris Evans', role: 'Steve Rogers / Captain America' },
      { name: 'Mark Ruffalo', role: 'Bruce Banner / Hulk' },
      { name: 'Chris Hemsworth', role: 'Thor' },
      { name: 'Scarlett Johansson', role: 'Natasha Romanoff' },
      { name: 'Josh Brolin', role: 'Thanos' },
    ],
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 181,
    rating: 8.4,
    certificate: 'U/A',
  },
  {
    title: 'The Batman',
    description:
      'Batman ventures into Gotham City underworld when a sadistic killer leaves behind a trail of cryptic clues aimed at the city corrupt establishment.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    director: 'Matt Reeves',
    producers: ['Dylan Clark', 'Matt Reeves'],
    cast: [
      { name: 'Robert Pattinson', role: 'Bruce Wayne / Batman' },
      { name: 'Zoë Kravitz', role: 'Selina Kyle / Catwoman' },
      { name: 'Paul Dano', role: 'Edward Nashton / The Riddler' },
      { name: 'Jeffrey Wright', role: 'Lt. James Gordon' },
      { name: 'Colin Farrell', role: 'Oswald Cobblepot / Penguin' },
    ],
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 176,
    rating: 7.9,
    certificate: 'U/A',
  },
  {
    title: 'Avatar: The Way of Water',
    description:
      'Jake Sully lives with his newfound family on Pandora. When a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the Metkayina clan.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    director: 'James Cameron',
    producers: ['James Cameron', 'Jon Landau'],
    cast: [
      { name: 'Sam Worthington', role: 'Jake Sully' },
      { name: 'Zoe Saldana', role: 'Neytiri' },
      { name: 'Sigourney Weaver', role: 'Kiri' },
      { name: 'Stephen Lang', role: 'Colonel Miles Quaritch' },
      { name: 'Kate Winslet', role: 'Ronal' },
    ],
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    languages: ['English', 'Hindi'],
    durationMinutes: 192,
    rating: 7.7,
    certificate: 'U/A',
  },
  {
    title: 'Inside Out 2',
    description:
      'Riley is officially a teenager! As headquarters undergoes a sudden demolition to make room for new Emotions, Joy and the crew face the arrival of Anxiety, Envy, and Ennui.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    director: 'Kelsey Mann',
    producers: ['Mark Nielsen'],
    cast: [
      { name: 'Amy Poehler', role: 'Joy' },
      { name: 'Maya Hawke', role: 'Anxiety' },
      { name: 'Kensington Tallman', role: 'Riley Andersen' },
      { name: 'Phyllis Smith', role: 'Sadness' },
      { name: 'Lewis Black', role: 'Anger' },
    ],
    genres: ['Animation', 'Comedy', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 96,
    rating: 8.0,
    certificate: 'U',
  },
  {
    title: 'Top Gun: Maverick',
    description:
      'Pete Maverick Mitchell trains a detachment of graduates for a specialized mission the likes of which no living pilot has ever seen, confronting ghosts from his past.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=giXco2nxYKg',
    director: 'Joseph Kosinski',
    producers: ['Jerry Bruckheimer', 'Tom Cruise', 'Christopher McQuarrie', 'David Ellison'],
    cast: [
      { name: 'Tom Cruise', role: 'Capt. Pete Maverick Mitchell' },
      { name: 'Miles Teller', role: 'Lt. Bradley Rooster Bradshaw' },
      { name: 'Jennifer Connelly', role: 'Penny Benjamin' },
      { name: 'Jon Hamm', role: 'Vice Adm. Cyclone Simpson' },
      { name: 'Glen Powell', role: 'Lt. Jake Hangman Seresin' },
    ],
    genres: ['Action', 'Drama'],
    languages: ['English', 'Hindi'],
    durationMinutes: 130,
    rating: 8.3,
    certificate: 'U/A',
  },
  {
    title: 'John Wick: Chapter 4',
    description:
      'With the price on his head ever increasing, legendary hitman John Wick takes his fight against the High Table global as he seeks out the most powerful players in the underworld.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=qEVUtrk8_B4',
    director: 'Chad Stahelski',
    producers: ['Basil Iwanyk', 'Erica Lee', 'Chad Stahelski'],
    cast: [
      { name: 'Keanu Reeves', role: 'John Wick' },
      { name: 'Donnie Yen', role: 'Caine' },
      { name: 'Bill Skarsgård', role: 'Marquis de Gramont' },
      { name: 'Laurence Fishburne', role: 'The Bowery King' },
      { name: 'Hiroyuki Sanada', role: 'Shimazu Koji' },
    ],
    genres: ['Action', 'Crime', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 169,
    rating: 7.9,
    certificate: 'A',
  },
  {
    title: 'Kalki 2898 AD',
    description:
      'In a mythological-inspired post-apocalyptic dystopia, Bhairava and an immortal warrior Ashwatthama clash over protecting the unborn child destined to bring light to the dark universe.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/9yghMwOBn4Y3jWz5u6hC98dM5l4.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
    director: 'Nag Ashwin',
    producers: ['C. Aswani Dutt', 'Swapna Dutt', 'Priyanka Dutt'],
    cast: [
      { name: 'Prabhas', role: 'Bhairava' },
      { name: 'Amitabh Bachchan', role: 'Ashwatthama' },
      { name: 'Kamal Haasan', role: 'Supreme Yaskin' },
      { name: 'Deepika Padukone', role: 'SUM-80 / Sumathi' },
      { name: 'Disha Patani', role: 'Roxie' },
    ],
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    languages: ['Hindi', 'Telugu', 'English'],
    durationMinutes: 181,
    rating: 7.8,
    certificate: 'U/A',
  },
  {
    title: 'Stree 2',
    description:
      'The town of Chanderi is terrorized once more, this time by a headless apparition known as Sarkata. The eccentric gang rallies with their protector Stree to save the town.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/mKOBF66y5Qv297rA11fA3Z5Z2iQ.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=KVnhefcsm1k',
    director: 'Amar Kaushik',
    producers: ['Dinesh Vijan', 'Jyoti Deshpande'],
    cast: [
      { name: 'Rajkummar Rao', role: 'Vicky' },
      { name: 'Shraddha Kapoor', role: 'The Unknown Girl' },
      { name: 'Pankaj Tripathi', role: 'Rudra Bhaiya' },
      { name: 'Abhishek Banerjee', role: 'Jana' },
      { name: 'Aparshakti Khurana', role: 'Bittu' },
    ],
    genres: ['Comedy', 'Horror'],
    languages: ['Hindi'],
    durationMinutes: 147,
    rating: 7.7,
    certificate: 'U/A',
  },
  {
    title: 'Jawan',
    description:
      'A prison warden driven by a personal vendetta recruits inmates to commit outrageous acts of social justice while confronting a corrupt arms merchant.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/jFt1g94tKBv1YHqj134c44xJk1a.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=MWOlnZSnXJo',
    director: 'Atlee',
    producers: ['Gauri Khan', 'Gaurav Verma'],
    cast: [
      { name: 'Shah Rukh Khan', role: 'Vikram Rathore / Captain Azad' },
      { name: 'Nayanthara', role: 'Narmada Rai' },
      { name: 'Vijay Sethupathi', role: 'Kaleen Gaikwad' },
      { name: 'Deepika Padukone', role: 'Aishwarya Rathore' },
      { name: 'Sanya Malhotra', role: 'Dr. Eeram' },
    ],
    genres: ['Action', 'Thriller'],
    languages: ['Hindi', 'Tamil', 'Telugu'],
    durationMinutes: 169,
    rating: 7.5,
    certificate: 'U/A',
  },
  {
    title: 'Spider-Man: No Way Home',
    description:
      'With Peter Parker identity revealed, he enlists Doctor Strange to cast a memory spell, but accidentally opens the multiverse, pulling in iconic villains from alternate dimensions.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    director: 'Jon Watts',
    producers: ['Kevin Feige', 'Amy Pascal'],
    cast: [
      { name: 'Tom Holland', role: 'Peter Parker / Spider-Man' },
      { name: 'Zendaya', role: 'Michelle MJ Jones' },
      { name: 'Benedict Cumberbatch', role: 'Dr. Stephen Strange' },
      { name: 'Jacob Batalon', role: 'Ned Leeds' },
      { name: 'Willem Dafoe', role: 'Norman Osborn / Green Goblin' },
    ],
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    durationMinutes: 148,
    rating: 8.2,
    certificate: 'U/A',
  },
  {
    title: 'Joker',
    description:
      'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He embarks on a downward spiral of revolution and bloody crime.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zAGVQLHvwOY',
    director: 'Todd Phillips',
    producers: ['Todd Phillips', 'Bradley Cooper', 'Emma Tillinger Koskoff'],
    cast: [
      { name: 'Joaquin Phoenix', role: 'Arthur Fleck / Joker' },
      { name: 'Robert De Niro', role: 'Murray Franklin' },
      { name: 'Zazie Beetz', role: 'Sophie Dumond' },
      { name: 'Frances Conroy', role: 'Penny Fleck' },
    ],
    genres: ['Crime', 'Drama', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 122,
    rating: 8.4,
    certificate: 'A',
  },
  {
    title: 'Barbie',
    description:
      'Stereotypical Barbie experiences a sudden existential crisis that causes her feet to become flat. She must travel to the real world alongside Ken to find her human owner.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=pBk4NYhWNMM',
    director: 'Greta Gerwig',
    producers: ['David Heyman', 'Margot Robbie', 'Tom Ackerley', 'Robbie Brenner'],
    cast: [
      { name: 'Margot Robbie', role: 'Barbie' },
      { name: 'Ryan Gosling', role: 'Ken' },
      { name: 'America Ferrera', role: 'Gloria' },
      { name: 'Will Ferrell', role: 'Mattel CEO' },
      { name: 'Simu Liu', role: 'Tourist Ken' },
    ],
    genres: ['Comedy', 'Adventure'],
    languages: ['English', 'Hindi'],
    durationMinutes: 114,
    rating: 7.4,
    certificate: 'U/A',
  },
  {
    title: 'Mission: Impossible – Dead Reckoning',
    description:
      'Ethan Hunt and his IMF team track down a terrifying new rogue AI weapon called The Entity that threatens humanity before it falls into the wrong hands.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=avz05PdTbqM',
    director: 'Christopher McQuarrie',
    producers: ['Tom Cruise', 'Christopher McQuarrie'],
    cast: [
      { name: 'Tom Cruise', role: 'Ethan Hunt' },
      { name: 'Hayley Atwell', role: 'Grace' },
      { name: 'Ving Rhames', role: 'Luther Stickell' },
      { name: 'Simon Pegg', role: 'Benji Dunn' },
      { name: 'Rebecca Ferguson', role: 'Ilsa Faust' },
    ],
    genres: ['Action', 'Adventure', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 163,
    rating: 7.8,
    certificate: 'U/A',
  },
  {
    title: 'Spirited Away',
    description:
      'A sullen 10-year-old girl wanders into a magical world ruled by gods, spirits, and witches, where her parents are transformed into giant pigs and she must work at an enchanted bathhouse.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=ByXuk9QqQkk',
    director: 'Hayao Miyazaki',
    producers: ['Toshio Suzuki'],
    cast: [
      { name: 'Rumi Hiiragi', role: 'Chihiro Ogino' },
      { name: 'Miyu Irino', role: 'Haku' },
      { name: 'Mari Natsuki', role: 'Yubaba / Zeniba' },
      { name: 'Takashi Naito', role: 'Akio Ogino' },
    ],
    genres: ['Animation', 'Adventure'],
    languages: ['Japanese', 'English'],
    durationMinutes: 125,
    rating: 8.6,
    certificate: 'U',
  },
  {
    title: 'Fight Club',
    description:
      'A depressed corporate white-collar worker suffering from insomnia crosses paths with an eccentric soap maker and forms an underground fight club that spirals out of control.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=qtRKDV93gk8',
    director: 'David Fincher',
    producers: ['Art Linson', 'Ceán Chaffin', 'Ross Grayson Bell'],
    cast: [
      { name: 'Brad Pitt', role: 'Tyler Durden' },
      { name: 'Edward Norton', role: 'The Narrator' },
      { name: 'Helena Bonham Carter', role: 'Marla Singer' },
      { name: 'Meat Loaf', role: 'Robert Paulson' },
      { name: 'Jared Leto', role: 'Angel Face' },
    ],
    genres: ['Drama', 'Thriller'],
    languages: ['English'],
    durationMinutes: 139,
    rating: 8.8,
    certificate: 'A',
  },
  {
    title: 'Pulp Fiction',
    description:
      'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption in Los Angeles.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=s7EdQ4FqbhY',
    director: 'Quentin Tarantino',
    producers: ['Lawrence Bender'],
    cast: [
      { name: 'John Travolta', role: 'Vincent Vega' },
      { name: 'Samuel L. Jackson', role: 'Jules Winnfield' },
      { name: 'Uma Thurman', role: 'Mia Wallace' },
      { name: 'Bruce Willis', role: 'Butch Coolidge' },
      { name: 'Ving Rhames', role: 'Marsellus Wallace' },
    ],
    genres: ['Crime', 'Drama'],
    languages: ['English'],
    durationMinutes: 154,
    rating: 8.9,
    certificate: 'A',
  },
  {
    title: 'Sholay',
    description:
      'After his family is massacred by ruthless bandit Gabbar Singh, former police officer Thakur Baldev Singh hires two ex-convicts Jai and Veeru to capture the dacoit alive.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/k3N3r4jK0tW9c2qQ8vY3Z5f4B6Q.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=E_sW_97r20w',
    director: 'Ramesh Sippy',
    producers: ['G.P. Sippy'],
    cast: [
      { name: 'Amitabh Bachchan', role: 'Jai' },
      { name: 'Dharmendra', role: 'Veeru' },
      { name: 'Hema Malini', role: 'Basanti' },
      { name: 'Sanjeev Kumar', role: 'Thakur Baldev Singh' },
      { name: 'Amjad Khan', role: 'Gabbar Singh' },
      { name: 'Jaya Bachchan', role: 'Radha' },
    ],
    genres: ['Action', 'Adventure', 'Drama'],
    languages: ['Hindi'],
    durationMinutes: 198,
    rating: 8.2,
    certificate: 'U',
  },
  {
    title: 'Animal',
    description:
      'Ranvijay Singh bears an obsessive and volatile devotion toward his distant father. When an assassination attempt is made on his father, he embarks on a brutal blood-soaked vendetta.',
    posterUrl: 'https://image.tmdb.org/t/p/w780/hr9rjR4JxbWns8Sc4Y0BDjCW0x.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Dydmpfo68DA',
    director: 'Sandeep Reddy Vanga',
    producers: ['Bhushan Kumar', 'Krishan Kumar', 'Murad Khetani', 'Pranay Reddy Vanga'],
    cast: [
      { name: 'Ranbir Kapoor', role: 'Ranvijay Singh / Aziz Haque' },
      { name: 'Anil Kapoor', role: 'Balbir Singh' },
      { name: 'Bobby Deol', role: 'Abrar Haque' },
      { name: 'Rashmika Mandanna', role: 'Geetanjali' },
      { name: 'Triptii Dimri', role: 'Zoya' },
    ],
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['Hindi', 'Telugu'],
    durationMinutes: 201,
    rating: 7.6,
    certificate: 'A',
  },
];

// 12 Prominent Theatres across 6 major metropolitan regions
const SAMPLE_THEATRES = [
  // Mumbai
  {
    name: 'PVR ICON: Phoenix Palladium',
    location: 'Lower Parel, Mumbai',
    city: 'Mumbai',
    address: '462, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
    screens: ['IMAX Laser 1', '4DX Screen 2', 'PVR Gold Class 3'],
    facilities: ['Parking', 'Dolby Atmos', 'Recliner Seats', 'Gourmet Food Court', 'Valet'],
  },
  {
    name: 'INOX Megaplex: Inorbit Mall',
    location: 'Malad West, Mumbai',
    city: 'Mumbai',
    address: 'New Link Rd, Malad West, Mumbai, Maharashtra 400064',
    screens: ['Insignia Audi 1', 'Dolby Atmos 2', 'MX4D 3'],
    facilities: ['Parking', 'Insignia Lounge', 'Recliner Seats', 'Food Court'],
  },
  {
    name: 'Cinepolis VIP: Viviana Mall',
    location: 'Thane West, Mumbai',
    city: 'Mumbai',
    address: 'Eastern Express Hwy, Laxmi Nagar, Thane West, Maharashtra 400606',
    screens: ['Cinepolis VIP 1', 'RealD 3D Screen 2', '4DX Screen 3'],
    facilities: ['Coffee Shop', 'VIP Lounge', 'Parking', 'Dolby 7.1'],
  },

  // Delhi NCR
  {
    name: "PVR Director's Cut: Ambience Mall",
    location: 'Vasant Kunj, New Delhi',
    city: 'Delhi NCR',
    address: 'Ambience Mall, Nelson Mandela Marg, Vasant Kunj, New Delhi 110070',
    screens: ['DC Platinum 1', 'Gold Class Audi 2', 'Lounge Screen 3'],
    facilities: ['Luxury Dining', 'In-Seat Butler', 'Valet Parking', 'Dolby Atmos'],
  },
  {
    name: 'INOX Megaplex: Mall of India',
    location: 'Sector 18, Noida',
    city: 'Delhi NCR',
    address: 'DLF Mall of India, Sector 18, Noida, Uttar Pradesh 201301',
    screens: ['Insignia Screen 1', 'Dolby Atmos Screen 2', 'Kiddles Playhouse 3'],
    facilities: ['Dolby Atmos', 'Kids Arena', 'Gourmet Snacks', 'Parking'],
  },
  {
    name: 'Cinepolis IMAX: DLF Avenue',
    location: 'Saket, New Delhi',
    city: 'Delhi NCR',
    address: 'DLF Avenue Mall, Press Enclave Marg, Saket, New Delhi 110017',
    screens: ['IMAX Laser Screen 1', 'Macro XE Audi 2', 'VIP Audi 3'],
    facilities: ['IMAX Laser', 'Recliners', 'Food Court', 'Metro Connectivity'],
  },

  // Bengaluru
  {
    name: 'PVR IMAX: Vega City Mall',
    location: 'Bannerghatta Road, Bengaluru',
    city: 'Bengaluru',
    address: 'Vega City Mall, Srinivas Industrial Estate, Bengaluru, Karnataka 560076',
    screens: ['IMAX Audi 1', '4DX Audi 2', 'Gold Screen 3'],
    facilities: ['IMAX Experience', 'Gaming Zone', 'Parking', 'Recliners'],
  },
  {
    name: 'Cinepolis IMAX: Forum Mall',
    location: 'Koramangala, Bengaluru',
    city: 'Bengaluru',
    address: 'The Forum Mall, Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru 560095',
    screens: ['Audi 1 IMAX', 'Audi 2 VIP', 'Audi 3 Atmos'],
    facilities: ['Dolby Atmos', 'VIP Seating', 'Parking', 'Food Court'],
  },

  // Hyderabad
  {
    name: 'Prasads Multiplex & Large Screen',
    location: 'NTR Gardens, Hyderabad',
    city: 'Hyderabad',
    address: 'NTR Gardens, Necklace Rd, Khairatabad, Hyderabad, Telangana 500063',
    screens: ['PCX Giant Screen 1', 'Audi 2 Dolby Atmos', 'Audi 3 Gold'],
    facilities: ['India Giant Screen', 'Food Court', 'Gaming Arcade', 'Lake View'],
  },
  {
    name: 'AMB Cinemas: Sarath City Capital Mall',
    location: 'Gachibowli, Hyderabad',
    city: 'Hyderabad',
    address: 'Sarath City Capital Mall, Gachibowli - Miyapur Rd, Hyderabad, Telangana 500084',
    screens: ['Screen 1 VIP Laser', 'Screen 2 Dolby Atmos', 'Screen 3 M-Screen'],
    facilities: ['Super Luxury Lounge', 'Recliner Sofas', 'Gourmet Kitchen', 'Valet'],
  },

  // Pune
  {
    name: 'Cinepolis: Seasons Mall',
    location: 'Magarpatta City, Pune',
    city: 'Pune',
    address: 'Seasons Mall, Magarpatta, Hadapsar, Pune, Maharashtra 411028',
    screens: ['VIP Audi 1', 'Dolby Atmos Audi 2', 'RealD 3D Screen 3'],
    facilities: ['VIP Recliners', 'Mega Parking', 'Multi-Cuisine Food Court'],
  },

  // Kolkata
  {
    name: 'INOX: Quest Mall',
    location: 'Park Circus, Kolkata',
    city: 'Kolkata',
    address: 'Quest Mall, Syed Amir Ali Ave, Park Circus, Kolkata, West Bengal 700017',
    screens: ['Insignia Screen 1', 'Audi 2 Dolby Atmos', 'Audi 3 Gold'],
    facilities: ['Insignia Luxury', 'Valet Parking', 'Gourmet Menu', 'Dolby Atmos'],
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
    console.log(`[Seed] Created ${createdTheatres.length} multiplex theatres across 6 cities.`);

    // 3. Create Movies (All 26 Real Titles with Cast & Crew!)
    const createdMovies = await Movie.insertMany(SAMPLE_MOVIES);
    console.log(`[Seed] Created ${createdMovies.length} authentic movies with posters, directors, producers, and cast.`);

    // 4. Create Shows for Today, Tomorrow, and Day After Tomorrow across multiple theatres
    const showSchedules = [];
    const now = new Date();

    const timeSlots = [
      { hour: 10, minute: 30, price: 220, screen: 'Screen 1' },
      { hour: 13, minute: 45, price: 280, screen: 'IMAX Laser 1' },
      { hour: 17, minute: 15, price: 350, screen: 'Dolby Atmos Screen 2' },
      { hour: 20, minute: 45, price: 380, screen: 'PVR Gold Class 3' },
      { hour: 22, minute: 30, price: 300, screen: 'Screen 1' },
    ];

    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      for (let mIdx = 0; mIdx < createdMovies.length; mIdx++) {
        const movie = createdMovies[mIdx];
        
        // Schedule in 2 different cities/theatres per movie per day
        for (let tStep = 0; tStep < 2; tStep++) {
          const theatre = createdTheatres[(mIdx * 2 + tStep) % createdTheatres.length];
          const slot = timeSlots[(mIdx + tStep) % timeSlots.length];

          const startsAt = new Date(now);
          startsAt.setDate(now.getDate() + dayOffset);
          startsAt.setHours(slot.hour, slot.minute, 0, 0);

          const endsAt = new Date(startsAt.getTime() + (movie.durationMinutes + 30) * 60000);

          const seats = seatCodes(6, 8);

          // Pre-book sample seats on some shows so the seat map looks active
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
    }

    const createdShows = await Show.insertMany(showSchedules);
    console.log(`[Seed] Created ${createdShows.length} scheduled shows across theatres and cities.`);

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
    console.log('\n[Seed Completed Successfully] All 26 real movies, cast/crew details, and multiple theatre locations are primed!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Failed]', error);
    process.exit(1);
  }
}

seed();

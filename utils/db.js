const { MongoClient } = require('mongodb');

// MongoDB connection
let client = null;
let db = null;
let collection = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies';
const DB_NAME = process.env.DB_NAME || 'movies';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'movies';

/**
 * Connect to MongoDB
 */
async function connectDB() {
  if (db) {
    return { db, collection };
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await client.connect();
    }

    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);

    return { db, collection };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get collection
 */
async function getCollection() {
  const { collection: col } = await connectDB();
  return col;
}

/**
 * Close connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    collection = null;
  }
}

/**
 * Search movies with filters
 */
async function searchMovies(filters = {}, options = {}) {
  const col = await getCollection();
  
  const {
    search,
    genre,
    tahun,
    minRating,
    limit = 50,
    offset = 0,
    sortBy = 'rating',
    order = 'desc'
  } = options;

  // Build query
  const query = {};

  // Filter by judul not null
  query.judul = { $ne: null };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Filter by genre
  if (genre) {
    query.genre = { $regex: genre, $options: 'i' };
  }

  // Filter by tahun
  if (tahun) {
    query.tahun = tahun.toString();
  }

  // Filter by minimum rating
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  // Build sort
  const sort = {};
  if (sortBy === 'rating') {
    sort.rating = order === 'desc' ? -1 : 1;
  } else if (sortBy === 'tahun') {
    sort.tahun = order === 'desc' ? -1 : 1;
  }

  // Execute query
  const cursor = col.find(query)
    .sort(sort)
    .skip(parseInt(offset))
    .limit(parseInt(limit));

  const movies = await cursor.toArray();
  const total = await col.countDocuments(query);

  return {
    movies,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
}

/**
 * Get movie by slug
 */
async function getMovieBySlug(slug) {
  const col = await getCollection();
  const movie = await col.findOne({ slug });
  return movie;
}

/**
 * Get movie by TMDB ID
 */
async function getMovieByTMDBId(tmdbId) {
  const col = await getCollection();
  const movie = await col.findOne({ tmdb_id: tmdbId });
  return movie;
}

/**
 * Update movie with TMDB data
 */
async function updateMovieWithTMDB(slug, tmdbData) {
  const col = await getCollection();
  const result = await col.updateOne(
    { slug },
    {
      $set: {
        ...tmdbData,
        updatedAt: new Date()
      }
    },
    { upsert: false }
  );
  return result;
}

module.exports = {
  connectDB,
  getCollection,
  closeDB,
  searchMovies,
  getMovieBySlug,
  getMovieByTMDBId,
  updateMovieWithTMDB
};


const postgres = require('postgres');

// PostgreSQL connection
let sql = null;

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Initialize PostgreSQL connection
 */
function getDB() {
  if (sql) {
    return sql;
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in environment variables');
  }

  sql = postgres(DATABASE_URL, {
    max: 10, // Maximum number of connections
    idle_timeout: 20,
    connect_timeout: 10,
    // Optimized for transaction pooler (serverless)
    prepare: false, // Disable prepared statements for pooler compatibility
  });

  return sql;
}

/**
 * Search movies with filters
 */
async function searchMovies(filters = {}, options = {}) {
  const db = getDB();
  
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

  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  // Build WHERE conditions and params
  const conditions = [];
  const params = [];

  // Always filter out null judul
  conditions.push('judul IS NOT NULL');

  // Text search
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push('(judul ILIKE $' + (params.length + 1) + ' OR slug ILIKE $' + (params.length + 1) + ' OR sinopsis ILIKE $' + (params.length + 1) + ')');
    params.push(searchPattern);
  }

  // Filter by genre
  if (genre) {
    const genrePattern = `%${genre}%`;
    conditions.push('genre ILIKE $' + (params.length + 1));
    params.push(genrePattern);
  }

  // Filter by tahun
  if (tahun) {
    conditions.push('tahun = $' + (params.length + 1));
    params.push(tahun.toString());
  }

  // Filter by minimum rating
  if (minRating) {
    conditions.push('rating >= $' + (params.length + 1));
    params.push(parseFloat(minRating));
  }

  // Build ORDER BY
  let orderBy = 'created_at DESC';
  if (sortBy === 'rating') {
    orderBy = `rating ${order.toUpperCase()} NULLS LAST`;
  } else if (sortBy === 'tahun') {
    orderBy = `tahun ${order.toUpperCase()} NULLS LAST`;
  }

  // Build and execute query
  const whereClause = conditions.join(' AND ');
  // Quote 'cast' column because it's a reserved word in PostgreSQL
  const query = `
    SELECT slug, judul, url, tahun, genre, rating, quality, durasi, negara, sutradara, "cast", jumlah_cast, sinopsis, poster_url, votes, release_date, hydrax_servers, turbovip_servers, p2p_servers, cast_servers, created_at, updated_at, COUNT(*) OVER() as total_count
    FROM ${TABLE_NAME}
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  
  params.push(parseInt(limit));
  params.push(parseInt(offset));

  // Execute query
  const movies = await db.unsafe(query, params);
  
  const total = movies.length > 0 ? parseInt(movies[0].total_count) : 0;

  // Remove total_count from results and rename cast back
  const cleanMovies = movies.map(movie => {
    const { total_count, ...rest } = movie;
    return rest;
  });

  return {
    movies: cleanMovies,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
}

/**
 * Get movie by slug
 */
async function getMovieBySlug(slug) {
  const db = getDB();
  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  // Quote 'cast' column because it's a reserved word
  const movies = await db.unsafe(`
    SELECT slug, judul, url, tahun, genre, rating, quality, durasi, negara, sutradara, "cast", jumlah_cast, sinopsis, poster_url, votes, release_date, hydrax_servers, turbovip_servers, p2p_servers, cast_servers, created_at, updated_at
    FROM ${TABLE_NAME}
    WHERE slug = $1
    LIMIT 1
  `, [slug]);

  return movies[0] || null;
}

/**
 * Get movie by TMDB ID
 */
async function getMovieByTMDBId(tmdbId) {
  const db = getDB();
  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  const movies = await db`
    SELECT * FROM ${db(TABLE_NAME)}
    WHERE tmdb_id = ${tmdbId}
    LIMIT 1
  `;

  return movies[0] || null;
}

/**
 * Update movie with TMDB data
 */
async function updateMovieWithTMDB(slug, tmdbData) {
  const db = getDB();
  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  // Build update object
  const updateData = {
    ...tmdbData,
    updated_at: new Date()
  };

  const updated = await db`
    UPDATE ${db(TABLE_NAME)}
    SET ${db(updateData)}
    WHERE slug = ${slug}
    RETURNING *
  `;

  return updated[0] || null;
}

/**
 * Insert movie
 */
async function insertMovie(movie) {
  const db = getDB();
  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  const inserted = await db`
    INSERT INTO ${db(TABLE_NAME)} ${db(movie)}
    RETURNING *
  `;

  return inserted[0] || null;
}

/**
 * Upsert movie (insert or update)
 */
async function upsertMovie(movie) {
  const db = getDB();
  const TABLE_NAME = process.env.TABLE_NAME || 'movies';

  const upserted = await db`
    INSERT INTO ${db(TABLE_NAME)} ${db(movie)}
    ON CONFLICT (slug) DO UPDATE SET
      ${db({
        ...movie,
        updated_at: new Date()
      })}
    RETURNING *
  `;

  return upserted[0] || null;
}

/**
 * Close database connection
 */
async function closeDB() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

module.exports = {
  getDB,
  searchMovies,
  getMovieBySlug,
  getMovieByTMDBId,
  updateMovieWithTMDB,
  insertMovie,
  upsertMovie,
  closeDB
};

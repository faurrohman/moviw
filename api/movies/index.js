const { searchMovies } = require('../../utils/db');
const { enrichMovies } = require('../../utils/tmdb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query } = req;
  const { 
    search, 
    limit = 50, 
    offset = 0, 
    genre, 
    tahun, 
    minRating, 
    sortBy = 'rating', 
    order = 'desc',
    tmdb = 'false' // Default false untuk list
  } = query;

  try {
    // Query from MongoDB
    const result = await searchMovies({}, {
      search,
      genre,
      tahun,
      minRating,
      limit,
      offset,
      sortBy,
      order
    });

    // Enrich with TMDB if requested
    let finalMovies = result.movies;
    if (tmdb === 'true' || tmdb === '1') {
      try {
        const maxEnrich = Math.min(result.movies.length, 20);
        const toEnrich = result.movies.slice(0, maxEnrich);
        const enriched = await enrichMovies(toEnrich, true);
        finalMovies = [...enriched, ...result.movies.slice(maxEnrich)];
      } catch (error) {
        console.error('Error enriching movies:', error);
      }
    }

    return res.status(200).json({
      success: true,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      tmdb_enriched: tmdb === 'true' || tmdb === '1',
      data: finalMovies
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database query failed',
      error: error.message
    });
  }
};


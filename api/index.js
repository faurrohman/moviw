const { getMoviesData } = require('../utils/data-loader');
const { enrichMovies } = require('../utils/tmdb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Load movies data with error handling
  let moviesData;
  try {
    moviesData = getMoviesData();
  } catch (error) {
    console.error('Error loading movies data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load movies data',
      error: error.message
    });
  }

  const { query } = req;
  const { 
    search, 
    limit = 50, 
    offset = 0, 
    genre, 
    tahun, 
    minRating,
    tmdb = 'false' // Default false untuk list
  } = query;

  let filteredMovies = [...moviesData];

  // Filter by search (judul atau slug)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredMovies = filteredMovies.filter(movie => 
      (movie.judul && movie.judul.toLowerCase().includes(searchLower)) ||
      (movie.slug && movie.slug.toLowerCase().includes(searchLower))
    );
  }

  // Filter by genre
  if (genre) {
    filteredMovies = filteredMovies.filter(movie => 
      movie.genre && movie.genre.toLowerCase().includes(genre.toLowerCase())
    );
  }

  // Filter by tahun
  if (tahun) {
    filteredMovies = filteredMovies.filter(movie => 
      movie.tahun && movie.tahun.toString() === tahun.toString()
    );
  }

  // Filter by minimum rating
  if (minRating) {
    filteredMovies = filteredMovies.filter(movie => 
      movie.rating && !isNaN(movie.rating) && movie.rating >= parseFloat(minRating)
    );
  }

  // Pagination
  const total = filteredMovies.length;
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginatedMovies = filteredMovies.slice(start, end);

  // Enrich with TMDB if requested
  let finalMovies = paginatedMovies;
  if (tmdb === 'true' || tmdb === '1') {
    try {
      const maxEnrich = Math.min(paginatedMovies.length, 20);
      const toEnrich = paginatedMovies.slice(0, maxEnrich);
      const enriched = await enrichMovies(toEnrich, true);
      finalMovies = [...enriched, ...paginatedMovies.slice(maxEnrich)];
    } catch (error) {
      console.error('Error enriching movies:', error);
    }
  }

  return res.status(200).json({
    success: true,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    tmdb_enriched: tmdb === 'true' || tmdb === '1',
    data: finalMovies
  });
};


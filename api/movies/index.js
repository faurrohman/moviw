const moviesData = require('../../data/movie_details_FINAL.json');
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
    tmdb = 'false' // Default false untuk list (karena bisa lambat), true untuk detail
  } = query;

  let filteredMovies = [...moviesData];

  // Filter by search (judul atau slug)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredMovies = filteredMovies.filter(movie => 
      (movie.judul && movie.judul.toLowerCase().includes(searchLower)) ||
      (movie.slug && movie.slug.toLowerCase().includes(searchLower)) ||
      (movie.sinopsis && movie.sinopsis.toLowerCase().includes(searchLower))
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

  // Remove movies with null judul
  filteredMovies = filteredMovies.filter(movie => movie.judul !== null && movie.judul !== undefined);

  // Sorting
  if (sortBy === 'rating') {
    filteredMovies.sort((a, b) => {
      const ratingA = isNaN(a.rating) ? 0 : a.rating;
      const ratingB = isNaN(b.rating) ? 0 : b.rating;
      return order === 'desc' ? ratingB - ratingA : ratingA - ratingB;
    });
  } else if (sortBy === 'tahun') {
    filteredMovies.sort((a, b) => {
      const tahunA = isNaN(a.tahun) ? 0 : parseInt(a.tahun);
      const tahunB = isNaN(b.tahun) ? 0 : parseInt(b.tahun);
      return order === 'desc' ? tahunB - tahunA : tahunA - tahunB;
    });
  }

  // Pagination
  const total = filteredMovies.length;
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginatedMovies = filteredMovies.slice(start, end);

  // Enrich with TMDB if requested (warning: can be slow for large lists)
  let finalMovies = paginatedMovies;
  if (tmdb === 'true' || tmdb === '1') {
    try {
      // Limit enrichment to max 20 items to avoid timeout
      const maxEnrich = Math.min(paginatedMovies.length, 20);
      const toEnrich = paginatedMovies.slice(0, maxEnrich);
      const enriched = await enrichMovies(toEnrich, true);
      finalMovies = [...enriched, ...paginatedMovies.slice(maxEnrich)];
    } catch (error) {
      console.error('Error enriching movies:', error);
      // Return original movies if enrichment fails
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


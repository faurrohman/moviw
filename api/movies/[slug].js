const moviesData = require('../../data/movie_details_FINAL.json');
const { enrichMovieWithTMDB } = require('../../utils/tmdb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get slug from query parameter (Vercel passes dynamic route params in query)
  const slug = req.query.slug || req.query['[slug]'] || req.url.split('/').pop();
  const { tmdb = 'true' } = req.query; // Default enable TMDB enrichment

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Slug parameter is required'
    });
  }

  const movie = moviesData.find(m => m.slug === slug);

  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found'
    });
  }

  // Enrich with TMDB if requested
  let enrichedMovie = movie;
  if (tmdb === 'true' || tmdb === '1') {
    try {
      enrichedMovie = await enrichMovieWithTMDB(movie);
    } catch (error) {
      console.error('Error enriching movie:', error);
      // Return original movie if enrichment fails
    }
  }

  return res.status(200).json({
    success: true,
    data: enrichedMovie
  });
};


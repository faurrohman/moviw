const API_KEY = "132ee89aea0c5d4f2afb39f9947dd8fe";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";

/**
 * Search movie di TMDB berdasarkan judul dan tahun
 */
async function searchMovie(title, year = null) {
  try {
    let searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
    
    if (year && !isNaN(year) && year !== 'nan') {
      searchUrl += `&year=${year}`;
    }

    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Return first result
    }
    
    return null;
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return null;
  }
}

/**
 * Get movie details dari TMDB berdasarkan movie ID
 */
async function getMovieDetails(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TMDB Details Error:', error);
    return null;
  }
}

/**
 * Get movie details berdasarkan judul dan tahun (combined search + details)
 */
async function getMovieByTitle(title, year = null) {
  const searchResult = await searchMovie(title, year);
  
  if (!searchResult) {
    return null;
  }
  
  const details = await getMovieDetails(searchResult.id);
  return details;
}

/**
 * Enrich movie data dengan metadata dari TMDB
 */
async function enrichMovieWithTMDB(movie) {
  // Skip jika judul null atau tidak ada
  if (!movie.judul || movie.judul === null) {
    return movie;
  }

  // Extract tahun dari judul atau gunakan tahun yang ada
  let year = movie.tahun;
  if (year === 'nan' || !year || isNaN(year)) {
    // Try to extract year from title (e.g., "Movie Name (2024)")
    const yearMatch = movie.judul.match(/\((\d{4})\)/);
    if (yearMatch) {
      year = yearMatch[1];
    }
  }

  // Clean title (remove year in parentheses)
  const cleanTitle = movie.judul.replace(/\s*\(\d{4}\)\s*$/, '').trim();

  try {
    const tmdbData = await getMovieByTitle(cleanTitle, year);
    
    if (tmdbData) {
      // Merge TMDB data dengan data lokal
      return {
        ...movie,
        // TMDB Metadata
        tmdb_id: tmdbData.id,
        tmdb_title: tmdbData.title,
        tmdb_overview: tmdbData.overview || movie.sinopsis,
        tmdb_rating: tmdbData.vote_average,
        tmdb_vote_count: tmdbData.vote_count,
        tmdb_release_date: tmdbData.release_date,
        tmdb_runtime: tmdbData.runtime,
        tmdb_genres: tmdbData.genres?.map(g => g.name) || [],
        tmdb_production_countries: tmdbData.production_countries?.map(c => c.name) || [],
        tmdb_director: tmdbData.credits?.crew?.find(c => c.job === 'Director')?.name || movie.sutradara,
        tmdb_cast: tmdbData.credits?.cast?.slice(0, 10).map(c => ({
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ? `${IMG_URL}${c.profile_path}` : null
        })) || [],
        // Images
        tmdb_poster: tmdbData.poster_path ? `${IMG_URL}${tmdbData.poster_path}` : movie.poster_url,
        tmdb_backdrop: tmdbData.backdrop_path ? `${BACKDROP_URL}${tmdbData.backdrop_path}` : null,
        // Keep original player data
        players: {
          hydrax_servers: movie.hydrax_servers,
          hydrax_count: movie.hydrax_count,
          turbovip_servers: movie.turbovip_servers,
          turbovip_count: movie.turbovip_count,
          p2p_servers: movie.p2p_servers,
          p2p_count: movie.p2p_count,
          cast_servers: movie.cast_servers,
          cast_count: movie.cast_count,
          other_servers: movie.other_servers,
          other_count: movie.other_count,
          total_servers: movie.total_servers
        },
        // Video trailers
        tmdb_trailers: tmdbData.videos?.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube').map(v => ({
          key: v.key,
          name: v.name,
          type: v.type,
          youtube_url: `https://www.youtube.com/watch?v=${v.key}`
        })) || []
      };
    }
  } catch (error) {
    console.error('Error enriching movie:', error);
  }

  // Return original movie if TMDB fetch fails
  return movie;
}

/**
 * Enrich multiple movies (with caching to avoid rate limits)
 */
async function enrichMovies(movies, useCache = true) {
  const cache = new Map();
  const enriched = [];

  for (const movie of movies) {
    // Use cache if available
    if (useCache && cache.has(movie.slug)) {
      enriched.push(cache.get(movie.slug));
      continue;
    }

    const enrichedMovie = await enrichMovieWithTMDB(movie);
    enriched.push(enrichedMovie);
    
    if (useCache) {
      cache.set(movie.slug, enrichedMovie);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return enriched;
}

module.exports = {
  searchMovie,
  getMovieDetails,
  getMovieByTitle,
  enrichMovieWithTMDB,
  enrichMovies,
  IMG_URL,
  BACKDROP_URL,
  BASE_URL,
  API_KEY
};


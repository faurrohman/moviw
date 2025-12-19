// Contoh penggunaan API Movie dengan integrasi TMDB
// Setelah deploy ke Vercel, ganti BASE_URL dengan URL Vercel Anda

const BASE_URL = 'https://your-project.vercel.app';

// Contoh 1: Get semua movies dengan pagination (tanpa TMDB - lebih cepat)
async function getAllMovies() {
  const response = await fetch(`${BASE_URL}/api/movies?limit=10&offset=0`);
  const data = await response.json();
  console.log('All Movies:', data);
}

// Contoh 2: Get movies dengan TMDB enrichment (dengan metadata lengkap)
async function getAllMoviesWithTMDB() {
  const response = await fetch(`${BASE_URL}/api/movies?limit=10&offset=0&tmdb=true`);
  const data = await response.json();
  console.log('Movies with TMDB:', data);
  // Data akan include: tmdb_poster, tmdb_backdrop, tmdb_cast, tmdb_trailers, dll
}

// Contoh 3: Search movies dengan TMDB
async function searchMoviesWithTMDB(searchTerm) {
  const response = await fetch(`${BASE_URL}/api/movies?search=${encodeURIComponent(searchTerm)}&limit=10&tmdb=true`);
  const data = await response.json();
  console.log('Search Results with TMDB:', data);
  
  // Akses data TMDB
  if (data.data && data.data.length > 0) {
    const movie = data.data[0];
    console.log('Poster:', movie.tmdb_poster);
    console.log('Backdrop:', movie.tmdb_backdrop);
    console.log('Cast:', movie.tmdb_cast);
    console.log('Trailers:', movie.tmdb_trailers);
  }
}

// Contoh 4: Filter by genre dan rating dengan TMDB
async function filterMoviesWithTMDB() {
  const response = await fetch(`${BASE_URL}/api/movies?genre=Action&minRating=7&sortBy=rating&order=desc&limit=10&tmdb=true`);
  const data = await response.json();
  console.log('Filtered Movies with TMDB:', data);
}

// Contoh 5: Get movie by slug (default dengan TMDB)
async function getMovieBySlug(slug) {
  const response = await fetch(`${BASE_URL}/api/movies/${slug}`);
  const data = await response.json();
  console.log('Movie Details:', data);
  
  if (data.success && data.data) {
    const movie = data.data;
    console.log('Title:', movie.tmdb_title || movie.judul);
    console.log('TMDB Rating:', movie.tmdb_rating);
    console.log('Poster:', movie.tmdb_poster);
    console.log('Backdrop:', movie.tmdb_backdrop);
    console.log('Cast:', movie.tmdb_cast);
    console.log('Trailers:', movie.tmdb_trailers);
    console.log('Players:', movie.players); // Player links tetap ada
  }
}

// Contoh 6: Get movie tanpa TMDB (hanya data lokal)
async function getMovieWithoutTMDB(slug) {
  const response = await fetch(`${BASE_URL}/api/movies/${slug}?tmdb=false`);
  const data = await response.json();
  console.log('Movie (Local Only):', data);
}

// Contoh 7: Display movie dengan poster dan backdrop
async function displayMovieWithImages(slug) {
  const response = await fetch(`${BASE_URL}/api/movies/${slug}`);
  const data = await response.json();
  
  if (data.success && data.data) {
    const movie = data.data;
    
    // Contoh untuk HTML
    const html = `
      <div class="movie-card">
        <img src="${movie.tmdb_poster || movie.poster_url}" alt="${movie.judul}" />
        <div class="backdrop" style="background-image: url(${movie.tmdb_backdrop})"></div>
        <h2>${movie.tmdb_title || movie.judul}</h2>
        <p>Rating: ${movie.tmdb_rating || movie.rating}/10</p>
        <p>${movie.tmdb_overview || movie.sinopsis}</p>
        <div class="cast">
          ${movie.tmdb_cast?.map(actor => `
            <div class="actor">
              <img src="${actor.profile_path || ''}" alt="${actor.name}" />
              <p>${actor.name} as ${actor.character}</p>
            </div>
          `).join('')}
        </div>
        ${movie.tmdb_trailers?.length > 0 ? `
          <div class="trailers">
            <h3>Trailers:</h3>
            ${movie.tmdb_trailers.map(trailer => `
              <a href="${trailer.youtube_url}" target="_blank">${trailer.name}</a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    console.log(html);
  }
}

// Contoh penggunaan
// getAllMovies();
// getAllMoviesWithTMDB();
// searchMoviesWithTMDB('tron');
// filterMoviesWithTMDB();
// getMovieBySlug('tron-ares-2025');
// getMovieWithoutTMDB('tron-ares-2025');
// displayMovieWithImages('tron-ares-2025');


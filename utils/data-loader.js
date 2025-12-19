const fs = require('fs');
const path = require('path');

let moviesDataCache = null;
let isLoading = false;
let loadPromise = null;

/**
 * Load movies data dengan lazy loading dan caching
 */
function loadMoviesData() {
  // Return cache jika sudah ada
  if (moviesDataCache) {
    return moviesDataCache;
  }

  // Jika sedang loading, return promise yang sama
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    try {
      const dataPath = path.join(__dirname, '../data/movie_details_FINAL.json');
      
      // Check if file exists
      if (!fs.existsSync(dataPath)) {
        throw new Error(`Data file not found at: ${dataPath}`);
      }

      // Read file
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      
      // Parse JSON
      const data = JSON.parse(fileContent);
      
      // Cache the data
      moviesDataCache = data;
      isLoading = false;
      
      console.log(`✅ Loaded ${data.length} movies from cache`);
      resolve(data);
    } catch (error) {
      isLoading = false;
      console.error('❌ Error loading movies data:', error);
      reject(error);
    }
  });

  return loadPromise;
}

/**
 * Get movies data (sync untuk compatibility)
 */
function getMoviesData() {
  if (moviesDataCache) {
    return moviesDataCache;
  }
  
  // Try to load synchronously (for first call)
  try {
    const dataPath = path.join(__dirname, '../data/movie_details_FINAL.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      // Try alternative paths
      const altPaths = [
        path.join(process.cwd(), 'data/movie_details_FINAL.json'),
        path.join(__dirname, '../../data/movie_details_FINAL.json'),
        './data/movie_details_FINAL.json'
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`✅ Found data at: ${altPath}`);
          const fileContent = fs.readFileSync(altPath, 'utf8');
          const data = JSON.parse(fileContent);
          moviesDataCache = data;
          console.log(`✅ Loaded ${data.length} movies`);
          return data;
        }
      }
      
      throw new Error(`Data file not found. Tried: ${dataPath} and alternatives`);
    }

    // Get file size for logging
    const stats = fs.statSync(dataPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Loading data file: ${fileSizeInMB} MB`);

    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    moviesDataCache = data;
    console.log(`✅ Loaded ${data.length} movies (${fileSizeInMB} MB)`);
    return data;
  } catch (error) {
    console.error('❌ Error loading movies data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      path: error.path || 'unknown'
    });
    throw error;
  }
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  moviesDataCache = null;
  isLoading = false;
  loadPromise = null;
}

module.exports = {
  loadMoviesData,
  getMoviesData,
  clearCache
};


// Test script untuk API Movie
// Jalankan dengan: node test-api.js

const BASE_URL = 'https://moviw-7oba.vercel.app';

// Colors untuk console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url) {
  try {
    log(`\n🧪 Testing: ${name}`, 'cyan');
    log(`   URL: ${url}`, 'blue');
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ Status: ${response.status} (${duration}ms)`, 'green');
      log(`   📦 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, 'reset');
      return { success: true, data, duration };
    } else {
      log(`   ❌ Status: ${response.status}`, 'red');
      log(`   Error: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, data, duration };
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('🚀 Starting API Tests...', 'yellow');
  log(`📍 Base URL: ${BASE_URL}\n`, 'blue');
  
  const results = [];
  
  // Test 1: Root endpoint
  results.push(await testEndpoint(
    'Root Endpoint',
    `${BASE_URL}/api/`
  ));
  
  // Test 2: Get all movies (simple)
  results.push(await testEndpoint(
    'Get All Movies (Simple)',
    `${BASE_URL}/api/movies?limit=5`
  ));
  
  // Test 3: Search movies
  results.push(await testEndpoint(
    'Search Movies',
    `${BASE_URL}/api/movies?search=tron&limit=3`
  ));
  
  // Test 4: Get movie by slug (without TMDB)
  results.push(await testEndpoint(
    'Get Movie by Slug (No TMDB)',
    `${BASE_URL}/api/movies/tron-ares-2025?tmdb=false`
  ));
  
  // Test 5: Get movie by slug (with TMDB)
  results.push(await testEndpoint(
    'Get Movie by Slug (With TMDB)',
    `${BASE_URL}/api/movies/tron-ares-2025?tmdb=true`
  ));
  
  // Test 6: Filter by genre
  results.push(await testEndpoint(
    'Filter by Genre',
    `${BASE_URL}/api/movies?genre=Action&limit=3`
  ));
  
  // Test 7: Filter by rating
  results.push(await testEndpoint(
    'Filter by Min Rating',
    `${BASE_URL}/api/movies?minRating=7&limit=3`
  ));
  
  // Test 8: List with TMDB (limited)
  results.push(await testEndpoint(
    'List Movies with TMDB',
    `${BASE_URL}/api/movies?search=action&tmdb=true&limit=2`
  ));
  
  // Summary
  log('\n' + '='.repeat(50), 'yellow');
  log('📊 Test Summary', 'yellow');
  log('='.repeat(50), 'yellow');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`, 'blue');
  log('='.repeat(50) + '\n', 'yellow');
}

// Run tests
runTests().catch(console.error);


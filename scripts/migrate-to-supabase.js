/**
 * Script untuk migrate data JSON ke Supabase PostgreSQL
 * 
 * Usage:
 * 1. Buat Supabase project: https://supabase.com
 * 2. Set DATABASE_URL di environment variable
 * 3. Run: node scripts/migrate-to-supabase.js
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let DATABASE_URL = process.env.DATABASE_URL;
const TABLE_NAME = process.env.TABLE_NAME || 'movies';

// Fix common .env file issues
if (DATABASE_URL && DATABASE_URL.startsWith('DATABASE_URL=')) {
  // Remove the key name if it's included in the value
  DATABASE_URL = DATABASE_URL.replace(/^DATABASE_URL=/, '');
}

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL must be set');
  console.error('   Set it in .env file or environment variables');
  console.error('   Format: postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres');
  console.error('');
  console.error('   Make sure your .env file contains:');
  console.error('   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres');
  process.exit(1);
}

// Validate DATABASE_URL format - check for placeholders
const placeholderPatterns = [
  /\[YOUR-PASSWORD\]/i,
  /\[PASSWORD\]/i,
  /\[.*PASSWORD.*\]/i,
  /\[.*\]/  // Any placeholder in brackets like [Masuk12*]
];

const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(DATABASE_URL)) || 
                       DATABASE_URL.includes('xxxxx') ||
                       DATABASE_URL.includes('[YOUR-PASSWORD]') ||
                       DATABASE_URL.includes('[PASSWORD]');

if (hasPlaceholder) {
  console.error('❌ Error: DATABASE_URL contains placeholder values!');
  console.error('');
  console.error('   Your DATABASE_URL:', DATABASE_URL.substring(0, 100) + '...');
  console.error('');
  
  // Extract placeholder if found
  const placeholderMatch = DATABASE_URL.match(/\[([^\]]+)\]/);
  if (placeholderMatch) {
    console.error('   Found placeholder:', placeholderMatch[0]);
    console.error('');
    console.error('   📝 Cara memperbaiki:');
    console.error('   1. Ganti placeholder dengan password sebenarnya');
    console.error('   2. Jika password mengandung karakter khusus (*, #, @), encode dengan URL encoding');
    console.error('');
    console.error('   Contoh untuk password "Masuk12*":');
    console.error('   - Ganti [Masuk12*] dengan Masuk12%2A');
    console.error('   - * menjadi %2A');
    console.error('');
    console.error('   Format yang benar:');
    console.error('   DATABASE_URL=postgresql://postgres.nzcbrkfhydyrjcynljlu:Masuk12%2A@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
    console.error('');
    console.error('   Atau biarkan script auto-encode, cukup ganti [Masuk12*] dengan Masuk12*:');
    console.error('   DATABASE_URL=postgresql://postgres.nzcbrkfhydyrjcynljlu:Masuk12*@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  } else {
    console.error('   📝 Please update your .env file with the actual connection string:');
    console.error('   1. Go to Supabase Dashboard → Settings → Database');
    console.error('   2. Scroll to "Connection string" section');
    console.error('   3. Select "Transaction mode" tab');
    console.error('   4. Copy the connection string');
    console.error('   5. Replace [YOUR-PASSWORD] with your actual database password');
    console.error('   6. Update DATABASE_URL in .env file');
  }
  process.exit(1);
}

// Check if password contains special characters that need URL encoding
// Handle both formats: postgres:password@ and postgres.PROJECT-REF:password@
let urlMatch = DATABASE_URL.match(/postgresql:\/\/(postgres(?:\.[^:]+)?):([^@]+)@/);
if (urlMatch && urlMatch[2]) {
  const username = urlMatch[1];
  let password = urlMatch[2];
  
  // Check if password is still a placeholder
  if (password.includes('[') && password.includes(']')) {
    console.error('❌ Error: Password masih menggunakan placeholder!');
    console.error('');
    console.error('   Password Anda:', password);
    console.error('');
    console.error('   📝 Ganti [Masuk12*] dengan password sebenarnya di .env file');
    console.error('   Contoh:');
    console.error('   DATABASE_URL=postgresql://postgres.nzcbrkfhydyrjcynljlu:Masuk12%2A@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
    console.error('');
    console.error('   Catatan: Karakter * perlu di-encode menjadi %2A');
    process.exit(1);
  }
  
  // Decode first to get original password
  let decodedPassword;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch (e) {
    decodedPassword = password; // If already decoded or invalid, use as is
  }
  
  // If password contains special characters, encode it
  const specialChars = /[*#@&=+% ]/;
  if (specialChars.test(decodedPassword)) {
    console.log('🔧 Detected special characters in password, encoding...');
    const encodedPassword = encodeURIComponent(decodedPassword);
    // Replace password in URL (handle both postgres: and postgres.PROJECT-REF: formats)
    DATABASE_URL = DATABASE_URL.replace(/postgresql:\/\/(postgres(?:\.[^:]+)?):[^@]+@/, `postgresql://${username}:${encodedPassword}@`);
    console.log('   ✅ Password encoded');
  }
}

// Validate URL format
try {
  new URL(DATABASE_URL);
} catch (urlError) {
  console.error('❌ Error: Invalid DATABASE_URL format!');
  console.error('');
  console.error('   Error:', urlError.message);
  console.error('   Your DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...');
  console.error('');
  console.error('   📝 Common issues:');
  console.error('   1. Password contains special characters (*, #, @, etc.) - these need to be URL encoded');
  console.error('   2. Missing quotes in .env file if password has spaces');
  console.error('   3. Extra spaces or newlines in .env file');
  console.error('');
  console.error('   💡 Solution:');
  console.error('   - If password has special characters, use URL encoding:');
  console.error('     * becomes %2A');
  console.error('     # becomes %23');
  console.error('     @ becomes %40');
  console.error('     Space becomes %20');
  console.error('   - Or wrap the entire DATABASE_URL in quotes in .env file');
  console.error('');
  console.error('   Example with encoded password:');
  console.error('   DATABASE_URL=postgresql://postgres:password%2A123@db.xxx.supabase.co:5432/postgres');
  process.exit(1);
}

async function migrateToSupabase() {
  let sql;
  
  try {
    console.log('🚀 Starting migration to Supabase PostgreSQL...');
    console.log(`📦 Table: ${TABLE_NAME}\n`);

    // Connect to PostgreSQL
    console.log('🔌 Connecting to PostgreSQL...');
    console.log(`   Host: ${new URL(DATABASE_URL).hostname}`);
    
    sql = postgres(DATABASE_URL, {
      max: 1, // Single connection for migration
      idle_timeout: 20,
      connect_timeout: 30, // Increase timeout for slow connections
      // Optimized for transaction pooler
      prepare: false, // Disable prepared statements for pooler compatibility
    });
    
    // Test connection
    try {
      await sql`SELECT 1 as test`;
      console.log('✅ Connected to PostgreSQL\n');
    } catch (connectError) {
      if (connectError.code === 'ENOTFOUND') {
        console.error('\n❌ DNS Error: Cannot resolve hostname');
        console.error('');
        console.error('   This usually means:');
        console.error('   1. Your network doesn\'t support IPv6 (Supabase uses IPv6 by default)');
        console.error('   2. Hostname is incorrect');
        console.error('   3. Internet connection issue');
        console.error('');
        console.error('   💡 Solution: Use Session Mode Connection String');
        console.error('');
        console.error('   Steps:');
        console.error('   1. Go to Supabase Dashboard → Settings → Database');
        console.error('   2. Scroll to "Connection string" section');
        console.error('   3. Select "Session mode" tab (NOT "URI" tab)');
        console.error('   4. Copy the connection string');
        console.error('   5. Update DATABASE_URL in .env file');
        console.error('');
        console.error('   Session mode format:');
        console.error('   postgresql://postgres:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres');
        console.error('');
        throw new Error('DNS resolution failed. Please use Session Mode connection string.');
      }
      throw connectError;
    }

    // Load JSON file
    console.log('📂 Loading JSON file...');
    const jsonPath = path.join(__dirname, '../data/movie_details_FINAL.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    
    console.log('🧹 Cleaning JSON (replacing NaN with null)...');
    
    // Replace NaN with null (JSON doesn't support NaN)
    // Use comprehensive regex to catch all NaN patterns
    let cleanedContent = fileContent
      // Replace unquoted NaN (most common)
      .replace(/:\s*NaN\s*([,}\]])/g, ': null$1')
      .replace(/:\s*NaN\s*$/gm, ': null')
      // Replace quoted "nan" or "NaN"
      .replace(/:\s*"nan"\s*([,}\]])/gi, ': null$1')
      .replace(/:\s*"NaN"\s*([,}\]])/g, ': null$1')
      // Replace standalone NaN (not preceded by colon, for arrays)
      .replace(/,\s*NaN\s*([,}\]])/g, ', null$1')
      .replace(/\[\s*NaN\s*([,}\]])/g, '[ null$1')
      // Final pass: replace any remaining NaN (be careful with this)
      .replace(/([^a-zA-Z])NaN([^a-zA-Z])/g, '$1null$2');
    
    // Try to parse JSON
    let movies;
    try {
      movies = JSON.parse(cleanedContent);
      console.log('   ✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('   Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
      
      // Try to find the problematic area
      if (parseError.message.includes('position')) {
        const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
        const start = Math.max(0, pos - 100);
        const end = Math.min(cleanedContent.length, pos + 100);
        console.error('   Problematic area:', cleanedContent.substring(start, end));
      }
      
      // Last resort: replace ALL NaN (including in strings - not ideal but works)
      try {
        console.log('   🔄 Trying aggressive NaN replacement...');
        cleanedContent = fileContent.replace(/NaN/g, 'null').replace(/"nan"/gi, 'null');
        movies = JSON.parse(cleanedContent);
        console.log('   ✅ Parsed with aggressive replacement');
      } catch (finalError) {
        throw new Error(`Failed to parse JSON after cleaning: ${finalError.message}`);
      }
    }
    
    console.log(`✅ Loaded ${movies.length} movies from JSON\n`);

    // Check if table exists and get count
    console.log('📊 Checking existing data...');
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM ${sql(TABLE_NAME)}
    `;
    console.log(`   Existing records: ${existingCount[0]?.count || 0}\n`);

    // Prepare movies data
    console.log('🔄 Preparing data...');
    const moviesToInsert = movies.map(movie => {
      // Convert NaN to null and clean data
      const cleanMovie = {};
      for (const [key, value] of Object.entries(movie)) {
        if (value === 'nan' || (typeof value === 'number' && isNaN(value))) {
          cleanMovie[key] = null;
        } else if (value === null || value === undefined) {
          cleanMovie[key] = null;
        } else {
          cleanMovie[key] = value;
        }
      }
      
      return {
        ...cleanMovie,
        created_at: new Date(),
        updated_at: new Date()
      };
    });
    console.log(`✅ Prepared ${moviesToInsert.length} movies\n`);

    // Insert movies in batches
    console.log('📤 Inserting movies to PostgreSQL...');
    const batchSize = 500; // Smaller batch for PostgreSQL
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < moviesToInsert.length; i += batchSize) {
      const batch = moviesToInsert.slice(i, i + batchSize);
      
      try {
        // Use INSERT ... ON CONFLICT for upsert
        const values = batch.map(movie => sql`${sql(movie)}`);
        
        // Build query manually for better performance
        const query = `
          INSERT INTO ${sql(TABLE_NAME)} (${Object.keys(batch[0]).join(', ')})
          VALUES ${batch.map((_, idx) => 
            `(${Object.keys(batch[0]).map((_, i) => `$${idx * Object.keys(batch[0]).length + i + 1}`).join(', ')})`
          ).join(', ')}
          ON CONFLICT (slug) DO UPDATE SET
            ${Object.keys(batch[0]).filter(k => k !== 'slug').map(k => `${k} = EXCLUDED.${k}`).join(', ')},
            updated_at = NOW()
        `;

        // Flatten values for parameters
        const flatValues = batch.flatMap(movie => Object.values(movie));
        
        const result = await sql.unsafe(query, flatValues);
        
        inserted += batch.length;
        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: Processed ${batch.length} movies (Total: ${inserted}/${movies.length})`);
      } catch (error) {
        console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        errors++;
        
        // Try inserting one by one if batch fails
        for (const movie of batch) {
          try {
            await sql`
              INSERT INTO ${sql(TABLE_NAME)} ${sql(movie)}
              ON CONFLICT (slug) DO UPDATE SET
                ${sql({
                  ...movie,
                  updated_at: new Date()
                })}
            `;
            inserted++;
          } catch (err) {
            console.error(`    ⚠️ Failed to insert ${movie.slug}:`, err.message);
            errors++;
          }
        }
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Total processed: ${inserted} movies`);
    console.log(`   Errors: ${errors} items`);

    // Get final count
    const finalCount = await sql`
      SELECT COUNT(*) as count FROM ${sql(TABLE_NAME)}
    `;
    
    console.log(`   Final records in database: ${finalCount[0]?.count || 0}\n`);

    // Check indexes
    console.log('📊 Checking indexes...');
    const indexes = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = ${TABLE_NAME}
    `;
    
    if (indexes.length > 0) {
      console.log(`   Found ${indexes.length} indexes:`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('   ⚠️ No indexes found. Consider creating indexes for better performance.');
      console.log('   See SUPABASE_SETUP.md for SQL to create indexes.');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Disconnected from PostgreSQL');
    }
  }
}

// Run migration
if (require.main === module) {
  migrateToSupabase()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToSupabase };

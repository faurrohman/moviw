/**
 * Script untuk migrate data CSV ke Supabase PostgreSQL
 * 
 * Usage:
 * 1. Buat Supabase project: https://supabase.com
 * 2. Set DATABASE_URL di environment variable
 * 3. Run: node scripts/migrate-csv-to-supabase.js
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

let DATABASE_URL = process.env.DATABASE_URL;
const TABLE_NAME = process.env.TABLE_NAME || 'movies';

// Fix common .env file issues
if (DATABASE_URL && DATABASE_URL.startsWith('DATABASE_URL=')) {
  DATABASE_URL = DATABASE_URL.replace(/^DATABASE_URL=/, '');
}

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL must be set');
  console.error('   Set it in .env file or environment variables');
  console.error('   Format: postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres');
  process.exit(1);
}

// Validate DATABASE_URL format - check for placeholders
const placeholderPatterns = [
  /\[YOUR-PASSWORD\]/i,
  /\[PASSWORD\]/i,
  /\[.*PASSWORD.*\]/i,
  /\[.*\]/
];

const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(DATABASE_URL)) || 
                       DATABASE_URL.includes('xxxxx');

if (hasPlaceholder) {
  console.error('❌ Error: DATABASE_URL contains placeholder values!');
  console.error('   Please update your .env file with the actual connection string');
  process.exit(1);
}

// Check if password contains special characters that need URL encoding
let urlMatch = DATABASE_URL.match(/postgresql:\/\/(postgres(?:\.[^:]+)?):([^@]+)@/);
if (urlMatch && urlMatch[2]) {
  const username = urlMatch[1];
  let password = urlMatch[2];
  
  if (password.includes('[') && password.includes(']')) {
    console.error('❌ Error: Password masih menggunakan placeholder!');
    process.exit(1);
  }
  
  let decodedPassword;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch (e) {
    decodedPassword = password;
  }
  
  const specialChars = /[*#@&=+% ]/;
  if (specialChars.test(decodedPassword)) {
    console.log('🔧 Detected special characters in password, encoding...');
    const encodedPassword = encodeURIComponent(decodedPassword);
    DATABASE_URL = DATABASE_URL.replace(/postgresql:\/\/(postgres(?:\.[^:]+)?):[^@]+@/, `postgresql://${username}:${encodedPassword}@`);
    console.log('   ✅ Password encoded');
  }
}

// Validate URL format
try {
  new URL(DATABASE_URL);
} catch (urlError) {
  console.error('❌ Error: Invalid DATABASE_URL format!');
  console.error('   Error:', urlError.message);
  process.exit(1);
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Clean data: convert empty strings to null, parse numbers
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
          if (value === '' || value === undefined) {
            cleaned[key] = null;
          } else if (key === 'rating' || key === 'votes') {
            // Parse numeric fields
            const num = parseFloat(value);
            cleaned[key] = isNaN(num) ? null : num;
          } else if (key === 'jumlah_cast') {
            // Parse integer
            const num = parseInt(value);
            cleaned[key] = isNaN(num) ? 0 : num;
          } else {
            cleaned[key] = value;
          }
        }
        results.push(cleaned);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function migrateCSVToSupabase() {
  let sql;
  
  try {
    console.log('🚀 Starting migration from CSV to Supabase PostgreSQL...');
    console.log(`📦 Table: ${TABLE_NAME}\n`);

    // Connect to PostgreSQL
    console.log('🔌 Connecting to PostgreSQL...');
    console.log(`   Host: ${new URL(DATABASE_URL).hostname}`);
    
    sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false,
    });
    
    // Test connection
    try {
      await sql`SELECT 1 as test`;
      console.log('✅ Connected to PostgreSQL\n');
    } catch (connectError) {
      if (connectError.code === 'ENOTFOUND') {
        console.error('\n❌ DNS Error: Cannot resolve hostname');
        console.error('   💡 Solution: Use Transaction Mode Connection String');
        console.error('   Go to Supabase Dashboard → Settings → Database → Connection string → Transaction mode');
        throw new Error('DNS resolution failed. Please use Transaction Mode connection string.');
      }
      throw connectError;
    }

    // Check if table exists and show structure
    console.log('📊 Checking table structure...');
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${TABLE_NAME}
        ORDER BY ordinal_position
      `;
      
      if (tableInfo.length === 0) {
        console.error('❌ Table does not exist!');
        console.error('   Please run the SQL script first: scripts/create-movies-table.sql');
        console.error('   Or create the table manually in Supabase SQL Editor');
        process.exit(1);
      }
      
      console.log(`   ✅ Table exists with ${tableInfo.length} columns`);
      console.log(`   Columns: ${tableInfo.map(c => c.column_name).join(', ')}`);
      
      // Expected columns from CSV (cast is quoted because it's a reserved word)
      const expectedColumns = ['slug', 'judul', 'url', 'tahun', 'genre', 'rating', 'quality', 'durasi', 'negara', 'sutradara', 'cast', 'jumlah_cast', 'sinopsis', 'poster_url', 'votes', 'release_date', 'hydrax_servers', 'turbovip_servers', 'p2p_servers', 'cast_servers'];
      const existingColumns = tableInfo.map(c => c.column_name);
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.error(`\n❌ Missing columns in table: ${missingColumns.join(', ')}`);
        console.error('   Please run the SQL script: scripts/create-movies-table.sql');
        console.error('   Or add the missing columns manually in Supabase SQL Editor');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error checking table:', error.message);
      process.exit(1);
    }

    // Load CSV file
    console.log('\n📂 Loading CSV file...');
    const csvPath = path.join(__dirname, '../DataMovie.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const movies = await readCSV(csvPath);
    console.log(`✅ Loaded ${movies.length} movies from CSV\n`);

    // Check existing data
    console.log('📊 Checking existing data...');
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM ${sql(TABLE_NAME)}
    `;
    console.log(`   Existing records: ${existingCount[0]?.count || 0}\n`);

    // Prepare movies data
    console.log('🔄 Preparing data...');
    const moviesToInsert = movies.map(movie => ({
      ...movie,
      created_at: new Date(),
      updated_at: new Date()
    }));
    console.log(`✅ Prepared ${moviesToInsert.length} movies\n`);

    // Insert movies in batches
    console.log('📤 Inserting movies to PostgreSQL...');
    const batchSize = 500;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < moviesToInsert.length; i += batchSize) {
      const batch = moviesToInsert.slice(i, i + batchSize);
      
      // Insert one by one (more reliable)
      for (const movie of batch) {
        try {
          const movieCols = Object.keys(movie).filter(k => k !== 'created_at' && k !== 'updated_at');
          const values = movieCols.map(col => {
            const val = movie[col];
            return (val === null || val === undefined || val === '') ? null : val;
          });
          
          // Build query with parameterized placeholders
          // Quote 'cast' because it's a reserved word in PostgreSQL
          const quoteColumn = (col) => col === 'cast' ? '"cast"' : col;
          const columnsStr = movieCols.map(quoteColumn).join(', ');
          const placeholdersStr = movieCols.map((_, i) => `$${i + 1}`).join(', ');
          const updateStr = movieCols.filter(k => k !== 'slug').map(k => `${quoteColumn(k)} = EXCLUDED.${quoteColumn(k)}`).join(', ');
          
          const query = `
            INSERT INTO ${TABLE_NAME} (${columnsStr}, created_at, updated_at)
            VALUES (${placeholdersStr}, NOW(), NOW())
            ON CONFLICT (slug) DO UPDATE SET
              ${updateStr},
              updated_at = NOW()
          `;
          
          await sql.unsafe(query, values);
          inserted++;
        } catch (err) {
          console.error(`    ⚠️ Failed to insert ${movie.slug || 'unknown'}:`, err.message);
          if (err.message.includes('column') && err.message.includes('does not exist')) {
            console.error(`      This suggests the table structure doesn't match. Please check your table schema.`);
          }
          errors++;
        }
      }
      
      // Progress update every 100 items or at end
      if (inserted % 100 === 0 || i + batchSize >= moviesToInsert.length) {
        console.log(`  ✅ Processed ${inserted}/${movies.length} movies`);
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
  migrateCSVToSupabase()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCSVToSupabase };


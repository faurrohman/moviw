/**
 * Script untuk membuat tabel movies di Supabase secara otomatis
 * 
 * Usage:
 * node scripts/setup-table.js
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
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

const CREATE_TABLE_SQL = `
-- Drop table if exists (optional - uncomment if you want to start fresh)
DROP TABLE IF EXISTS ${TABLE_NAME} CASCADE;

-- Create movies table (matching DataMovie.csv structure)
CREATE TABLE ${TABLE_NAME} (
  slug TEXT PRIMARY KEY,
  judul TEXT,
  url TEXT,
  tahun TEXT,
  genre TEXT,
  rating NUMERIC,
  quality TEXT,
  durasi TEXT,
  negara TEXT,
  sutradara TEXT,
  "cast" TEXT,
  jumlah_cast INTEGER DEFAULT 0,
  sinopsis TEXT,
  poster_url TEXT,
  votes NUMERIC,
  release_date TEXT,
  hydrax_servers TEXT,
  turbovip_servers TEXT,
  p2p_servers TEXT,
  cast_servers TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_judul ON ${TABLE_NAME}(judul);
CREATE INDEX IF NOT EXISTS idx_movies_tahun ON ${TABLE_NAME}(tahun);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON ${TABLE_NAME}(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON ${TABLE_NAME} USING gin(to_tsvector('english', genre));
CREATE INDEX IF NOT EXISTS idx_movies_slug ON ${TABLE_NAME}(slug);
`;

async function setupTable() {
  let sql;
  
  try {
    console.log('🚀 Setting up movies table in Supabase...');
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
        throw new Error('DNS resolution failed.');
      }
      throw connectError;
    }

    // Check if table exists
    console.log('📊 Checking existing table...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${TABLE_NAME}
      )
    `;
    
    if (tableExists[0].exists) {
      console.log(`   ⚠️ Table ${TABLE_NAME} already exists`);
      
      // Check columns
      const tableInfo = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${TABLE_NAME}
        ORDER BY ordinal_position
      `;
      
      const existingColumns = tableInfo.map(c => c.column_name);
      const expectedColumns = ['slug', 'judul', 'url', 'tahun', 'genre', 'rating', 'quality', 'durasi', 'negara', 'sutradara', 'cast', 'jumlah_cast', 'sinopsis', 'poster_url', 'votes', 'release_date', 'hydrax_servers', 'turbovip_servers', 'p2p_servers', 'cast_servers', 'created_at', 'updated_at'];
      const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`   ⚠️ Missing columns: ${missingColumns.join(', ')}`);
        console.log(`   🔄 Recreating table...\n`);
      } else {
        console.log(`   ✅ Table structure is correct (${existingColumns.length} columns)`);
        console.log(`   Columns: ${existingColumns.join(', ')}\n`);
        console.log('✅ Table is ready!\n');
        return;
      }
    } else {
      console.log(`   ℹ️ Table ${TABLE_NAME} does not exist`);
      console.log(`   🔄 Creating table...\n`);
    }

    // Create table
    console.log('📝 Creating table...');
    await sql.unsafe(CREATE_TABLE_SQL);
    console.log('✅ Table created successfully!\n');

    // Verify table creation
    console.log('📊 Verifying table structure...');
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${TABLE_NAME}
      ORDER BY ordinal_position
    `;
    
    console.log(`   ✅ Table has ${tableInfo.length} columns:`);
    tableInfo.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check indexes
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = ${TABLE_NAME}
    `;
    
    console.log(`\n   ✅ Created ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    console.log('\n✅ Table setup completed successfully!\n');
    console.log('💡 Next step: Run migration with: npm run migrate\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
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

// Run setup
if (require.main === module) {
  setupTable()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTable };


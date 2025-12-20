/**
 * Script untuk migrate data JSON ke MongoDB
 * 
 * Usage:
 * 1. Buat MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas
 * 2. Buat database dan collection
 * 3. Set MONGODB_URI di environment variable
 * 4. Run: node scripts/migrate-to-mongodb.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movies';
const DB_NAME = process.env.DB_NAME || 'movies';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'movies';

async function migrateToMongoDB() {
  let client;
  
  try {
    console.log('🚀 Starting migration to MongoDB...');
    console.log(`📦 Database: ${DB_NAME}`);
    console.log(`📋 Collection: ${COLLECTION_NAME}\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Load JSON file
    console.log('📂 Loading JSON file...');
    const jsonPath = path.join(__dirname, '../data/movie_details_FINAL.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const movies = JSON.parse(fileContent);
    console.log(`✅ Loaded ${movies.length} movies from JSON\n`);

    // Clear existing data (optional)
    console.log('🗑️  Clearing existing data...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents\n`);

    // Insert movies in batches
    console.log('📤 Inserting movies to MongoDB...');
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      // Add index on slug for faster queries
      const batchWithIndex = batch.map(movie => ({
        ...movie,
        _id: movie.slug, // Use slug as _id for uniqueness
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = await collection.insertMany(batchWithIndex, { 
        ordered: false // Continue on duplicate key errors
      });
      
      inserted += result.insertedCount;
      console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.insertedCount} movies (Total: ${inserted}/${movies.length})`);
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Total inserted: ${inserted} movies`);

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    await collection.createIndex({ slug: 1 }, { unique: true });
    await collection.createIndex({ judul: 1 }); // For search
    await collection.createIndex({ tahun: 1 });
    await collection.createIndex({ rating: -1 });
    await collection.createIndex({ 'tmdb_id': 1 });
    // Text index (optional - uncomment if needed)
    // await collection.createIndex({ judul: 'text', sinopsis: 'text' });
    console.log('✅ Indexes created\n');

    // Get collection stats
    const stats = await collection.stats();
    console.log('📈 Collection Stats:');
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration
if (require.main === module) {
  migrateToMongoDB()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMongoDB };


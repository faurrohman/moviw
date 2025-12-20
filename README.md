# Movie API

API untuk mengakses data movie menggunakan Vercel Serverless Functions dengan integrasi TMDB dan Supabase (PostgreSQL).

## 🚀 Fitur

- ✅ Data player/streaming links dari Supabase PostgreSQL
- ✅ Metadata lengkap dari TMDB (poster, backdrop, rating, cast, dll)
- ✅ Search & Filter yang cepat dengan PostgreSQL
- ✅ Pagination
- ✅ CORS enabled
- ✅ Scalable dengan database
- ✅ Free tier tersedia

## 📋 Prerequisites

1. **Supabase Account** (Free tier available)
   - Sign up di: https://supabase.com
   - Free tier: 500MB database, unlimited API requests

2. **Vercel Account**
   - Sign up di: https://vercel.com

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd movie-api
npm install
```

### 2. Setup Supabase

Ikuti panduan lengkap di: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

**Quick Setup:**
1. Buat Supabase project (free) di https://supabase.com
2. Dapatkan Project URL dan API Keys dari Settings → API
3. Buat table `movies` via SQL Editor (lihat SUPABASE_SETUP.md)
4. Set environment variables

### 3. Migrate Data ke Supabase

```bash
# Buat file .env
cp .env.example .env

# Edit .env dan masukkan Supabase credentials:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# SUPABASE_KEY=your-anon-key
# TABLE_NAME=movies

# Run migration
npm run migrate
```

### 4. Deploy ke Vercel

Ikuti panduan lengkap di: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**Quick Deploy:**
1. Set environment variables di Vercel Dashboard:
   - `DATABASE_URL`: Connection string dari Supabase (Transaction Mode)
   - `TABLE_NAME`: `movies` (optional)

2. Deploy via Vercel Dashboard atau CLI:
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

## 📡 Endpoints

### 1. Get All Movies
```
GET /api/movies
```

**Query Parameters:**
- `search` - Cari berdasarkan judul, slug, atau sinopsis
- `limit` - Jumlah data per halaman (default: 50)
- `offset` - Offset untuk pagination (default: 0)
- `genre` - Filter berdasarkan genre
- `tahun` - Filter berdasarkan tahun
- `minRating` - Filter minimum rating
- `sortBy` - Sort by: `rating` atau `tahun` (default: `rating`)
- `order` - Order: `asc` atau `desc` (default: `desc`)
- `tmdb` - Enable TMDB enrichment: `true` atau `false` (default: `false`)

**Contoh:**
```
GET /api/movies?search=action&limit=10&minRating=7&sortBy=rating&order=desc
GET /api/movies?search=tron&tmdb=true&limit=10
```

### 2. Get Movie by Slug (dengan TMDB)
```
GET /api/movies/[slug]
```

**Query Parameters:**
- `tmdb` - Enable TMDB enrichment: `true` atau `false` (default: `true`)

**Contoh:**
```
GET /api/movies/tron-ares-2025
GET /api/movies/tron-ares-2025?tmdb=false
```

### 3. Root Endpoint
```
GET /api/
```

Sama seperti `/api/movies` dengan semua query parameters yang sama.

## 📦 Response Format

### Success Response (dengan TMDB)
```json
{
  "success": true,
  "total": 1000,
  "limit": 50,
  "offset": 0,
  "tmdb_enriched": true,
  "data": [
    {
      "slug": "tron-ares-2025",
      "judul": "Tron: Ares (2025)",
      "url": "https://tv7.lk21official.cc/tron-ares-2025",
      "tahun": "2025",
      "genre": "Action, Adventure, Sci-fi",
      "rating": 6.5,
      "players": {
        "hydrax_servers": "...",
        "turbovip_servers": "...",
        "total_servers": 5
      },
      "tmdb_id": 123456,
      "tmdb_title": "Tron: Ares",
      "tmdb_overview": "Full synopsis from TMDB...",
      "tmdb_rating": 7.2,
      "tmdb_vote_count": 1234,
      "tmdb_release_date": "2025-01-01",
      "tmdb_runtime": 120,
      "tmdb_genres": ["Action", "Adventure", "Science Fiction"],
      "tmdb_production_countries": ["United States"],
      "tmdb_director": "Joachim Ronning",
      "tmdb_cast": [
        {
          "name": "Jared Leto",
          "character": "Ares",
          "profile_path": "https://image.tmdb.org/t/p/w500/..."
        }
      ],
      "tmdb_poster": "https://image.tmdb.org/t/p/w500/...",
      "tmdb_backdrop": "https://image.tmdb.org/t/p/original/...",
      "tmdb_trailers": [
        {
          "key": "abc123",
          "name": "Official Trailer",
          "type": "Trailer",
          "youtube_url": "https://www.youtube.com/watch?v=abc123"
        }
      ]
    }
  ]
}
```

## 🔧 Environment Variables

Set di Vercel Dashboard → Settings → Environment Variables:

- `DATABASE_URL` - PostgreSQL connection string dari Supabase (required)
  - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
  - Dapatkan dari: Supabase Dashboard → Settings → Database → Connection string → Transaction mode
- `TABLE_NAME` - Table name (optional, default: `movies`)

**Catatan:** 
- Gunakan **Transaction Mode** connection string untuk serverless/Vercel
- Jika password mengandung karakter khusus, encode dengan URL encoding
- Lihat [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) untuk detail lengkap

## 🧪 Testing

Lihat [test-api.md](./test-api.md) untuk panduan testing.

## 📚 Dokumentasi

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Setup database dan import data
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) - Panduan lengkap deploy ke Vercel
- [Deployment Notes](./DEPLOYMENT.md) - Catatan deployment (legacy)
- [Test API](./test-api.md) - Panduan testing API

## 🐛 Troubleshooting

### Error: "relation 'movies' does not exist"
- Pastikan table sudah dibuat di Supabase
- Cek nama table di SQL Editor atau Table Editor

### Error: "new row violates row-level security policy"
- Pastikan RLS policy sudah dibuat
- Atau disable RLS untuk testing (lihat SUPABASE_SETUP.md)

### Error: "permission denied"
- Pastikan menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk migration
- Pastikan anon key memiliki permission yang cukup untuk API

### Error: "connection timeout"
- Pastikan SUPABASE_URL benar
- Cek network/firewall settings
- Pastikan project masih aktif

## 📊 Supabase Free Tier Limits

- **Database Size**: 500 MB (cukup untuk ~100k movies)
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited (dengan rate limiting)
- **Storage**: 1 GB
- **Backup**: 7 days retention

## 🎯 Keuntungan Menggunakan Supabase

✅ **Lebih cepat** - Query teroptimasi dengan PostgreSQL indexes  
✅ **Scalable** - Bisa handle jutaan records  
✅ **Efficient** - Hanya load data yang diperlukan  
✅ **Search** - Full-text search dengan PostgreSQL  
✅ **No file size limit** - Tidak ada batasan 35MB  
✅ **Real-time** - Bisa enable real-time subscriptions  
✅ **Auth built-in** - Bisa tambahkan authentication jika perlu  
✅ **Storage** - Bisa simpan file/images juga  

## 📝 License

MIT

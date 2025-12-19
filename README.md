# Movie API

API untuk mengakses data movie menggunakan Vercel Serverless Functions dengan integrasi TMDB untuk metadata lengkap.

## Setup

1. Copy file JSON ke folder data:
   ```bash
   mkdir data
   cp ../movie/movie_details_FINAL.json data/
   ```

2. Install dependencies (jika diperlukan):
   ```bash
   npm install
   ```

3. Deploy ke Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```

## Fitur

- ✅ Data player/streaming links dari data lokal
- ✅ Metadata lengkap dari TMDB (poster, backdrop, rating, cast, dll)
- ✅ Search & Filter
- ✅ Pagination
- ✅ CORS enabled

## Endpoints

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

## Response Format

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

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## TMDB Integration

API ini mengintegrasikan data lokal (player links) dengan metadata dari TMDB:

- **Poster & Backdrop Images** - High quality images dari TMDB
- **Rating & Votes** - Rating dari TMDB
- **Cast & Crew** - Daftar lengkap cast dengan foto profil
- **Genres** - Genre yang lebih lengkap
- **Trailers** - Link YouTube trailers
- **Runtime** - Durasi film
- **Production Countries** - Negara produksi

### Catatan TMDB:
- Untuk endpoint detail (`/api/movies/[slug]`), TMDB enrichment **default enabled**
- Untuk endpoint list (`/api/movies`), TMDB enrichment **default disabled** (karena bisa lambat)
- TMDB enrichment dibatasi maksimal 20 items per request untuk list endpoint
- Data player links tetap dipertahankan di field `players`

## CORS

API sudah dikonfigurasi untuk mengizinkan CORS dari semua origin.


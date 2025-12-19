# Cara Test API Movie

API sudah di-deploy di: **https://moviw-7oba.vercel.app**

## 🧪 Cara Test

### 1. Test dengan Browser

Buka langsung di browser:
- Root: https://moviw-7oba.vercel.app/api/
- All Movies: https://moviw-7oba.vercel.app/api/movies?limit=5
- Search: https://moviw-7oba.vercel.app/api/movies?search=tron&limit=3
- By Slug: https://moviw-7oba.vercel.app/api/movies/tron-ares-2025
- With TMDB: https://moviw-7oba.vercel.app/api/movies/tron-ares-2025?tmdb=true

### 2. Test dengan HTML Tester

Buka file `test-api.html` di browser untuk UI tester yang interaktif.

### 3. Test dengan Node.js

Jalankan:
```bash
cd movie-api
node test-api.js
```

### 4. Test dengan cURL

```bash
# Root endpoint
curl https://moviw-7oba.vercel.app/api/

# Get all movies
curl https://moviw-7oba.vercel.app/api/movies?limit=5

# Search movies
curl "https://moviw-7oba.vercel.app/api/movies?search=tron&limit=3"

# Get movie by slug
curl https://moviw-7oba.vercel.app/api/movies/tron-ares-2025

# Get movie with TMDB
curl "https://moviw-7oba.vercel.app/api/movies/tron-ares-2025?tmdb=true"

# Filter by genre
curl "https://moviw-7oba.vercel.app/api/movies?genre=Action&limit=3"

# Filter by rating
curl "https://moviw-7oba.vercel.app/api/movies?minRating=7&limit=3"
```

### 5. Test dengan JavaScript/Fetch

```javascript
// Simple test
fetch('https://moviw-7oba.vercel.app/api/movies?limit=5')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// With TMDB
fetch('https://moviw-7oba.vercel.app/api/movies/tron-ares-2025?tmdb=true')
  .then(res => res.json())
  .then(data => {
    console.log('Movie:', data.data);
    console.log('Poster:', data.data.tmdb_poster);
    console.log('Cast:', data.data.tmdb_cast);
  });
```

### 6. Test dengan Postman

1. Import collection atau buat request baru
2. Set method: GET
3. URL: `https://moviw-7oba.vercel.app/api/movies?limit=5`
4. Send request

## 📋 Endpoint yang Tersedia

### 1. Root Endpoint
```
GET /api/
```

### 2. Get All Movies
```
GET /api/movies
Query: ?limit=50&offset=0&search=&genre=&tahun=&minRating=&sortBy=rating&order=desc&tmdb=false
```

### 3. Get Movie by Slug
```
GET /api/movies/[slug]
Query: ?tmdb=true
```

## ✅ Expected Response

```json
{
  "success": true,
  "total": 1000,
  "limit": 50,
  "offset": 0,
  "tmdb_enriched": false,
  "data": [...]
}
```

## 🐛 Troubleshooting

- **CORS Error**: API sudah dikonfigurasi untuk allow CORS dari semua origin
- **404 Error**: Pastikan endpoint URL benar
- **Timeout**: TMDB enrichment bisa lambat, gunakan `tmdb=false` untuk test cepat
- **Rate Limit**: TMDB API memiliki rate limit, tunggu beberapa saat jika error


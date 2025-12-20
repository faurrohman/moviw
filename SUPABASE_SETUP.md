# Setup Supabase untuk Movie API

## Langkah 1: Buat Supabase Project (Free)

1. Kunjungi: https://supabase.com
2. Sign up untuk account gratis
3. Klik **"New Project"**
4. Isi:
   - **Name**: movie-api (atau nama lain)
   - **Database Password**: Buat password kuat (simpan password!)
   - **Region**: Pilih region terdekat (misalnya: Southeast Asia)
5. Klik **"Create new project"**
6. Tunggu project dibuat (2-3 menit)

## Langkah 2: Dapatkan Database Connection String

### Opsi A: Direct Connection (URI) - Default

1. Di sidebar, klik **"Settings"** → **"Database"**
2. Scroll ke bagian **"Connection string"**
3. Pilih tab **"URI"**
4. Copy connection string, format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Ganti `[YOUR-PASSWORD]` dengan password database Anda

**⚠️ Catatan:** Jika mendapat error `ENOTFOUND` atau "Not IPv4 compatible", gunakan **Session Mode** (Opsi B)

### Opsi B: Transaction Pooler (Recommended untuk Serverless/Vercel)

**Transaction Pooler** adalah pilihan terbaik untuk serverless functions seperti Vercel:

1. Di sidebar, klik **"Settings"** → **"Database"**
2. Scroll ke bagian **"Connection string"**
3. Pilih tab **"Transaction mode"** atau **"Pooler"**
4. Copy connection string, format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   Atau:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Ganti `[YOUR-PASSWORD]` dengan password database Anda
6. Ganti `[region]` dengan region Anda (misalnya: `ap-southeast-1`)

**Keuntungan Transaction Pooler:**
- ✅ Compatible dengan IPv4 networks
- ✅ Optimized untuk serverless functions (Vercel, AWS Lambda, dll)
- ✅ Connection pooling yang efisien
- ✅ Tidak ada masalah DNS resolution
- ✅ Lebih cepat untuk short-lived connections

### Opsi C: Session Mode - Untuk Long-lived Connections

Jika Anda menggunakan persistent connections (bukan serverless):

1. Pilih tab **"Session mode"** di Connection string
2. Format sama dengan Transaction mode tapi behavior berbeda

**Perbedaan Connection Modes:**
- **Direct (URI)**: Port `5432`, hostname `db.xxx.supabase.co` (IPv6, bisa error DNS)
- **Transaction Pooler**: Port `6543`, hostname `aws-0-[region].pooler.supabase.com` (Best for serverless)
- **Session Mode**: Port `6543`, hostname `aws-0-[region].pooler.supabase.com` (Best for persistent connections)

## Langkah 3: Buat Table di Supabase

### Opsi A: Via SQL Editor (Recommended)

**Cara 1: Menggunakan File SQL (Paling Mudah)**

1. Buka file `scripts/create-movies-table.sql` di project ini
2. Copy seluruh isi file tersebut
3. Di Supabase Dashboard, klik **"SQL Editor"**
4. Klik **"New query"**
5. Paste SQL yang sudah di-copy
6. Klik **"Run"** atau tekan `Ctrl+Enter`
7. Pastikan tidak ada error

**Cara 2: Copy Manual dari Dokumentasi**

1. Di sidebar, klik **"SQL Editor"**
2. Klik **"New query"**
3. Copy dan paste SQL berikut:

```sql
-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
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
  cast TEXT,
  jumlah_cast INTEGER DEFAULT 0,
  sinopsis TEXT,
  poster_url TEXT,
  votes NUMERIC,
  release_date TEXT,
  hydrax_servers TEXT,
  hydrax_count INTEGER DEFAULT 0,
  turbovip_servers TEXT,
  turbovip_count INTEGER DEFAULT 0,
  p2p_servers TEXT,
  p2p_count INTEGER DEFAULT 0,
  cast_servers TEXT,
  cast_count INTEGER DEFAULT 0,
  other_servers TEXT,
  other_count INTEGER DEFAULT 0,
  total_servers INTEGER DEFAULT 0,
  
  -- TMDB fields
  tmdb_id INTEGER,
  tmdb_title TEXT,
  tmdb_overview TEXT,
  tmdb_rating NUMERIC,
  tmdb_vote_count INTEGER,
  tmdb_release_date TEXT,
  tmdb_runtime INTEGER,
  tmdb_genres JSONB,
  tmdb_production_countries JSONB,
  tmdb_director TEXT,
  tmdb_cast JSONB,
  tmdb_poster TEXT,
  tmdb_backdrop TEXT,
  tmdb_trailers JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_judul ON movies(judul);
CREATE INDEX IF NOT EXISTS idx_movies_tahun ON movies(tahun);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies USING gin(to_tsvector('english', genre));

-- Enable Row Level Security (RLS) - optional
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON movies
  FOR SELECT USING (true);
```

4. Klik **"Run"** atau tekan `Ctrl+Enter`
5. Pastikan tidak ada error

### Opsi B: Via Table Editor

1. Di sidebar, klik **"Table Editor"**
2. Klik **"New Table"**
3. Nama table: `movies`
4. Tambahkan kolom sesuai struktur di atas
5. Set `slug` sebagai Primary Key

## Langkah 4: Set Environment Variables

### Untuk Local Development

1. Buat file `.env` di folder `movie-api`:
   ```bash
   cd movie-api
   # Buat file .env
   ```

2. Edit `.env` dan masukkan DATABASE_URL:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   TABLE_NAME=movies
   ```
   
   **Catatan**: Ganti `[YOUR-PASSWORD]` dengan password database Anda

### Untuk Vercel Deployment

1. Buka project di Vercel dashboard
2. Klik **"Settings"** → **"Environment Variables"**
3. Tambahkan:
   - **Name**: `DATABASE_URL`
     **Value**: Connection string dari Supabase (format: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`)
     **Environment**: Production, Preview, Development (centang semua)
   
   - **Name**: `TABLE_NAME`
     **Value**: `movies`
     **Environment**: Production, Preview, Development (centang semua)

4. Klik **"Save"**

## Langkah 5: Migrate Data ke Supabase

### Opsi A: Migrate dari CSV (Recommended - DataMovie.csv)

1. Install dependencies:
   ```bash
   cd movie-api
   npm install
   ```

2. Pastikan `.env` sudah di-set dengan `DATABASE_URL`

3. Run migration dari CSV:
   ```bash
   npm run migrate
   ```

   Atau langsung:
   ```bash
   node scripts/migrate-csv-to-supabase.js
   ```

4. Tunggu sampai migration selesai

### Opsi B: Migrate dari JSON (jika ada file JSON)

1. Install dependencies:
   ```bash
   cd movie-api
   npm install
   ```

2. Pastikan `.env` sudah di-set dengan `DATABASE_URL`

3. Run migration dari JSON:
   ```bash
   npm run migrate-json
   ```

   Atau langsung:
   ```bash
   node scripts/migrate-to-supabase.js
   ```

4. Tunggu sampai migration selesai

## Langkah 6: Verifikasi

1. Buka Supabase Dashboard → Table Editor → movies
2. Pastikan data sudah masuk
3. Test API:
   ```bash
   curl https://your-app.vercel.app/api/movies?limit=5
   ```

## Troubleshooting

### Error: "relation 'movies' does not exist"
- Pastikan table sudah dibuat di Supabase
- Cek nama table di SQL Editor atau Table Editor

### Error: "new row violates row-level security policy"
- Pastikan RLS policy sudah dibuat
- Atau disable RLS untuk testing:
  ```sql
  ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
  ```

### Error: "permission denied"
- Pastikan menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk migration
- Atau pastikan anon key memiliki permission yang cukup

### Error: "connection timeout"
- Pastikan SUPABASE_URL benar
- Cek network/firewall settings
- Pastikan project masih aktif

## Free Tier Limits

- **Database Size**: 500 MB
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited (dengan rate limiting)
- **Storage**: 1 GB
- **Backup**: 7 days retention

## Upgrade (Optional)

Jika data melebihi 500MB, upgrade ke:
- **Pro**: $25/month - 8GB database, 250GB bandwidth
- **Team**: $599/month - 8GB database, custom limits

## Security Best Practices

1. ✅ Gunakan `SUPABASE_ANON_KEY` untuk API endpoints (public)
2. ✅ Gunakan `SUPABASE_SERVICE_ROLE_KEY` hanya untuk migration (server-side)
3. ✅ JANGAN expose service_role key di client-side
4. ✅ Enable RLS (Row Level Security) untuk production
5. ✅ Buat policies yang sesuai dengan kebutuhan


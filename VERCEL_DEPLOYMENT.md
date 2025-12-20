# 🚀 Panduan Deployment ke Vercel

Panduan lengkap untuk deploy Movie API ke Vercel dengan Supabase PostgreSQL.

## 📋 Prerequisites

1. ✅ **Supabase Project** sudah dibuat dan data sudah di-import
2. ✅ **Vercel Account** - Sign up di https://vercel.com (gratis)
3. ✅ **Git Repository** - Project sudah di-push ke GitHub/GitLab/Bitbucket

## 🔧 Langkah 1: Setup Environment Variables di Vercel

### A. Dapatkan Database Connection String dari Supabase

1. Buka **Supabase Dashboard** → **Settings** → **Database**
2. Scroll ke bagian **"Connection string"**
3. Pilih tab **"Transaction mode"** (recommended untuk serverless)
4. Copy connection string, format:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Ganti `[PASSWORD]` dengan password database Anda
6. Jika password mengandung karakter khusus (*, #, @), encode dengan URL encoding:
   - `*` menjadi `%2A`
   - `#` menjadi `%23`
   - `@` menjadi `%40`
   - Space menjadi `%20`

### B. Set Environment Variables di Vercel

1. Buka **Vercel Dashboard** → Pilih project Anda
2. Klik **Settings** → **Environment Variables**
3. Tambahkan environment variables berikut:

#### Required Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres` | Production, Preview, Development |
| `TABLE_NAME` | `movies` | Production, Preview, Development (optional, default: movies) |

**Contoh DATABASE_URL:**
```
postgresql://postgres.nzcbrkfhydyrjcynljlu:Masuk12%2A@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**Catatan:**
- ✅ Centang semua environment (Production, Preview, Development)
- ✅ Pastikan password sudah di-encode jika ada karakter khusus
- ✅ Jangan ada spasi di awal/akhir value

## 🚀 Langkah 2: Deploy ke Vercel

### Opsi A: Deploy via Vercel Dashboard (Recommended)

1. **Import Project:**
   - Buka https://vercel.com/new
   - Pilih **"Import Git Repository"**
   - Pilih repository Anda (GitHub/GitLab/Bitbucket)
   - Klik **"Import"**

2. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `movie-api` (jika project ada di subfolder)
   - **Build Command:** (kosongkan)
   - **Output Directory:** (kosongkan)
   - **Install Command:** `npm install`

3. **Add Environment Variables:**
   - Tambahkan `DATABASE_URL` dan `TABLE_NAME` seperti di Langkah 1
   - Klik **"Deploy"**

4. **Tunggu Deployment:**
   - Vercel akan build dan deploy project
   - Tunggu sampai selesai (biasanya 1-2 menit)

### Opsi B: Deploy via Vercel CLI

```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy (dari folder movie-api)
cd movie-api
vercel

# Untuk production deployment
vercel --prod
```

**Catatan:** Environment variables harus di-set via Dashboard, bukan via CLI.

## ✅ Langkah 3: Verifikasi Deployment

### 1. Test API Endpoints

Setelah deployment selesai, test API dengan:

```bash
# Get all movies
curl https://your-app.vercel.app/api/movies?limit=5

# Search movies
curl https://your-app.vercel.app/api/movies?search=tron&limit=10

# Get movie by slug
curl https://your-app.vercel.app/api/movies/tron-ares-2025
```

### 2. Check Vercel Logs

Jika ada error:

1. Buka **Vercel Dashboard** → Project → **Deployments**
2. Klik deployment terbaru
3. Klik tab **"Functions"** atau **"Logs"**
4. Cek error messages

### 3. Common Issues & Solutions

#### ❌ Error: "DATABASE_URL must be set"
**Solution:**
- Pastikan environment variable `DATABASE_URL` sudah di-set di Vercel Dashboard
- Pastikan sudah di-set untuk semua environment (Production, Preview, Development)
- Redeploy setelah menambahkan environment variables

#### ❌ Error: "relation 'movies' does not exist"
**Solution:**
- Pastikan tabel sudah dibuat di Supabase
- Jalankan `npm run setup-table` atau SQL script di Supabase SQL Editor
- Pastikan `TABLE_NAME` environment variable benar

#### ❌ Error: "syntax error at or near 'cast'"
**Solution:**
- Pastikan tabel sudah dibuat dengan kolom `"cast"` (dengan quotes)
- Tabel harus dibuat dengan script `create-movies-table.sql` atau `setup-table.js`

#### ❌ Error: "connection timeout" atau "ENOTFOUND"
**Solution:**
- Pastikan menggunakan **Transaction Mode** connection string (port 6543)
- Jangan gunakan Direct URI (port 5432) untuk serverless
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

#### ❌ Error: "permission denied"
**Solution:**
- Pastikan connection string menggunakan password yang benar
- Pastikan password sudah di-encode jika ada karakter khusus
- Cek di Supabase Dashboard → Settings → Database → Connection string

## 🔄 Langkah 4: Update Environment Variables (Jika Perlu)

Jika perlu update environment variables:

1. Buka **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Edit atau tambah variable
3. **Redeploy** project:
   - Klik **Deployments** → Pilih deployment terbaru → **Redeploy**
   - Atau push commit baru ke Git

## 📊 Monitoring & Analytics

### Vercel Analytics

1. Buka **Vercel Dashboard** → Project → **Analytics**
2. Monitor:
   - Request count
   - Response times
   - Error rates
   - Function execution time

### Supabase Dashboard

1. Buka **Supabase Dashboard** → Project
2. Monitor:
   - Database size
   - API requests
   - Bandwidth usage
   - Active connections

## 🎯 Best Practices

1. ✅ **Gunakan Transaction Mode** connection string untuk serverless
2. ✅ **Encode password** jika ada karakter khusus
3. ✅ **Set environment variables** untuk semua environment
4. ✅ **Monitor logs** untuk error detection
5. ✅ **Test API** setelah deployment
6. ✅ **Keep DATABASE_URL secret** - jangan commit ke Git

## 🔐 Security

1. ✅ **Never commit** `.env` file atau `DATABASE_URL` ke Git
2. ✅ **Use environment variables** di Vercel Dashboard
3. ✅ **Rotate passwords** secara berkala
4. ✅ **Monitor access** di Supabase Dashboard
5. ✅ **Enable RLS** (Row Level Security) jika perlu

## 📝 Checklist Deployment

- [ ] Supabase project dibuat
- [ ] Tabel `movies` sudah dibuat dan data sudah di-import
- [ ] DATABASE_URL sudah di-dapatkan dari Supabase
- [ ] Password sudah di-encode (jika ada karakter khusus)
- [ ] Environment variables sudah di-set di Vercel
- [ ] Project sudah di-deploy ke Vercel
- [ ] API endpoints sudah di-test
- [ ] Logs sudah di-check (tidak ada error)

## 🆘 Support

Jika masih ada masalah:

1. **Check Vercel Logs:** Dashboard → Deployments → Logs
2. **Check Supabase Logs:** Dashboard → Logs
3. **Test Connection:** Gunakan script `setup-table.js` untuk test koneksi
4. **Verify Environment Variables:** Pastikan semua variable sudah benar

## 📚 Dokumentasi Terkait

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [API Documentation](./README.md)
- [Test API Guide](./test-api.md)

---

**Selamat! 🎉 API Anda sudah live di Vercel!**


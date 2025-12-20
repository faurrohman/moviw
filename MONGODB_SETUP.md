# Setup MongoDB untuk Movie API

## Langkah 1: Buat MongoDB Atlas Account (Free)

1. Kunjungi: https://www.mongodb.com/cloud/atlas
2. Sign up untuk account gratis
3. Pilih **Free Tier (M0)** - 512MB storage, gratis selamanya

## Langkah 2: Buat Cluster

1. Klik **"Build a Database"**
2. Pilih **"Free"** tier
3. Pilih region terdekat (misalnya: Singapore)
4. Klik **"Create"**
5. Tunggu cluster dibuat (2-3 menit)

## Langkah 3: Setup Database User

1. Di sidebar, klik **"Database Access"**
2. Klik **"Add New Database User"**
3. Pilih **"Password"** authentication
4. Masukkan username dan password (simpan password!)
5. Database User Privileges: **"Atlas Admin"** atau **"Read and write to any database"**
6. Klik **"Add User"**

## Langkah 4: Setup Network Access

1. Di sidebar, klik **"Network Access"**
2. Klik **"Add IP Address"**
3. Klik **"Allow Access from Anywhere"** (0.0.0.0/0) untuk Vercel
4. Klik **"Confirm"**

## Langkah 5: Dapatkan Connection String

1. Di sidebar, klik **"Database"**
2. Klik **"Connect"** pada cluster Anda
3. Pilih **"Connect your application"**
4. Copy connection string, contoh:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Ganti `<password>` dengan password yang Anda buat
6. Tambahkan database name di akhir: `/movies?retryWrites=true&w=majority`

## Langkah 6: Set Environment Variable di Vercel

1. Buka project di Vercel dashboard
2. Klik **"Settings"** → **"Environment Variables"**
3. Tambahkan:
   - **Name**: `MONGODB_URI`
   - **Value**: Connection string dari langkah 5
   - **Environment**: Production, Preview, Development (centang semua)
4. Klik **"Save"**

## Langkah 7: Migrate Data JSON ke MongoDB

### Opsi A: Migrate dari Local

1. Install dependencies:
   ```bash
   cd movie-api
   npm install
   ```

2. Buat file `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` dan masukkan `MONGODB_URI`

4. Run migration:
   ```bash
   npm run migrate
   ```

### Opsi B: Migrate dari Vercel (via script)

Atau buat script di Vercel untuk migrate data.

## Langkah 8: Deploy ke Vercel

1. Pastikan environment variable `MONGODB_URI` sudah di-set di Vercel
2. Deploy:
   ```bash
   vercel --prod
   ```

## Verifikasi

Test API:
```bash
curl https://your-app.vercel.app/api/movies?limit=5
```

## Troubleshooting

### Error: "MongoServerError: Authentication failed"
- Pastikan username dan password benar
- Pastikan user memiliki permission yang cukup

### Error: "MongoServerError: IP not whitelisted"
- Pastikan IP address sudah di-whitelist di Network Access
- Gunakan 0.0.0.0/0 untuk allow semua IP (untuk Vercel)

### Error: "Connection timeout"
- Pastikan connection string benar
- Pastikan cluster sudah aktif
- Cek firewall/network settings

## Free Tier Limits

- **Storage**: 512 MB (cukup untuk ~100k movies)
- **RAM**: Shared
- **Network**: 512 MB/day
- **Backup**: Tidak ada (upgrade untuk backup)

## Upgrade (Optional)

Jika data melebihi 512MB, upgrade ke:
- **M2**: $9/month - 2GB storage
- **M5**: $25/month - 5GB storage



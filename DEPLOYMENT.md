# Deployment Notes

## Masalah yang Ditemukan

File JSON 35MB terlalu besar untuk di-load langsung dengan `require()` di Vercel serverless function.

## Solusi yang Diterapkan

1. **Lazy Loading dengan Cache**: Menggunakan `data-loader.js` untuk load data dengan caching
2. **Error Handling**: Menambahkan error handling yang lebih baik
3. **Memory Configuration**: Menambahkan `memory: 3008` di vercel.json untuk memory yang lebih besar
4. **Include Files**: Memastikan folder `data/` di-include dalam deployment

## Jika Masih Error

### Opsi 1: Split File JSON
Jika file masih terlalu besar, split menjadi beberapa file kecil:

```bash
# Split JSON menjadi chunks
node split-json.js
```

### Opsi 2: Gunakan Database
Migrate data ke database (MongoDB, PostgreSQL, dll) dan query dari database.

### Opsi 3: Gunakan External Storage
Upload JSON ke S3/Cloud Storage dan fetch saat diperlukan.

### Opsi 4: Optimize JSON
- Remove null values
- Compress JSON
- Remove unused fields

## Check Deployment

1. Pastikan file `data/movie_details_FINAL.json` ada di folder `movie-api/data/`
2. Pastikan file ter-deploy (cek di Vercel dashboard)
3. Check logs di Vercel untuk error details

## Testing Locally

```bash
cd movie-api
vercel dev
```

Kemudian test di: http://localhost:3000/api/movies?limit=5


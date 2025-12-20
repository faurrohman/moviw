# Cara Memperbaiki Error DATABASE_URL

## Masalah yang Terjadi

Error `Invalid URL` biasanya terjadi karena:

1. **Password mengandung karakter khusus** (seperti `*`, `#`, `@`, dll) yang perlu di-encode
2. **Format .env file salah** - mungkin ada `DATABASE_URL=` di dalam value

## Solusi

### Opsi 1: URL Encode Password (Recommended)

Jika password Anda mengandung karakter khusus seperti `*`, `#`, `@`, dll, Anda perlu meng-encode-nya:

**Karakter khusus dan encoding-nya:**
- `*` → `%2A`
- `#` → `%23`
- `@` → `%40`
- ` ` (space) → `%20`
- `&` → `%26`
- `=` → `%3D`

**Contoh:**
Jika password Anda adalah `Masuk12*`, maka di .env file:
```env
DATABASE_URL=postgresql://postgres:Masuk12%2A@db.nzcbrkfhydyrjcynljlu.supabase.co:5432/postgres
```

### Opsi 2: Gunakan Online URL Encoder

1. Buka: https://www.urlencoder.org/
2. Paste password Anda (contoh: `Masuk12*`)
3. Klik "Encode"
4. Copy hasil encoded (contoh: `Masuk12%2A`)
5. Ganti password di connection string dengan yang sudah di-encode

### Opsi 3: Wrap dalam Quotes (Alternatif)

Coba wrap seluruh DATABASE_URL dalam quotes di .env file:

```env
DATABASE_URL="postgresql://postgres:Masuk12*@db.nzcbrkfhydyrjcynljlu.supabase.co:5432/postgres"
```

## Format .env File yang Benar

Pastikan file `.env` Anda seperti ini (tanpa quotes di key, hanya value jika perlu):

```env
DATABASE_URL=postgresql://postgres:Masuk12%2A@db.nzcbrkfhydyrjcynljlu.supabase.co:5432/postgres
TABLE_NAME=movies
```

**JANGAN seperti ini:**
```env
DATABASE_URL=DATABASE_URL=postgresql://...  ❌ (ada duplikasi)
DATABASE_URL="DATABASE_URL=postgresql://..." ❌ (ada key di dalam value)
```

## Quick Fix Script

Jika Anda ingin cepat, gunakan script ini untuk encode password:

```javascript
// Di Node.js console atau buat file encode-password.js
const password = 'Masuk12*';
const encoded = encodeURIComponent(password);
console.log('Encoded password:', encoded);
console.log('Full URL:', `postgresql://postgres:${encoded}@db.nzcbrkfhydyrjcynljlu.supabase.co:5432/postgres`);
```

## Verifikasi

Setelah update .env file, coba jalankan lagi:

```bash
npm run migrate
```

Script sekarang akan:
- ✅ Auto-detect dan fix format .env yang salah
- ✅ Auto-encode password yang mengandung special characters
- ✅ Validasi URL format sebelum connect



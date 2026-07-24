# Cloudflare R2 untuk Course Materials

Integrasi ini memakai bucket R2 privat dan presigned URL. Browser mengunggah file langsung ke R2, sedangkan aplikasi tetap memeriksa role dan penugasan course sebelum menerbitkan URL sementara.

## 1. Buat bucket

Buka Cloudflare Dashboard → Storage & databases → R2 → Create bucket.

Nama yang direkomendasikan:

```text
dokter-ambis-course-materials
```

Jangan aktifkan public access.

## 2. Buat API token R2

Buka R2 → Overview → Manage R2 API Tokens → Create API token.

Gunakan:

- Permission: Object Read & Write
- Scope: bucket tertentu saja
- Bucket: `dokter-ambis-course-materials`

Simpan nilai berikut secara aman:

```text
Account ID
Access Key ID
Secret Access Key
Bucket name
```

Secret Access Key hanya ditampilkan sekali.

## 3. Konfigurasi CORS bucket

Tambahkan policy CORS berikut pada bucket:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://dokter-ambis-v2.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

Tambahkan domain production lain secara eksplisit bila domain utama berubah.

## 4. Tambahkan environment variables lokal

Salin `.env.example` menjadi `.env.local`, lalu isi:

```dotenv
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=dokter-ambis-course-materials
```

Jangan commit `.env.local`.

## 5. Tambahkan environment variables Vercel

Masukkan empat variabel yang sama melalui Vercel Project Settings → Environment Variables.

Jangan melakukan deploy sebelum validasi lokal selesai.

## 6. Struktur object key

File baru disimpan dengan struktur:

```text
courses/{courseId}/folders/{folderId|ungrouped}/lessons/{lessonId}/{uuid}-{fileName}
```

Database menyimpan referensi:

```text
r2://dokter-ambis-course-materials/courses/...
```

File lama pada Supabase Storage tetap dapat diunduh. Tidak diperlukan migrasi data atau perubahan tabel.

## 7. Pengujian lokal

1. Login sebagai Admin atau Mentor yang ditugaskan.
2. Buka Course Explorer.
3. Buka Folder → Lesson → Tambah File.
4. Pilih file maksimal 50 MB.
5. Simpan metadata file.
6. Klik Download dan pastikan akses melalui `/api/materials/{fileId}`.
7. Uji akun Student tanpa enrollment; file harus tidak dapat diakses.
8. Uji Student dengan enrollment aktif; file published harus dapat diunduh.

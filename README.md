# Universitas Asal — Dokter Ambis

Salin seluruh folder di paket ini ke root proyek `dokter-ambis-v2` dan izinkan VS Code mengganti file yang sudah ada.

Database Supabase produksi sudah memiliki kolom `profiles.university_origin` dan trigger pendaftaran yang diperbarui. File migrasi `0050_add_profile_university_origin.sql` disertakan agar riwayat kode tetap sesuai dengan database.

Setelah menyalin file, perbarui tipe Supabase:

```powershell
npx supabase gen types typescript --project-id irpqxfpjqpiyqlzqoxdf | Set-Content -Encoding utf8 supabase/types/database.types.ts
```

Kemudian jalankan pemeriksaan:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Terakhir, uji pendaftaran menggunakan email baru dan pastikan kolom `university_origin` pada tabel `public.profiles` terisi.

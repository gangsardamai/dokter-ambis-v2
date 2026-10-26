# Migrasi Kepemilikan Google Drive — Pilot UNEJ 2026

Fitur **Admin → Migrasi Kepemilikan Drive** dibuat sebagai jalur aman ketika SQL langsung dari ChatGPT tidak tersedia. Endpoint menggunakan sesi login Admin aktif, bukan service-role key di browser.

## Status dan batasan pilot

- Hanya UNEJ Blok 2, Blok 8, dan Blok 14 tahun 2026. Folder source harus benar-benar keturunan folder course 2026 yang dipetakan dan tidak boleh melewati 2025/Untuk Admin.
- File sumber harus direferensikan oleh setidaknya satu lesson pada course yang dipilih. Seluruh referensi ID yang dipakai bersama di course lain ikut diganti atomik.
- Salinan dibuat **dengan OAuth Google Drive akun `ambitious.premium@gmail.com`**, di folder sumber yang sama. Nama depan `Salinan`/`Copy of` dihapus.
- Pembandingan MIME, ukuran, checksum (jika ada), owner, folder, dan audience Google Drive dilakukan otomatis **sebelum** perubahan database. File sumber yang tidak bisa dipastikan aksesnya dilewati.
- Setelah migrasi referensi berhasil secara atomik dan jumlah ID lama yang tersisa nol, sistem langsung mencoba menghapus sumber (sesuai keputusan pengguna, tanpa karantina 14 hari). **Google sering menolak delete file yang dimiliki akun tentor**; keadaan ini dilaporkan dan salinan tetap menjadi acuan website.
- Uji manual PDF/video dinonaktifkan. Pemeriksaan database dan izin Drive **tetap wajib**.
- Jangan pakai untuk file di luar tiga course UNEJ sampai scope, auth, dan izin Drive berhasil diuji.

## Syarat sebelum fitur bisa dieksekusi

1. Siapkan Google Cloud OAuth 2.0 client untuk akun organisasi dan aktifkan **Google Drive API**. Peroleh refresh token dengan scope Google Drive yang mengizinkan menyalin dan menghapus file (`https://www.googleapis.com/auth/drive`). Proses otorisasi harus dilakukan sendiri oleh pemilik akun; **jangan mengirim refresh token/password ke ChatGPT**.
2. Tambahkan env sensitif di Vercel hanya pada server (tidak memakai `NEXT_PUBLIC_`):
   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REFRESH_TOKEN`
3. Terapkan migrasi SQL `supabase/migrations/20261026180000_admin_drive_ownership_swap.sql` pada Supabase project `irpqxfpjqpiyqlzqoxdf` dan verifikasi fungsi `admin_replace_drive_references` terpasang.
4. Deploy build kode Next.js dari PR setelah diuji, lalu buka halaman `/dashboard/admin/drive-ownership` sebagai Admin aktif.
5. Jalankan preview pada satu file UNEJ Blok 2: ID sumber `1vGmhC1pFI_LaM474eCdCXbJLd7fkJCsp` (6.1 Pendahuluan: Tumbuh Kembang Anak). File salinan dari audit sebelumnya di folder privat `19Ibd-H50RB75T9x5gY0ei510YymcNwIE` belum ditautkan ke website. Jangan hapus sumber sebelumnya secara manual.

## Mengapa memakai fungsi database?

`admin_replace_drive_references(course_id, old_id, new_id)` memperbarui `lesson_files.file_path` dan `videos.provider_video_id` sekaligus dalam **satu transaksi PostgreSQL**, termasuk file yang dipakai beberapa lesson/course. Jika referensi tak dikenal atau ada collision, seluruh transaksi rollback dan file sumber tidak dihapus.

## Batasan penting

- OAuth ChatGPT Google Drive **tidak secara otomatis tersedia** bagi Vercel Next.js. Koneksi server terpisah diperlukan.
- Tidak semua pengguna dengan akses editor bisa menghapus file Google Drive milik tentor. Google tetap mengendalikan izin hapus.
- Link Drive langsung yang tersimpan di luar database website tidak dapat diketahui sistem. Jangan menyimpulkan bahwa seluruh tautan eksternal sudah dialihkan.
- Pilot tidak menjadwalkan pekerjaan otomatis sendiri: tugas otomatis 01.00–03.00 WIB harus menggunakan jalur yang benar-benar terotorisasi, dan tidak boleh melanjutkan bila server belum terkonfigurasi.
- Jangan menyimpan rahasia OAuth di repository, `.env.example`, log, atau frontend.

## Pemulihan jika terjadi kendala

Jika langkah copy sukses tetapi panggilan RPC gagal/tidak pasti, sistem **tidak menghapus file sumber maupun salinan**. Catat ID salinan dari respons, periksa log dan status database; jangan memulai copy duplikat secara buta. Jika penghapusan sumber gagal setelah transaksi, ID website baru tetap benar dan sumber lama boleh ditangani kemudian oleh pemiliknya.

# PROTOKOL MIGRASI OWNERSHIP — DOKTER AMBIS
Status: Disetujui pengguna, 27 Oktober 2026

## Tujuan
Mengalihkan acuan materi website Dokter Ambis dari file Google Drive milik tentor/pihak lain ke salinan yang dimiliki akun utama `ambitious.premium@gmail.com`. Semua dikerjakan melalui koneksi yang terotorisasi dari ChatGPT, tanpa keharusan login dashboard website berulang kali.

## Protokol resmi (tanpa penghapusan sumber)
**Copy ke folder sumber yang sama → Rename → Mirroring ulang → Audit → Selesai.**

**TIDAK BOLEH menghapus, men-trash, atau memindahkan file sumber milik siapa pun dalam protokol saat ini.** File asli dipertahankan meskipun seluruh audit berhasil. Penghapusan di masa depan merupakan prosedur terpisah yang memerlukan izin serta persetujuan baru.

### 1. Copy
- Salin ke **folder yang sama persis** dengan sumber, bukan root/My Drive.
- Pemilik salinan harus akun utama; pastikan melalui metadata, bukan dugaan.
- Jika salinan yang tepat sudah ada dan terverifikasi, **gunakan yang ada**, jangan copy ulang.
- Tidak mengubah/menghapus sumber.

### 2. Rename
- Rapikan prefiks `Copy of` / `Salinan`.
- Nama harus jelas membedakan sumber dan salinan bila kedua file berada dalam folder yang sama; contoh `Judul (Akun Utama).pdf`.
- Jangan mengganti nama yang mengganggu penomoran materi atau folder.

### 3. Mirroring ulang website
- Untuk materi yang **sudah ada**, ubah referensi ID Google Drive pada `lesson_files.file_path` (atau `videos.provider_video_id` bila relevan) melalui mekanisme migrasi backend **terotorisasi**.
- Jangan membuat lesson baru, menghapus lesson, menduplikasi item, mengubah judul lesson, nomor, urutan, atau status publikasi.
- Periksa pemakaian ID lama di seluruh course sebelum dan sesudah migrasi. Referensi yang dipakai lintas-course harus ikut tertangani secara aman atau migrasi dihentikan jika lingkup belum didukung.
- Jangan menggunakan SQL tulis dari koneksi yang tidak dapat membuktikan identitas/otorisasi; gunakan jalur backend/automasi dengan autentikasi yang sah.
- Perubahan harus idempotent dan bersyarat: cek ID lama yang diharapkan, cek ID baru belum terpakai, dan audit ulang setelah transaksi.

### 4. Audit wajib
- Folder dan owner baru benar; jenis file sama.
- Periksa ukuran dan, jika tersedia, checksum; untuk pilot PDF sudah dilakukan perbandingan **byte demi byte**.
- Verifikasi akses baca melalui metadata permissions; jangan diam-diam memperluas izin; bila tidak pasti **stop**.
- Hitung referensi ID lama/baru di seluruh tabel website yang relevan dan periksa kesesuaian materi, lesson, urutan, status publish serta kemungkinan cross-course reuse.
- Jika hasil meragukan atau terjadi error, **stop dan pertahankan kedua file**. Jangan hapus file sumber.
- Jika ada masalah website setelah perubahan, pulihkan referensi secara terotorisasi dengan mempertahankan sumber yang tersedia.

### 5. Selesai (tanpa Hapus Sumber)
- Laporan minimal: jumlah file tersalin/digunakan kembali, file termigrasi, referensi lama tersisa, hasil verifikasi akses, error, dan status sumber **dipertahankan**.
- Penghapusan sumber **dinonaktifkan** sampai ada keputusan eksplisit terpisah.

## Implementasi yang terbukti: Pilot FK UNEJ Blok 8
- Materi PDF `4. Fisiologi Kardiovaskular` berhasil disalin dalam folder asal, dimiliki akun utama, dan diubah namanya agar jelas sebagai salinan.
- Pratinjau dan migrasi dijalankan melalui GitHub Actions yang dipicu dari perintah ChatGPT dan memanggil fungsi Supabase dengan GitHub OIDC; tidak perlu login dashboard Dokter Ambis.
- Hasil: 0 referensi ID lama dan 1 referensi ID salinan untuk file pilot; judul, urutan, status `published` tetap. Isi PDF asli dan salinan identik byte demi byte; izin file terverifikasi.
- File asli **masih ada**, tetap dimiliki tentor; penghapusan gagal karena Google Drive menolak `FORBIDDEN`. Sesuai protokol baru, jangan coba menghapus lagi.
- Audit dan perintah pilot: https://github.com/gangsardamai/dokter-ambis-v2/issues/55 dan https://github.com/gangsardamai/dokter-ambis-v2/issues/56

## Batasan saat ini
- GitHub Actions dan Supabase Edge Function yang terpasang **baru berlaku untuk satu pilot PDF UNEJ Blok 8**, bukan mesin migrasi massal yang siap untuk semua course.
- Untuk perluasan, bangun mekanisme batch yang terotorisasi, terukur, mengaudit semua referensi dan memberi laporan per file. Jangan menganggap pilot sebagai izin mengganti seluruh course secara otomatis.
- Akses `anyone: writer` pada sejumlah file/folder Drive adalah risiko terpisah. Perubahan izin harus melalui keputusan tersendiri agar tidak memutus akses siswa atau staf.

**Instruksi singkat untuk pekerjaan berikutnya:** "Jalankan Protokol Migrasi Ownership Dokter Ambis untuk folder/course berikut, tanpa penghapusan file sumber."

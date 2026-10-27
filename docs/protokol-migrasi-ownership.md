# PROTOKOL MIGRASI OWNERSHIP — DOKTER AMBIS
Status: Disetujui pengguna, 27 Oktober 2026

## Tujuan
Mengalihkan acuan materi website Dokter Ambis dari file Google Drive milik tentor/pihak lain ke salinan yang dimiliki akun utama `ambitious.premium@gmail.com`. Semua dikerjakan melalui koneksi yang terotorisasi dari ChatGPT, tanpa keharusan login dashboard website berulang kali.

## Protokol resmi (tanpa penghapusan sumber)
**Copy ke folder sumber yang sama → Normalisasi nama (hanya jika diperlukan) → Mirroring ulang → Audit → Selesai.**

**TIDAK BOLEH menghapus, men-trash, atau memindahkan file sumber milik siapa pun dalam protokol saat ini.** File asli dipertahankan meskipun seluruh audit berhasil. Penghapusan di masa depan merupakan prosedur terpisah yang memerlukan izin serta persetujuan baru.

### 1. Copy
- Salin ke **folder yang sama persis** dengan sumber, bukan root/My Drive.
- Pemilik salinan harus akun utama; pastikan melalui metadata/kolom Pemilik, bukan dugaan. Nama tidak perlu menandakan kepemilikan.
- Jika salinan yang tepat sudah ada dan terverifikasi, **gunakan yang ada**, jangan copy ulang.
- Tidak mengubah/menghapus sumber.

### 2. Nama file — tanpa penanda kepemilikan
- **Gunakan nama file yang sama persis dengan sumber.** Jangan menambahkan `(Akun Utama)`, `(Milik Saya)`, atau label pemilik lain pada nama salinan.
- Bila Google Drive menambahkan prefiks `Copy of` / `Salinan`, hapus prefiks itu **saja** sehingga nama, nomor urut, dan ekstensi sama dengan file sumber. Paling sederhana, tentukan `new_title` sesuai nama sumber langsung saat membuat salinan.
- Dua file dengan nama sama dalam folder yang sama **diperbolehkan**: bedakan berdasarkan kolom **Pemilik** di Google Drive, sesuai preferensi pengguna.
- Untuk migrasi website, **jangan pernah mencocokkan/mengganti file hanya berdasarkan nama**. Gunakan ID file sumber, ID salinan, folder yang sama, dan pemeriksaan pemilik akun utama. Jika tidak yakin, hentikan migrasi.
- Jangan mengganti nama sumber atau menyentuh konten/urutan materi hanya untuk membedakan kepemilikan.

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

## Uji lanjutan — keseluruhan folder 4. Fisiologi Kardiovaskular (27 Oktober 2026)
- Cakupan: 4 materi aktif dalam satu lesson FK UNEJ Blok 8 2026: 2 dokumen dan 2 video.
- 1 PDF sudah dimigrasi pada pilot awal; 3 file lainnya (PPTX + 2 MP4) berhasil disalin langsung ke folder yang sama dan kepemilikannya terverifikasi. **Secara historis** salinan pilot diberi tanda `(Akun Utama)`, tetapi mulai revisi ini penanda tersebut tidak lagi dipakai. Nama kepemilikan dilihat di kolom Pemilik Drive.
- Pratinjau dan mirroring tiga referensi berhasil memakai GitHub Actions → Supabase Edge Function dengan OIDC dan transaksi database atomik.
- Audit pascamigrasi: **0 referensi ID sumber**, **4 referensi ID salinan** secara keseluruhan pada tabel `lesson_files` dan `videos`. Kedua lesson file tetap `published` dengan urutan yang sama.
- Isi PPTX asli dan salinan diverifikasi sama secara byte demi byte; PDF pilot sebelumnya juga diverifikasi identik. Kedua MP4 terverifikasi melalui ukuran, jenis, folder, izin, dan owner Drive, **belum diuji kesamaan byte atau pemutaran video aktual**.
- Folder kini memiliki delapan file: **empat asli + empat salinan**. Semua sumber tetap ada; tidak ada operasi penghapusan.
- Pratinjau: https://github.com/gangsardamai/dokter-ambis-v2/issues/57
- Migrasi: https://github.com/gangsardamai/dokter-ambis-v2/issues/58
- Kode workflow khusus pilot folder: `.github/workflows/drive-migration-fisio-folder.yml` pada `main`. Ini masih scoped, **bukan migrasi massal untuk semua folder**.

## Uji kedua — folder 7. Atrial Fibrilasi dan Infektif Endokarditis (27 Oktober 2026)
- Course FK UNEJ Blok 8 2026; empat file (dua PDF dan dua MP4).
- Seluruh file tersalin dengan **nama asli tanpa penanda kepemilikan**, langsung di folder sumber; pemilik salinan akun utama terverifikasi.
- Dua PDF diverifikasi identik byte demi byte. Video diaudit ukuran, MIME, permission, folder, pemilik; tidak diuji kesamaan byte atau pemutaran.
- Migrasi referensi dilakukan dalam transaksi atomik, 0 referensi lama dan 4 referensi salinan di database `lesson_files` dan `videos`. Judul dan urutan dipertahankan.
- Semua empat sumber tetap disimpan, sehingga kini terdapat empat asli + empat salinan dalam folder tersebut.
- Audit pratinjau https://github.com/gangsardamai/dokter-ambis-v2/issues/59 dan eksekusi https://github.com/gangsardamai/dokter-ambis-v2/issues/60.

## Jadwal otomatisasi ownership (disetujui 27 Oktober 2026)
- Otomatisasi **Migrasi Ownership Dokter Ambis — 2 Sesi** dengan ID `6adef9fb599c81919bf1c7f305ce60f5`.
- **04.30 dan 16.30 WIB (Asia/Jakarta)** setiap hari; pada **Minggu kedua sesi hanya audit** dan tidak melakukan penyalinan/mirroring.
- Per sesi maksimal **1.000.000.000 byte (1 GB desimal)** yang disalin, **empat file**, **satu course**, durasi kerja **45 menit**, proses serial bukan paralel. Berhenti pada batas pertama yang tercapai; maksimal teoritis dua sesi 2 GB/8 file per hari, bukan jaminan throughput.
- Rotasi 14 target: FK UNEJ Blok 8, Blok 2, Blok 14; UHT URO, DMS, Commed; UNRI Blok 9, Masalah Sistem Indera; UNRAM Endokrin, Kedokteran Keluarga; UMS Tropical Medicine, Endokrin; UMY Blok 14, KKLP/Blok 20.
- Hanya materi yang tervalidasi sebagai periode 2026. Lewati 2025, "Untuk Admin", folder ambigu, file/course kosong, dan materi Try Out. Folder UNRAM Kedokteran Keluarga tanpa tahun perlu verifikasi materi 2026.
- Jangan restart antrean secara buta. Gunakan checkpoint jika tersedia, atau lakukan rekonsiliasi baca-saja Drive+database sebelum operasi.
- **MUST NOT DELETE sumber.** Migrasi hanya jika ada jalur otorisasi dan transaksi atomik yang **telah diuji untuk file/course target**. Jika backend umum belum mendukung, **audit saja** dan laporkan blocker. JANGAN membuat salinan yatim hanya karena jadwal aktif.
- Periksa referensi lintas-course, ID salinan, kepemilikan, izin mahasiswa, MIME, ukuran, checksum jika ada, dan old/new reference count. Gagal/ragu → hentikan batch, pertahankan sumber dan salinan, laporkan.
- Jadwal ini adalah **pengaturan task yang sudah diaktifkan**, sementara kemampuan backend migrasi lintas 14 course masih perlu perluasan dan uji bertahap.

## Validasi folder dan izin (keputusan terbaru 27 Oktober 2026)
- Folder utama 2026 untuk 14 course/6 universitas telah diverifikasi terhadap Google Drive dan Supabase. Pemetaan target: [Target folder Migrasi Ownership 2026](./ownership-migration-target-folders-2026.md).
- **Keputusan terbaru pengguna: semua izin Google Drive dipertahankan apa adanya.** Jangan mengubah `Editor/Writer` menjadi `Viewer/Reader`, atau mengubah ACL jenis apa pun selama migrasi.
- Temuan historis: 13/14 folder utama memiliki `anyone:writer` dan satu folder `anyone:reader`. **Keberadaan `anyone:writer` sendiri bukan blocker**; cukup audit baca-saja dan pastikan izin mahasiswa sumber/salinan ekuivalen tanpa mengubah permission.
- Jika salinan tidak mempertahankan akses peserta yang diperlukan, **stop file tersebut**, jangan memperbaiki ACL tanpa izin terpisah. File sumber selalu dipertahankan.
- Jaga pembatasan scope folder, verifikasi parent, course, ID sumber/salinan, cross-course refs serta transaksi terotorisasi. Backend batch 14 course belum terbukti tersedia.

## Batasan saat ini
- GitHub Actions dan Supabase Edge Function OIDC yang terpasang **baru teruji untuk dua folder FK UNEJ Blok 8 (total 8 materi)**, bukan mesin migrasi massal siap untuk semua course.
- Untuk perluasan, bangun mekanisme batch yang terotorisasi, terukur, mengaudit semua referensi dan memberi laporan per file. Jangan menganggap pilot sebagai izin mengganti seluruh course secara otomatis.
- Akses `anyone: writer` pada sejumlah file/folder Drive adalah risiko terpisah. Perubahan izin harus melalui keputusan tersendiri agar tidak memutus akses siswa atau staf.

**Instruksi singkat untuk pekerjaan berikutnya:** "Jalankan Protokol Migrasi Ownership Dokter Ambis untuk folder/course berikut, tanpa penghapusan file sumber."

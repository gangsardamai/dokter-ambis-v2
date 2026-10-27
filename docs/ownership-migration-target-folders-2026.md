# Target folder Migrasi Ownership Dokter Ambis 2026

Status audit: 27 Oktober 2026. **Dokumen publik ini sengaja tidak memuat ID folder, tautan Drive, ataupun email pengakses.** Daftar ID spesifik yang sudah diverifikasi tercantum pada pengaturan tugas otomatisasi terautentikasi, bukan di dokumentasi publik.

## Target resmi: 14 course / 6 universitas

| Universitas | Course | Folder materi utama |
|---|---|---|
| FK UHT | URO | RECORD + RANGKUMAN PPT 2026 |
| FK UHT | DMS | RECORD + RANGKUMAN PPT 2026 |
| FK UHT | Commed | RANGKUMAN PPT + RECORD / LIVE 2026 |
| FK UMS | Tropical Medicine | RANGKUMAN PPT + RECORD / LIVE 2026 |
| FK UMS | Endokrin | RECORD + RANGKUMAN PPT 2026 |
| FK UMY | Blok 14 | RANGKUMAN PPT + RECORD 2026 |
| FK UMY | KKLP / Blok 20 | RANGKUMAN PPT + RECORD 2026 |
| FK UNEJ | Blok 2 | MODUL DAN REKAMAN BLOK 2 2026 |
| FK UNEJ | Blok 8 | MODUL DAN REKAMAN BLOK 8 2026 |
| FK UNEJ | Blok 14 | MODUL DAN REKAMAN BLOK 14 2026 |
| FK UNRI | Blok 9 | RANGKUMAN PPT + LIVE / RECORD 2026 |
| FK UNRI | Masalah Sistem Indera | RANGKUMAN PPT + RECORD 2026 |
| FK UNRAM | Endokrin | RANGKUMAN PPT + RECORD 2026 |
| FK UNRAM | Kedokteran Keluarga | RANGKUMAN PPT + RECORD (tahun harus diverifikasi) |

## Batasan dan hasil audit
- Folder utama yang dicocokkan berjumlah 14. Penelusuran harus menggunakan **course UUID + folder Drive ID + parent chain yang diverifikasi** melalui koneksi terotorisasi, bukan nama mirip.
- Pada saat audit 27 Oktober, empat folder sasaran UNRI/UNRAM belum berisi item pada subfolder materi yang dituju. Materi lain di course lama tidak otomatis menjadi target periode 2026.
- Folder 2025, `Untuk Admin`, Try Out, serta folder yang tidak bisa divalidasi sebagai materi 2026 harus dilewati.
- Sudah ada dua folder pilot berhasil termigrasi pada FK UNEJ Blok 8. Hindari menyalin ulang sumber yang telah selesai.
- Temuan audit: 13 dari 14 folder utama memiliki akses tautan `writer`, termasuk induk dua folder pilot; satu folder sudah `reader`. Ini dicatat sebagai informasi saja; **tidak boleh mengubah permission tanpa instruksi baru pengguna**.
- **Perubahan izin publik folder belum dilakukan**. Koneksi Drive yang tersedia untuk task ini tidak memiliki operasi `permissions.update` pada folder. Jangan menandai `permission_fixed` sebelum dapat diverifikasi ulang oleh Google Drive.
- **Keputusan terbaru pengguna (27 Oktober 2026): pertahankan izin Editor/Writer atau Viewer/Reader sebagaimana saat ini.** Folder `anyone:writer` tidak otomatis menghalangi migrasi; verifikasi kesetaraan akses sumber dan salinan tanpa mengubah izin. Hentikan hanya file yang aksesnya tidak ekuivalen atau gagal pemeriksaan lainnya.
- **Dilarang menghapus file sumber milik orang lain.**

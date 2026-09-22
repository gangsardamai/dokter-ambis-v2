# DokterAmbis UX Interaction Rules

## Loading and completion feedback

This is a project-wide UX rule for every user-triggered action.

1. Any button or link that starts navigation, saves data, uploads data, connects data, deletes data, reorders data, or runs another asynchronous action must show an immediate loading state.
2. While the action is running, prevent repeat clicks.
3. After a successful data-changing action, show an explicit success state such as:
   - `Tersimpan ✓`
   - `Berhasil disimpan ✓`
   - `Selesai ✓`
4. On failure, show a clear error message and allow retry.
5. For instant local-only controls (for example a carousel arrow), the visual result itself is the completion feedback; do not add artificial delay.
6. Use action-specific loading copy when possible:
   - Save: `Menyimpan...`
   - Upload: `Mengunggah...`
   - Navigation: `Membuka...`
   - Delete: `Menghapus...`
   - Reorder: `Menyimpan urutan...`
   - Connect: `Menghubungkan...`

The default `PrimaryButton` includes loading feedback for submit actions and navigation links. New data-changing flows must also provide explicit success/error feedback after the action completes.

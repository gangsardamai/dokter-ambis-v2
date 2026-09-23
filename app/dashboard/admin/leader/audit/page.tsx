import Link from "next/link";
import { leaderAccessService } from "@/services/leader-access.service";

export default async function LeaderAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const requested = Number(query.page ?? 1);
  const page = Number.isSafeInteger(requested) ? Math.min(10000, Math.max(1, requested)) : 1;
  const { events, hasMore } = await leaderAccessService.getAuditEvents(page);
  return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <Link href="/dashboard/admin/leader" prefetch={false} className="text-sm font-bold text-blue-700">← Manajemen Leader</Link>
    <h1 className="text-2xl font-bold">Riwayat aktivitas Leader</h1>
    <p className="text-sm text-slate-500">Perubahan akses dan aktivitas Leader tercatat otomatis. Menampilkan maksimal 50 aktivitas per halaman.</p>
    <div className="space-y-3">{events.map(event => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold">{event.action} · {event.entity_type}</p>
      <p className="mt-1 text-xs text-slate-500">{new Date(event.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</p>
      <p className="mt-2 break-all text-xs text-slate-600">Akun: {event.actor_id ?? "Sistem"} · Data: {event.entity_id ?? "—"}</p>
      <details className="mt-2 text-sm"><summary className="cursor-pointer font-medium">Detail perubahan</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(event.changes, null, 2)}</pre></details>
    </article>)}</div>
    {events.length === 0 && <p className="text-sm text-slate-500">Belum ada aktivitas pada halaman ini.</p>}
    <nav aria-label="Halaman riwayat" className="flex gap-4 text-sm font-bold text-blue-700">
      {page > 1 && <Link prefetch={false} href={`/dashboard/admin/leader/audit?page=${page - 1}`}>← Sebelumnya</Link>}
      {hasMore && <Link prefetch={false} href={`/dashboard/admin/leader/audit?page=${page + 1}`}>Berikutnya →</Link>}
    </nav>
  </main>;
}

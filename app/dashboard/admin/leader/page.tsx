import {
  LEADER_PERMISSIONS,
  LEADER_PERMISSION_LABELS,
  type LeaderPermission,
} from "@/lib/leader-access";
import { PendingSubmitButton } from "@/components/forms/PendingForm";
import {
  courseService,
  leaderAccessService,
  organizationService,
  programService,
} from "@/services";

import {
  addLeaderScopeAction,
  promoteLeaderAction,
  removeLeaderScopeAction,
  setLeaderPermissionsAction,
  setLeaderStatusAction,
} from "./actions";

interface PageProps {
  searchParams: Promise<{ feedback?: string | string[] }>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const feedbackLabels: Record<string, string> = {
  "leader-created": "Peserta berhasil dijadikan Leader.",
  "leader-activated": "Leader berhasil diaktifkan.",
  "leader-deactivated": "Leader berhasil dinonaktifkan.",
  "permissions-updated": "Permission Leader berhasil diperbarui.",
  "scope-added": "Scope Leader berhasil ditambahkan.",
  "scope-removed": "Scope Leader berhasil dihapus.",
};

export default async function LeaderManagementPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const feedback = first(query.feedback);

  const [{ leaders, scopes, permissions }, organizations, programs, courses] =
    await Promise.all([
      leaderAccessService.getManagementData(),
      organizationService.getOrganizations(),
      programService.getPrograms(),
      courseService.getCourses(),
    ]);

  const organizationMap = new Map(
    organizations.map((item) => [item.id, item.title]),
  );
  const programMap = new Map(programs.map((item) => [item.id, item.title]));
  const courseMap = new Map(courses.map((item) => [item.id, item.title]));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Hak Akses
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Manajemen Leader
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Atur siapa yang menjadi Leader, fitur yang boleh dikelola, serta
          Universitas, Program, dan Course yang menjadi scope kerja masing-masing.
        </p>
      </div>

      {feedbackLabels[feedback] && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
        >
          {feedbackLabels[feedback]}
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Tambah Leader</h2>
        <p className="mt-1 text-sm text-slate-500">
          Masukkan nomor WhatsApp peserta aktif. Akun yang sama akan berubah
          menjadi role Leader tanpa membuat akun baru.
        </p>
        <form action={promoteLeaderAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            name="phone"
            type="tel"
            required
            placeholder="Contoh: 081234567890"
            className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <PendingSubmitButton
            pendingLabel="Menambahkan..."
            className="min-h-11 rounded-xl bg-[#1769cf] px-5 text-sm font-black text-white disabled:cursor-not-allowed"
          >
            Jadikan Leader
          </PendingSubmitButton>
        </form>
      </section>

      {leaders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Belum ada akun Leader.
        </div>
      ) : (
        <div className="space-y-6">
          {leaders.map((leader) => {
            const leaderScopes = scopes.filter(
              (scope) => scope.leader_id === leader.id,
            );
            const enabled = new Set(
              permissions
                .filter(
                  (item) => item.leader_id === leader.id && item.enabled,
                )
                .map((item) => item.permission)
                .filter((item): item is LeaderPermission =>
                  LEADER_PERMISSIONS.includes(item as LeaderPermission),
                ),
            );

            return (
              <section
                key={leader.id}
                className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {leader.full_name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {leader.phone || "Nomor WhatsApp belum tersedia"}
                    </p>
                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        leader.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {leader.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <form action={setLeaderStatusAction}>
                    <input type="hidden" name="leader_id" value={leader.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={leader.status === "active" ? "inactive" : "active"}
                    />
                    <PendingSubmitButton
                      pendingLabel="Menyimpan..."
                      className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 disabled:cursor-not-allowed"
                    >
                      {leader.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </PendingSubmitButton>
                  </form>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-black text-slate-950">Permission</h3>
                    <form action={setLeaderPermissionsAction} className="mt-4 space-y-3">
                      <input type="hidden" name="leader_id" value={leader.id} />
                      {LEADER_PERMISSIONS.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700"
                        >
                          <input
                            type="checkbox"
                            name={permission}
                            defaultChecked={enabled.has(permission)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          {LEADER_PERMISSION_LABELS[permission]}
                        </label>
                      ))}
                      <PendingSubmitButton
                        pendingLabel="Menyimpan..."
                        className="min-h-10 w-full rounded-xl bg-[#1769cf] px-4 text-sm font-black text-white disabled:cursor-not-allowed"
                      >
                        Simpan Permission
                      </PendingSubmitButton>
                    </form>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-black text-slate-950">Scope Aktif</h3>
                    <div className="mt-4 space-y-2">
                      {leaderScopes.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                          Belum ada scope. Leader belum dapat melihat data operasional.
                        </p>
                      ) : (
                        leaderScopes.map((scope) => {
                          const label = scope.organization_id
                            ? `Universitas · ${organizationMap.get(scope.organization_id) ?? scope.organization_id}`
                            : scope.program_id
                              ? `Program · ${programMap.get(scope.program_id) ?? scope.program_id}`
                              : `Course · ${courseMap.get(scope.course_id ?? "") ?? scope.course_id}`;

                          return (
                            <div
                              key={scope.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
                            >
                              <span className="min-w-0 break-words text-sm font-bold text-slate-700">
                                {label}
                              </span>
                              <form action={removeLeaderScopeAction}>
                                <input type="hidden" name="scope_id" value={scope.id} />
                                <PendingSubmitButton
                                  pendingLabel="..."
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed"
                                >
                                  Hapus
                                </PendingSubmitButton>
                              </form>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      type: "organization",
                      label: "Universitas",
                      items: organizations.map((item) => ({
                        id: item.id,
                        label: item.short_name ?? item.title,
                      })),
                    },
                    {
                      type: "program",
                      label: "Program",
                      items: programs.map((item) => ({
                        id: item.id,
                        label: item.title,
                      })),
                    },
                    {
                      type: "course",
                      label: "Course",
                      items: courses.map((item) => ({
                        id: item.id,
                        label: item.title,
                      })),
                    },
                  ].map((group) => (
                    <form
                      key={group.type}
                      action={addLeaderScopeAction}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <input type="hidden" name="leader_id" value={leader.id} />
                      <input type="hidden" name="scope_type" value={group.type} />
                      <label className="text-sm font-black text-slate-700">
                        Tambah Scope {group.label}
                        <select
                          name="scope_id"
                          required
                          defaultValue=""
                          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
                        >
                          <option value="" disabled>Pilih {group.label}</option>
                          {group.items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <PendingSubmitButton
                        pendingLabel="Menambahkan..."
                        className="mt-3 min-h-10 w-full rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700 disabled:cursor-not-allowed"
                      >
                        Tambahkan
                      </PendingSubmitButton>
                    </form>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

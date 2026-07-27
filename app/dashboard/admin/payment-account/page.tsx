import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { paymentAccountService, profileService } from "@/services";

import {
  createPaymentAccountAction,
  setDefaultPaymentAccountAction,
} from "./actions";

interface Props {
  searchParams: Promise<{
    error?: string | string[];
    created?: string | string[];
    saved?: string | string[];
  }>;
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatAccountNumber(value: string) {
  return value.replace(/(.{4})/g, "$1 ").trim();
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default async function PaymentAccountPage({ searchParams }: Props) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const query = await searchParams;
  const accounts = await paymentAccountService.getAccounts();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Rekening Pembayaran"
        description="Kelola rekening yang dapat dipilih pada setiap course. Rekening lama cukup dinonaktifkan, bukan dihapus."
      />

      {param(query.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {param(query.error)}
        </div>
      )}
      {(param(query.created) === "true" || param(query.saved) === "true") && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          Rekening pembayaran berhasil disimpan.
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-slate-950">Tambah Rekening</h2>
        <form action={createPaymentAccountAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Label rekening</span>
            <input name="label" required maxLength={120} placeholder="Contoh: BRI Gangsar" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama bank</span>
            <input name="bankName" required maxLength={80} placeholder="Contoh: BRI" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nomor rekening</span>
            <input name="accountNumber" required inputMode="numeric" maxLength={80} placeholder="Masukkan nomor rekening" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama pemilik rekening</span>
            <input name="accountHolderName" required maxLength={160} placeholder="Nama sesuai rekening" className={inputClass} />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
            Rekening aktif
          </label>
          <div className="flex justify-end">
            <button className="min-h-11 rounded-xl bg-blue-600 px-6 py-2 text-sm font-black text-white hover:bg-blue-700">
              Tambahkan Rekening
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  {account.is_default && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">DEFAULT</span>}
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {account.is_active ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black text-slate-950">{account.label}</h2>
                <p className="mt-1 font-bold text-blue-700">{account.bank_name}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-xl font-black text-slate-900">{account.courseCount}</p>
                <p className="text-xs text-slate-500">course</p>
              </div>
            </div>
            <p className="mt-5 font-mono text-lg font-black tracking-wide text-slate-950">{formatAccountNumber(account.account_number)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">a.n. {account.account_holder_name}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/dashboard/admin/payment-account/${account.id}/edit`} className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">Edit</Link>
              {!account.is_default && account.is_active && (
                <form action={setDefaultPaymentAccountAction.bind(null, account.id)}>
                  <button className="min-h-10 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">Jadikan Default</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

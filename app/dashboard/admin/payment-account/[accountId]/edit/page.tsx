import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { paymentAccountService, profileService } from "@/services";

import { updatePaymentAccountAction } from "../../actions";

interface Props {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default async function EditPaymentAccountPage({ params, searchParams }: Props) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { accountId } = await params;
  const query = await searchParams;
  const account = await paymentAccountService.getAccountById(accountId);
  if (!account) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link href="/dashboard/admin/payment-account" className="text-sm font-black text-blue-700 hover:underline">← Kembali</Link>
      <PageHeader title="Edit Rekening Pembayaran" description={account.label} />
      {param(query.error) && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{param(query.error)}</div>}
      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <form action={updatePaymentAccountAction.bind(null, account.id)} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Label rekening</span>
            <input name="label" required maxLength={120} defaultValue={account.label} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama bank</span>
            <input name="bankName" required maxLength={80} defaultValue={account.bank_name} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nomor rekening</span>
            <input name="accountNumber" required inputMode="numeric" maxLength={80} defaultValue={account.account_number} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama pemilik rekening</span>
            <input name="accountHolderName" required maxLength={160} defaultValue={account.account_holder_name} className={inputClass} />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={account.is_active} disabled={account.is_default} className="h-4 w-4" />
            Rekening aktif {account.is_default ? "(rekening default harus aktif)" : ""}
          </label>
          {account.is_default && <input type="hidden" name="isActive" value="on" />}
          <div className="flex justify-end">
            <button className="min-h-11 rounded-xl bg-blue-600 px-6 py-2 text-sm font-black text-white">Simpan Perubahan</button>
          </div>
        </form>
      </section>
    </main>
  );
}

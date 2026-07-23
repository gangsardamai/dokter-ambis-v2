import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-900">
        {value?.trim() || "Belum diisi"}
      </p>
    </div>
  );
}

export default async function MentorProfilePage() {
  const [profile, supabase] = await Promise.all([
    profileService.getCurrentProfile(),
    createClient(),
  ]);

  if (!profile) redirect("/login");

  const [authResult, mentorResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("mentor_details")
      .select("bio, specialization, education")
      .eq("profile_id", profile.id)
      .maybeSingle(),
  ]);

  if (mentorResult.error) throw mentorResult.error;

  const initials = profile.full_name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-white/20 bg-white/15 text-2xl font-black shadow-lg backdrop-blur-sm">
            {initials}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              Profil Mentor
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {profile.full_name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-blue-100">
              Informasi akun dan latar belakang mentor DokterAmbis
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
            Informasi Mentor
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Data ini digunakan untuk identitas pengajar di dalam platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Nama Lengkap" value={profile.full_name} />
          <ProfileField
            label="Email Terdaftar"
            value={authResult.data.user?.email}
          />
          <ProfileField label="Nomor WhatsApp" value={profile.phone} />
          <ProfileField
            label="Universitas Asal"
            value={profile.university_origin}
          />
          <ProfileField
            label="Spesialisasi"
            value={mentorResult.data?.specialization}
          />
          <ProfileField
            label="Pendidikan"
            value={mentorResult.data?.education}
          />
        </div>

        {mentorResult.data?.bio && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-500">
              Bio Mentor
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
              {mentorResult.data.bio}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

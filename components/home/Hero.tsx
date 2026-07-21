import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f4f8ff] via-white to-[#eaf3ff]">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative mx-auto grid min-h-[590px] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.95fr_1.05fr] md:py-16 lg:gap-16">
        {/* Ilustrasi: kiri di laptop, bawah di smartphone */}
        <div className="relative order-2 mx-auto w-full max-w-[560px] md:order-1">
          <div className="absolute inset-x-12 bottom-5 h-40 rounded-full bg-blue-400/15 blur-3xl" />

          <Image
            src="/illustrations/medical-hero.png"
            alt="Ilustrasi mahasiswa kedokteran belajar bersama"
            width={1448}
            height={1086}
            priority
            className="relative h-auto w-full drop-shadow-[0_24px_30px_rgba(3,59,99,0.12)]"
          />
        </div>

        {/* Tulisan: kanan di laptop, atas di smartphone */}
        <div className="order-1 max-w-2xl text-center md:order-2 md:text-left">
          <span className="inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1769cf]">
            Bimbingan Belajar Kedokteran
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-[-0.045em] text-[#061827] sm:text-5xl lg:text-[3.45rem]">
            Belajar Sesuai Sistem{" "}
            <span className="bg-gradient-to-r from-[#1769cf] to-[#033b63] bg-clip-text text-transparent">
              Universitasmu
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-600 md:mx-0 md:text-lg">
            Platform belajar kedokteran berbasis
            blok yang disusun sesuai kurikulum
            masing-masing fakultas kedokteran.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-7 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_25px_rgba(23,105,207,0.22)] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Mulai Belajar
            </Link>

            <a
              href="#program"
              className="rounded-xl border border-blue-200 bg-white px-7 py-3.5 text-center text-sm font-bold text-[#1769cf] transition hover:border-blue-400 hover:bg-blue-50"
            >
              Lihat Program
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
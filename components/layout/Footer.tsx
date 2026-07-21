import Image from "next/image";
import Link from "next/link";

const contacts = [
  {
    label: "Email",
    value: "adm.ambitious@gmail.com",
    href: "mailto:adm.ambitious@gmail.com",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 6.5h16v11H4v-11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m5 7.5 7 5 7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "WhatsApp dr. Gangsar",
    value: "0822 3312 5649",
    href: "https://wa.me/6282233125649?text=Halo%20dr.%20Gangsar%2C%20saya%20ingin%20bertanya%20tentang%20DokterAmbis.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 8.5c.4 2.8 1.8 4.2 4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "WhatsApp dr. Bagus",
    value: "0822 2883 5542",
    href: "https://wa.me/6282228835542?text=Halo%20dr.%20Bagus%2C%20saya%20ingin%20bertanya%20tentang%20DokterAmbis.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 8.5c.4 2.8 1.8 4.2 4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    value: "@dokterambis",
    href: "https://www.instagram.com/dokterambis",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.9" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-gradient-to-br from-[#033b63] via-[#064d82] to-[#1769cf] text-white">
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[55px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-blue-400/10" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="DokterAmbis — Beranda">
            <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-950/10">
              <Image
                src="/brand/dokterambis-logo.png"
                alt=""
                width={500}
                height={500}
                className="absolute h-[92px] w-[92px] max-w-none"
              />
            </span>

            <span className="text-2xl font-extrabold tracking-[-0.04em]">
              Dokter<span className="text-blue-200">Ambis</span>
            </span>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100 sm:text-base">
            Platform belajar kedokteran berbasis blok yang disusun sesuai sistem universitasmu.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
            Hubungi Kami
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target={contact.href.startsWith("http") ? "_blank" : undefined}
                rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.14]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-100 transition group-hover:bg-white group-hover:text-[#1769cf]">
                  {contact.icon}
                </span>

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-200">
                    {contact.label}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-white">
                    {contact.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-blue-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 DokterAmbis. All rights reserved.</p>
          <p>Belajar Sesuai Sistem Universitasmu</p>
        </div>
      </div>
    </footer>
  );
}
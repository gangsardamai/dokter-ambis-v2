"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const menus = [
  { label: "Universitas", href: "#universitas" },
  { label: "Program", href: "#program" },
  { label: "Mentor", href: "#mentor" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg">
      <nav
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6"
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="DokterAmbis — Beranda"
        >
          <span className="relative block h-11 w-12 overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100">
            <Image
              src="/brand/dokterambis-logo.png"
              alt=""
              width={500}
              height={500}
              priority
              className="absolute -left-[18px] -top-[11px] h-[80px] w-[80px] max-w-none"
            />
          </span>

          <span className="text-xl font-extrabold tracking-[-0.04em] text-[#061827]">
            Dokter
            <span className="text-[#1769cf]">
              Ambis
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {menus.map((menu) => (
            <a
              key={menu.href}
              href={menu.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-[#1769cf]"
            >
              {menu.label}
            </a>
          ))}

          <Link
            href="/login"
            className="text-sm font-semibold text-[#033b63] transition hover:text-[#1769cf]"
          >
            Masuk
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Daftar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-[#061827] md:hidden"
          aria-label={
            menuOpen ? "Tutup menu" : "Buka menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-1">
            {menus.map((menu) => (
              <a
                key={menu.href}
                href={menu.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1769cf]"
              >
                {menu.label}
              </a>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-[#033b63]"
              >
                Masuk
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-3 text-center text-sm font-bold text-white"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
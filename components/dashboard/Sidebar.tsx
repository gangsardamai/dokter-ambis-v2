"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardMenus } from "@/lib/dashboard-menu";

interface SidebarProps {
  onNavigate?: () => void;
}

const fallbackHref = "/dashboard/admin";

function isActivePath(pathname: string, href: string) {
  if (href === fallbackHref) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const menu = dashboardMenus.admin;

  return (
    <aside className="flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden bg-gradient-to-b from-[#1769cf] via-[#033b63] to-[#061827] text-white shadow-2xl lg:w-72 lg:shadow-none">
      <div className="relative border-b border-white/10 p-5 sm:p-6">
        <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />

        <Link
          href={fallbackHref}
          onClick={onNavigate}
          className="relative flex items-center gap-3"
          aria-label="DokterAmbis — Dashboard Admin"
        >
          <span className="relative block h-12 w-13 overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-blue-950/20 ring-1 ring-white/40">
            <Image
              src="/brand/dokterambis-logo.png"
              alt=""
              width={500}
              height={500}
              priority
              className="absolute -left-[19px] -top-[12px] h-[86px] w-[86px] max-w-none"
            />
          </span>

          <span>
            <span className="block text-xl font-extrabold tracking-[-0.04em]">
              Dokter<span className="text-cyan-200">Ambis</span>
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
              Admin Console
            </span>
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {menu.map((section) => (
          <div
            key={section.title}
            className="mb-6"
          >
            <p className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-blue-100/60">
              {section.title}
            </p>

            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={`${section.title}-${item.title}`}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#033b63] shadow-lg shadow-blue-950/15"
                        : "text-blue-50/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{item.title}</span>
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-[#1769cf]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

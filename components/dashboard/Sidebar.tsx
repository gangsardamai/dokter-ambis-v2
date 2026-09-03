"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  dashboardMenus,
  type ProfileRole,
} from "@/lib/dashboard-menu";

interface SidebarProps {
  role: ProfileRole;
  messageUnreadCount?: number;
  onNavigate?: () => void;
}

const homeHrefByRole: Record<ProfileRole, string> = {
  admin: "/dashboard/admin",
  mentor: "/dashboard/mentor",
  student: "/dashboard/student",
};

const consoleLabelByRole: Record<ProfileRole, string> = {
  admin: "Admin Console",
  mentor: "Mentor Console",
  student: "Student Console",
};

function isActivePath(
  pathname: string,
  href: string,
  homeHref: string,
) {
  if (href === homeHref) {
    if (pathname === href) return true;

    if (
      homeHref === "/dashboard/student" &&
      pathname.startsWith("/dashboard/student/my-course/")
    ) {
      return true;
    }

    if (
      homeHref === "/dashboard/mentor" &&
      pathname.startsWith("/dashboard/mentor/course/")
    ) {
      return true;
    }

    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  role,
  messageUnreadCount = 0,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const menu = dashboardMenus[role];
  const homeHref = homeHrefByRole[role];
  const [pendingNavigation, setPendingNavigation] = useState<{
    href: string;
    sourcePath: string;
  } | null>(null);
  const pendingHref =
    pendingNavigation?.sourcePath === pathname
      ? pendingNavigation.href
      : null;

  return (
    <aside className="flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden bg-gradient-to-b from-[#1769cf] via-[#033b63] to-[#061827] text-white shadow-2xl lg:w-72 lg:shadow-none">
      <div className="relative border-b border-white/10 p-5 sm:p-6">
        <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />

        <Link
          href={homeHref}
          onClick={() => {
            if (pathname !== homeHref) {
              setPendingNavigation({ href: homeHref, sourcePath: pathname });
            }
            onNavigate?.();
          }}
          aria-busy={pendingHref === homeHref || undefined}
          className="relative flex min-w-0 items-center gap-3"
          aria-label={`DokterAmbis — ${consoleLabelByRole[role]}`}
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/95 shadow-lg shadow-blue-950/20 ring-1 ring-white/40">
            <Image
              src="/brand/dokterambis-logo.png"
              alt=""
              width={500}
              height={500}
              priority
              className="h-[52px] w-[52px] object-contain"
            />
          </span>

          <span className="min-w-0">
            <span className="block whitespace-nowrap text-xl font-extrabold leading-none tracking-[-0.04em]">
              Dokter<span className="text-cyan-200">Ambis</span>
            </span>
            <span className="mt-1.5 block whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
              {consoleLabelByRole[role]}
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
                const active = isActivePath(
                  pathname,
                  item.href,
                  homeHref,
                );
                const messageHref =
                  role === "admin"
                    ? "/dashboard/admin/messages"
                    : role === "mentor"
                      ? "/dashboard/mentor/messages"
                      : "/dashboard/student/messages";
                const showMessageBadge =
                  item.href === messageHref && messageUnreadCount > 0;
                const pending = pendingHref === item.href;

                return (
                  <Link
                    key={`${section.title}-${item.title}`}
                    href={item.href}
                    onClick={() => {
                      if (pathname !== item.href) {
                        setPendingNavigation({
                          href: item.href,
                          sourcePath: pathname,
                        });
                      }
                      onNavigate?.();
                    }}
                    aria-busy={pending || undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-[#033b63] shadow-lg shadow-blue-950/15"
                        : "text-blue-50/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{item.title}</span>
                    {pending ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 shrink-0 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="9" className="opacity-25" />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          className="opacity-90"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : showMessageBadge ? (
                      <span
                        className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-black ${
                          active
                            ? "bg-amber-100 text-amber-700"
                            : "bg-amber-400 text-amber-950"
                        }`}
                      >
                        {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                      </span>
                    ) : active ? (
                      <span className="h-2 w-2 rounded-full bg-[#1769cf]" />
                    ) : null}
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

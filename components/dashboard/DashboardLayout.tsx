"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getLessonMessageUnreadCountAction } from "@/app/actions/lesson-message.actions";
import type { ProfileRole } from "@/lib/dashboard-menu";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: ProfileRole;
  messageUnreadCount?: number;
}

interface DashboardSidebarContextValue {
  openSidebar: () => void;
}

const DashboardSidebarContext = createContext<DashboardSidebarContextValue | null>(null);

export function useDashboardSidebar() {
  return useContext(DashboardSidebarContext);
}

export default function DashboardLayout({
  children,
  role,
  messageUnreadCount = 0,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMessageUnreadCount, setCurrentMessageUnreadCount] = useState(
    messageUnreadCount,
  );

  useEffect(() => {
    function updateUnreadCount(event: Event) {
      const detail = (event as CustomEvent<number>).detail;
      if (Number.isFinite(detail)) setCurrentMessageUnreadCount(detail);
    }

    window.addEventListener(
      "dashboard-message-unread-count",
      updateUnreadCount,
    );
    return () => {
      window.removeEventListener(
        "dashboard-message-unread-count",
        updateUnreadCount,
      );
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshUnreadCount() {
      const count = await getLessonMessageUnreadCountAction();
      if (active) setCurrentMessageUnreadCount(count);
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);
  const sidebarContext = useMemo(
    () => ({
      openSidebar: () => setSidebarOpen(true),
    }),
    [],
  );

  return (
    <DashboardSidebarContext.Provider value={sidebarContext}>
      <div className="min-h-screen overflow-x-hidden bg-[#f4f8ff] lg:flex">
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
          <Sidebar
            role={role}
            messageUnreadCount={currentMessageUnreadCount}
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Tutup menu dashboard"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative h-full">
              <Sidebar
                role={role}
                messageUnreadCount={currentMessageUnreadCount}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-72">
          {children}
        </div>
      </div>
    </DashboardSidebarContext.Provider>
  );
}

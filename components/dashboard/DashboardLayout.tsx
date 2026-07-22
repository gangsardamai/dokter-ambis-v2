"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
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
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          <Sidebar />
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
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
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

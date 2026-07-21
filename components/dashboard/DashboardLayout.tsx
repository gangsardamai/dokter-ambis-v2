import type { ReactNode } from "react";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {

  return (

    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        {children}

      </div>

    </div>

  );

}
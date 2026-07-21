import Link from "next/link";

import { dashboardMenus } from "@/lib/dashboard-menu";

export default function Sidebar() {

  const menu = dashboardMenus.admin;

  return (

    <aside className="w-64 border-r bg-white">

      <div className="border-b p-6">

        <h2 className="text-xl font-bold">

          Dokter Ambis

        </h2>

      </div>

      <nav className="overflow-y-auto py-4">

        {menu.map((section) => (

          <div
            key={section.title}
            className="mb-6"
          >

            <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">

              {section.title}

            </p>

            <div className="flex flex-col">

              {section.items.map((item) => (

                <Link
                  key={item.href}
                  href={item.href}
                  className="px-6 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >

                  {item.title}

                </Link>

              ))}

            </div>

          </div>

        ))}

      </nav>

    </aside>

  );

}
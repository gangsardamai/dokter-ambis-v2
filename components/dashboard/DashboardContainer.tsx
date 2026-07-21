import type { ReactNode } from "react";

interface DashboardContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function DashboardContainer({
  title,
  description,
  children,
}: DashboardContainerProps) {

  return (

    <main className="p-8">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">

          {title}

        </h1>

        {description && (

          <p className="mt-2 text-gray-600">

            {description}

          </p>

        )}

      </div>

      {children}

    </main>

  );

}
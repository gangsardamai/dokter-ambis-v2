import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  description,
  children,
}: AuthCardProps) {

  return (

    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">

          {title}

        </h1>

        {description && (

          <p className="mt-2 text-sm text-gray-600">

            {description}

          </p>

        )}

      </div>

      {children}

    </div>

  );

}
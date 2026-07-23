import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-extrabold tracking-[-0.04em] text-[#061827] lg:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

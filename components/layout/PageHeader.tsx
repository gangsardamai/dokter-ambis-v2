interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-10">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-4xl font-bold">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-gray-600 leading-7">
              {description}
            </p>
          )}

        </div>

        {children}

      </div>

    </div>
  );
}
interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: SectionTitleProps) {
  return (
    <div className="mb-5">

      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-1 text-gray-500">
          {subtitle}
        </p>
      )}

    </div>
  );
}
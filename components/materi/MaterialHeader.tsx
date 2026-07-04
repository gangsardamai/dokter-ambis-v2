interface LessonHeaderProps {
  title: string;
  description?: string;
}

export default function LessonHeader({
  title,
  description,
}: LessonHeaderProps) {
  return (
    <div className="mb-10">

      <p className="text-blue-600 font-semibold uppercase tracking-wider">
        Program Blok
      </p>

      <h1 className="text-4xl font-bold mt-2">
        {title}
      </h1>

      {description && (
        <p className="text-gray-600 mt-4 max-w-3xl leading-7">
          {description}
        </p>
      )}

    </div>
  );
}
interface LessonProgressProps {
  progress: number;
}

export default function LessonProgress({
  progress,
}: LessonProgressProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8">

      <div className="flex justify-between mb-3">

        <span className="font-semibold">
          Progress Belajar
        </span>

        <span className="font-bold">
          {progress}%
        </span>

      </div>

      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">

        <div
          className="bg-blue-600 h-full"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}
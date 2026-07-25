import type {
  QuizScorePoint,
  StudentCourseProgressSummary,
} from "@/types/student-course-progress";

interface CourseProgressSummaryCardsProps {
  summary: StudentCourseProgressSummary;
}

interface StudentCourseInsightsProps {
  summary: StudentCourseProgressSummary;
}

function SummaryCard({
  label,
  value,
  detail,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <article className="min-w-0 rounded-2xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-blue-100">{detail}</p>

      {typeof progress === "number" && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-white transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </article>
  );
}

export function CourseProgressSummaryCards({
  summary,
}: CourseProgressSummaryCardsProps) {
  const remainingLessons = Math.max(
    summary.totalLessons - summary.completedLessons,
    0,
  );
  const remainingQuizzes = Math.max(
    summary.totalQuizzes - summary.completedQuizzes,
    0,
  );

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[31rem]">
      <SummaryCard
        label="Progress Course"
        value={`${summary.progressPercentage}%`}
        detail={
          summary.totalLessons > 0
            ? `${remainingLessons} lesson tersisa`
            : "Belum ada lesson wajib"
        }
        progress={summary.progressPercentage}
      />
      <SummaryCard
        label="Lesson Selesai"
        value={`${summary.completedLessons}/${summary.totalLessons}`}
        detail="Lesson wajib"
      />
      <SummaryCard
        label="Quiz Dikerjakan"
        value={`${summary.completedQuizzes}/${summary.totalQuizzes}`}
        detail={
          summary.totalQuizzes > 0
            ? `${remainingQuizzes} belum dikerjakan`
            : "Quiz belum tersedia"
        }
      />
    </div>
  );
}

function FolderProgress({
  summary,
}: StudentCourseInsightsProps) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Progress per Folder
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          Kemajuan Materi
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        {summary.folderProgress.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            Folder materi belum tersedia.
          </p>
        ) : (
          summary.folderProgress.map((folder) => (
            <article key={folder.folderId ?? "ungrouped"}>
              <div className="flex items-start justify-between gap-4 text-sm">
                <p className="font-black text-slate-800">{folder.title}</p>
                <p className="shrink-0 font-black text-blue-700">
                  {folder.totalLessons > 0
                    ? `${folder.completedLessons}/${folder.totalLessons}`
                    : "Belum tersedia"}
                </p>
              </div>

              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                role={folder.percentage === null ? undefined : "progressbar"}
                aria-label={folder.title}
                aria-valuemin={folder.percentage === null ? undefined : 0}
                aria-valuemax={folder.percentage === null ? undefined : 100}
                aria-valuenow={folder.percentage ?? undefined}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-[width]"
                  style={{ width: `${folder.percentage ?? 0}%` }}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ScoreChart({ scores }: { scores: QuizScorePoint[] }) {
  const visibleScores = scores.slice(-12);

  if (visibleScores.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="font-black text-slate-700">Belum ada nilai</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Grafik akan muncul setelah peserta menyelesaikan quiz atau try out.
        </p>
      </div>
    );
  }

  const width = 720;
  const height = 260;
  const paddingX = 42;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const denominator = Math.max(visibleScores.length - 1, 1);
  const points = visibleScores.map((item, index) => {
    const boundedScore = Math.max(0, Math.min(item.score, 100));
    return {
      ...item,
      x: paddingX + (index / denominator) * chartWidth,
      y: paddingY + ((100 - boundedScore) / 100) * chartHeight,
    };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="mt-5">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[36rem]"
          role="img"
          aria-label="Grafik nilai terbaik quiz dan try out"
        >
          {[0, 25, 50, 75, 100].map((score) => {
            const y = paddingY + ((100 - score) / 100) * chartHeight;

            return (
              <g key={score}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200"
                  strokeDasharray="4 6"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-bold"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="currentColor"
              className="text-blue-600"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => (
            <g key={point.quizId}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="currentColor"
                className={
                  point.assessmentType === "try_out"
                    ? "text-amber-500"
                    : "text-blue-600"
                }
              >
                <title>{`${point.quizTitle}: ${point.score}`}</title>
              </circle>
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-bold"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {visibleScores.map((item, index) => (
          <div
            key={item.quizId}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-black text-slate-700">
                {index + 1}. {item.quizTitle}
              </p>
              <p className="mt-0.5 font-semibold text-slate-500">
                {item.assessmentType === "try_out" ? "Try Out" : "Quiz"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-black text-blue-700 ring-1 ring-slate-200">
              {Math.round(item.score)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessmentPerformance({
  summary,
}: StudentCourseInsightsProps) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Perkembangan Nilai
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        Quiz dan Try Out
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Grafik menggunakan nilai terbaik dari setiap quiz atau try out yang telah dikerjakan.
      </p>

      <ScoreChart scores={summary.scoreHistory} />
    </section>
  );
}

function WeakTopics({ summary }: StudentCourseInsightsProps) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Rekomendasi Belajar
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        Topik yang Perlu Dipelajari Ulang
      </h2>

      {summary.weakTopics.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="font-black text-emerald-800">
            Tidak ada topik di bawah nilai kelulusan.
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Topik akan muncul setelah quiz dikerjakan dan nilai terbaiknya belum mencapai batas kelulusan.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {summary.weakTopics.slice(0, 5).map((topic) => (
            <article
              key={topic.quizId}
              className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-black text-slate-900">
                    {topic.lessonTitle}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {topic.quizTitle}
                  </p>
                  <p className="mt-2 text-xs font-black text-amber-700">
                    Nilai terbaik {Math.round(topic.bestScore)} · Target {topic.passingScore}
                  </p>
                </div>

                <a
                  href={`#lesson-${topic.lessonId}`}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Pelajari Kembali
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function StudentCourseInsights({
  summary,
}: StudentCourseInsightsProps) {
  return (
    <section aria-label="Statistik belajar" className="space-y-5">
      <FolderProgress summary={summary} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <AssessmentPerformance summary={summary} />
        <WeakTopics summary={summary} />
      </div>
    </section>
  );
}

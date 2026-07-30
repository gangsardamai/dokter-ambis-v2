import {
  parseCourseDescription,
  type CourseDescriptionTone,
} from "@/lib/course-description";

interface CourseDescriptionProps {
  description: string | null | undefined;
}

const toneClasses: Record<
  CourseDescriptionTone,
  {
    container: string;
    title: string;
    marker: string;
  }
> = {
  default: {
    container: "border-slate-200 bg-slate-50/80",
    title: "text-slate-950",
    marker: "bg-emerald-100 text-emerald-700",
  },
  price: {
    container: "border-blue-200 bg-blue-50/70",
    title: "text-blue-950",
    marker: "bg-blue-100 text-blue-700",
  },
  note: {
    container: "border-amber-200 bg-amber-50",
    title: "text-amber-950",
    marker: "bg-amber-100 text-amber-700",
  },
};

export default function CourseDescription({
  description,
}: CourseDescriptionProps) {
  const sections = parseCourseDescription(description);

  if (sections.length === 0) {
    return (
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Deskripsi kelas akan segera diperbarui oleh tim DokterAmbis.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {sections.map((section, sectionIndex) => {
        const tone = toneClasses[section.tone];

        return (
          <section
            key={`${section.title ?? "description"}-${sectionIndex}`}
            className={`rounded-2xl border p-4 sm:p-5 ${tone.container}`}
          >
            {section.title && (
              <h3 className={`text-sm font-black ${tone.title}`}>
                {section.title}
              </h3>
            )}

            {section.paragraphs.length > 0 && (
              <div className={`${section.title ? "mt-3" : ""} space-y-2`}>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${paragraph}-${paragraphIndex}`}
                    className="break-words text-sm leading-6 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {section.items.length > 0 && (
              <ul
                className={`${
                  section.title || section.paragraphs.length > 0 ? "mt-3" : ""
                } space-y-2.5`}
              >
                {section.items.map((item, itemIndex) => (
                  <li
                    key={`${item}-${itemIndex}`}
                    className="flex min-w-0 items-start gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-black ${tone.marker}`}
                    >
                      {section.tone === "default" ? "✓" : "•"}
                    </span>
                    <span className="min-w-0 break-words text-sm leading-6 text-slate-600">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

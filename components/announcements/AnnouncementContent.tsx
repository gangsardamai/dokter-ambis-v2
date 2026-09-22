import type { ReactNode } from "react";

interface AnnouncementContentProps {
  content: string;
  compact?: boolean;
}

type ListItem = {
  text: string;
  number?: number;
};

type ContentBlock =
  | {
      type: "paragraph";
      lines: string[];
    }
  | {
      type: "unordered";
      items: ListItem[];
    }
  | {
      type: "ordered";
      items: ListItem[];
      start: number;
    };

const bulletPattern = /^\s*[-*•–—]\s+(.+)$/;
const numberedPattern = /^\s*(\d+)[.)]\s+(.+)$/;

function parseAnnouncementContent(content: string): ContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const bulletMatch = line.match(bulletPattern);
    if (bulletMatch) {
      const items: ListItem[] = [];

      while (index < lines.length) {
        const match = lines[index].match(bulletPattern);
        if (!match) break;

        items.push({ text: match[1] });
        index += 1;
      }

      blocks.push({ type: "unordered", items });
      continue;
    }

    const numberedMatch = line.match(numberedPattern);
    if (numberedMatch) {
      const items: ListItem[] = [];
      const start = Number(numberedMatch[1]);

      while (index < lines.length) {
        const match = lines[index].match(numberedPattern);
        if (!match) break;

        items.push({
          number: Number(match[1]),
          text: match[2],
        });
        index += 1;
      }

      blocks.push({ type: "ordered", items, start });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const current = lines[index];

      if (
        !current.trim() ||
        bulletPattern.test(current) ||
        numberedPattern.test(current)
      ) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      lines: paragraphLines,
    });
  }

  return blocks;
}

export default function AnnouncementContent({
  content,
  compact = false,
}: AnnouncementContentProps) {
  const blocks = parseAnnouncementContent(content);
  const textClass = compact
    ? "text-[15px] leading-6 text-slate-600 sm:text-sm"
    : "text-sm leading-7 text-slate-700 sm:text-base";

  const rendered: ReactNode[] = blocks.map((block, index) => {
    if (block.type === "unordered") {
      return (
        <ul
          key={`unordered-${index}`}
          className={`list-disc space-y-1 pl-5 marker:text-slate-500 ${textClass}`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`}>
              {item.text}
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === "ordered") {
      return (
        <ol
          key={`ordered-${index}`}
          start={block.start}
          className={`list-decimal space-y-1 pl-5 marker:font-semibold marker:text-slate-500 ${textClass}`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`}>
              {item.text}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p
        key={`paragraph-${index}`}
        className={`whitespace-pre-wrap ${textClass}`}
      >
        {block.lines.join("\n")}
      </p>
    );
  });

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      {rendered}
    </div>
  );
}

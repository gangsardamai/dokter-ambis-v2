"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

interface AnnouncementContentInputProps {
  defaultValue?: string;
}

const bulletPattern = /^(\s*)[-*•–—]\s+(.*)$/;
const numberedPattern = /^(\s*)(\d+)[.)]\s+(.*)$/;

export default function AnnouncementContentInput({
  defaultValue = "",
}: AnnouncementContentInputProps) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function setValueAndSelection(
    nextValue: string,
    selectionStart: number,
    selectionEnd = selectionStart,
  ) {
    setValue(nextValue);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        selectionStart,
        selectionEnd,
      );
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    const textarea = event.currentTarget;
    const cursor = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
    const lineEndIndex = value.indexOf("\n", cursor);
    const lineEnd =
      lineEndIndex === -1 ? value.length : lineEndIndex;
    const currentLine = value.slice(lineStart, lineEnd);

    const bulletMatch = currentLine.match(bulletPattern);
    const numberedMatch = currentLine.match(numberedPattern);

    if (!bulletMatch && !numberedMatch) {
      return;
    }

    event.preventDefault();

    const match = bulletMatch ?? numberedMatch;
    if (!match) return;

    const indent = match[1] ?? "";
    const itemText = bulletMatch
      ? bulletMatch[2]
      : numberedMatch?.[3] ?? "";

    if (!itemText.trim()) {
      const before = value.slice(0, lineStart);
      const after = value.slice(lineEnd);
      const nextValue = before + after;
      setValueAndSelection(nextValue, lineStart);
      return;
    }

    const nextMarker = bulletMatch
      ? `${indent}- `
      : `${indent}${Number(numberedMatch?.[2] ?? 0) + 1}. `;

    const insertion = `\n${nextMarker}`;
    const nextValue =
      value.slice(0, cursor) +
      insertion +
      value.slice(cursor);

    setValueAndSelection(
      nextValue,
      cursor + insertion.length,
    );
  }

  function applyList(type: "bullet" | "numbered") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const firstLineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextLineBreak = value.indexOf("\n", end);
    const lastLineEnd =
      nextLineBreak === -1 ? value.length : nextLineBreak;

    const selectedBlock = value.slice(firstLineStart, lastLineEnd);
    let number = 1;

    const formatted = selectedBlock
      .split("\n")
      .map((line) => {
        if (!line.trim()) return line;

        const cleaned = line
          .replace(/^(\s*)[-*•–—]\s+/, "$1")
          .replace(/^(\s*)\d+[.)]\s+/, "$1");

        const indent = cleaned.match(/^\s*/)?.[0] ?? "";
        const text = cleaned.slice(indent.length);

        if (type === "bullet") {
          return `${indent}- ${text}`;
        }

        const formattedLine = `${indent}${number}. ${text}`;
        number += 1;
        return formattedLine;
      })
      .join("\n");

    const nextValue =
      value.slice(0, firstLineStart) +
      formatted +
      value.slice(lastLineEnd);

    setValueAndSelection(
      nextValue,
      firstLineStart,
      firstLineStart + formatted.length,
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="content"
        className="font-medium"
      >
        Isi Pengumuman
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyList("bullet")}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1769cf]"
        >
          <span className="text-base leading-none">•</span>
          Bullet
        </button>
        <button
          type="button"
          onClick={() => applyList("numbered")}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1769cf]"
        >
          <span className="font-black">1.</span>
          Numbering
        </button>
        <span className="text-xs text-slate-400">
          Enter otomatis melanjutkan bullet/nomor berikutnya.
        </span>
      </div>

      <textarea
        ref={textareaRef}
        id="content"
        name="content"
        rows={7}
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"Contoh:\n- Maksimal 2 device\n- 1 browser dihitung 1 device\n\n1. Login ke akun\n2. Gunakan device yang terdaftar"}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />

      <p className="text-xs leading-5 text-slate-400">
        Baris yang diawali “-” akan tampil sebagai bullet. Baris “1.”, “2.”, dan seterusnya akan tampil sebagai numbering di dashboard peserta.
      </p>
    </div>
  );
}

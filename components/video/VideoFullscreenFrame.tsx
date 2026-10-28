"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export default function VideoFullscreenFrame({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  const frameRef = useRef<FullscreenElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasFullscreen = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const isOpen = isFullscreen || isExpanded;

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsExpanded(false);
        buttonRef.current?.focus();
      }
    }
    function keepFocusInside(event: FocusEvent) {
      if (event.target instanceof Node && !frameRef.current?.contains(event.target)) {
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", keepFocusInside);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", keepFocusInside);
    };
  }, [isExpanded]);

  useEffect(() => {
    function syncFullscreen() {
      const doc = document as FullscreenDocument;
      const active = (doc.fullscreenElement ?? doc.webkitFullscreenElement) === frameRef.current;
      setIsFullscreen(active);
      setIsPending(false);
      if (wasFullscreen.current && !active) buttonRef.current?.focus();
      wasFullscreen.current = active;
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  async function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame || isPending) return;
    if (isExpanded) {
      setIsExpanded(false);
      buttonRef.current?.focus();
      return;
    }
    const doc = document as FullscreenDocument;
    setIsPending(true);
    try {
      if ((doc.fullscreenElement ?? doc.webkitFullscreenElement) === frame) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        else throw new Error("Fullscreen tidak tersedia.");
      } else {
        if (frame.requestFullscreen) await frame.requestFullscreen();
        else if (frame.webkitRequestFullscreen) await frame.webkitRequestFullscreen();
        else throw new Error("Fullscreen tidak tersedia.");
      }
    } catch {
      setIsExpanded(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      ref={frameRef}
      role={isExpanded ? "dialog" : undefined}
      aria-modal={isExpanded ? true : undefined}
      aria-label={isExpanded ? "Video layar penuh" : undefined}
      className={`flex w-full flex-col overflow-hidden border border-slate-700 bg-black ${isExpanded ? "fixed inset-0 z-[1000] h-dvh" : isFullscreen ? "h-dvh" : "rounded-xl"}`}
    >
      <div className={`relative w-full ${isOpen ? "min-h-0 flex-1" : "aspect-video"}`}>
        {children}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 bg-slate-950 px-3 py-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleFullscreen}
          disabled={isPending}
          aria-busy={isPending}
          aria-pressed={isOpen}
          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-xs font-bold sm:px-3 sm:text-sm text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-wait disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${isPending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isPending ? <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" /> : isOpen ? <path d="M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5" /> : <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" />}
          </svg>
          {isPending ? "Memproses..." : isOpen ? "Keluar fullscreen" : "Fullscreen"}
        </button>
        {actions}
      </div>
    </div>
  );
}

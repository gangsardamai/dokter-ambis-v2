"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export default function VideoFullscreenFrame({ children }: { children: ReactNode }) {
  const frameRef = useRef<FullscreenElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasFullscreen = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

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
    const doc = document as FullscreenDocument;
    setIsPending(true);
    setError("");
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
      setError("Fullscreen tidak tersedia di browser ini. Coba tombol layar penuh di dalam video.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      ref={frameRef}
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-black ${isFullscreen ? "h-dvh rounded-none" : ""}`}
    >
      <div className={`relative w-full ${isFullscreen ? "min-h-0 flex-1" : "aspect-video"}`}>
        {children}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 bg-slate-950 px-3 py-2">
        {error && <p role="status" className="mr-auto text-xs text-amber-200">{error}</p>}
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleFullscreen}
          disabled={isPending}
          aria-busy={isPending}
          aria-pressed={isFullscreen}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-wait disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isPending ? <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" /> : isFullscreen ? <path d="M8 3v5H3m18 0h-5V3M3 16h5v5m8 0v-5h5" /> : <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" />}
          </svg>
          {isPending ? "Memproses..." : isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}

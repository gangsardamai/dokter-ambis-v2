"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface PdfViewport {
  width: number;
  height: number;
}

interface PdfRenderTask {
  promise: Promise<void>;
}

interface PdfPageProxy {
  getViewport(options: { scale: number }): PdfViewport;
  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }): PdfRenderTask;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
}

interface PdfLoadingTask {
  promise: Promise<PdfDocumentProxy>;
}

interface PdfJsLib {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(options: {
    data: ArrayBuffer | Uint8Array;
  }): PdfLoadingTask;
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

interface LockedPdfViewerProps {
  fileId: string;
  title: string;
  watermarkText: string;
}

const PDFJS_VERSION = "3.11.174";
const PDFJS_SCRIPT =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

let pdfJsLoader: Promise<PdfJsLib> | null = null;

function loadPdfJs(): Promise<PdfJsLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Viewer hanya tersedia di browser."));
  }

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfJsLoader) return pdfJsLoader;

  pdfJsLoader = new Promise<PdfJsLib>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-dokterambis-pdfjs="${PDFJS_VERSION}"]`,
    );

    const finish = () => {
      if (!window.pdfjsLib) {
        reject(new Error("Library PDF gagal dimuat."));
        return;
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Library PDF gagal dimuat.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_SCRIPT;
    script.async = true;
    script.dataset.dokterambisPdfjs = PDFJS_VERSION;
    script.onload = finish;
    script.onerror = () =>
      reject(new Error("Library PDF gagal dimuat."));
    document.head.appendChild(script);
  });

  return pdfJsLoader;
}

function drawPrintWatermark(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  context.save();
  context.globalAlpha = 0.1;
  context.fillStyle = "#334155";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 ${Math.max(16, Math.round(width / 46))}px Arial, sans-serif`;

  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 7);

  const stepX = Math.max(280, width * 0.58);
  const stepY = Math.max(170, height * 0.2);

  for (let y = -height; y <= height; y += stepY) {
    for (let x = -width; x <= width; x += stepX) {
      context.fillText(text, x, y);
    }
  }

  context.restore();
}

async function waitForImage(image: HTMLImageElement) {
  if (image.complete) return;

  await new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

export default function LockedPdfViewer({
  fileId,
  title,
  watermarkText,
}: LockedPdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [documentProxy, setDocumentProxy] =
    useState<PdfDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");

  const totalPages = documentProxy?.numPages ?? 0;

  const watermarkCopies = useMemo(
    () => Array.from({ length: 12 }, (_, index) => index),
    [],
  );

  useEffect(() => {
    function blockSaveShortcut(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
      }
    }

    window.addEventListener("keydown", blockSaveShortcut);
    return () =>
      window.removeEventListener("keydown", blockSaveShortcut);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setLoading(true);
      setError("");

      try {
        const [pdfjs, response] = await Promise.all([
          loadPdfJs(),
          fetch(`/api/locked-materials/${encodeURIComponent(fileId)}`, {
            cache: "no-store",
            credentials: "same-origin",
          }),
        ]);

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            payload?.error ?? "File Locked gagal dimuat.",
          );
        }

        const data = await response.arrayBuffer();
        const task = pdfjs.getDocument({ data });
        const pdf = await task.promise;

        if (!cancelled) {
          setDocumentProxy(pdf);
          setPageNumber(1);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "File Locked gagal dimuat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  useEffect(() => {
    if (!documentProxy) return;

    const pdf = documentProxy;
    let cancelled = false;

    async function renderCurrentPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setPageLoading(true);

      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const displayViewport = page.getViewport({ scale: zoom });
        const renderMultiplier = Math.min(
          Math.max(window.devicePixelRatio || 1, 1),
          2,
        );
        const renderViewport = page.getViewport({
          scale: zoom * renderMultiplier,
        });

        const context = canvas.getContext("2d", {
          alpha: false,
        });

        if (!context) {
          throw new Error("Canvas PDF tidak tersedia.");
        }

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(displayViewport.width)}px`;
        canvas.style.height = `${Math.floor(displayViewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: renderViewport,
        }).promise;
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Halaman PDF gagal dirender.",
          );
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    void renderCurrentPage();

    return () => {
      cancelled = true;
    };
  }, [documentProxy, pageNumber, zoom]);

  async function handlePrint() {
    if (!documentProxy || printing) return;

    setPrinting(true);
    setError("");

    try {
      const pageImages: string[] = [];

      for (
        let currentPage = 1;
        currentPage <= documentProxy.numPages;
        currentPage += 1
      ) {
        const page = await documentProxy.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
          alpha: false,
        });

        if (!context) {
          throw new Error("Canvas print tidak tersedia.");
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        drawPrintWatermark(
          context,
          canvas.width,
          canvas.height,
          watermarkText,
        );

        pageImages.push(canvas.toDataURL("image/jpeg", 0.94));
      }

      const printFrame = document.createElement("iframe");
      printFrame.setAttribute("aria-hidden", "true");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const printDocument = printFrame.contentDocument;

      if (!printDocument) {
        printFrame.remove();
        throw new Error("Halaman print tidak dapat dibuat.");
      }

      printDocument.open();
      printDocument.write(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>${title.replace(/[<>&"]/g, "")}</title>
    <style>
      @page { margin: 0; }
      html, body { margin: 0; padding: 0; background: white; }
      .page { break-after: page; page-break-after: always; width: 100%; }
      .page:last-child { break-after: auto; page-break-after: auto; }
      img { display: block; width: 100%; height: auto; }
    </style>
  </head>
  <body>
    ${pageImages
      .map(
        (src) =>
          `<div class="page"><img src="${src}" alt="" /></div>`,
      )
      .join("")}
  </body>
</html>`);
      printDocument.close();

      const images = Array.from(
        printDocument.querySelectorAll("img"),
      );
      await Promise.all(images.map(waitForImage));

      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();

      window.setTimeout(() => {
        printFrame.remove();
      }, 1500);
    } catch (printError) {
      setError(
        printError instanceof Error
          ? printError.message
          : "Print gagal diproses.",
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-100"
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            ← Kembali
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              {title}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              🔒 File Locked · Download dinonaktifkan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!documentProxy || pageNumber <= 1}
              onClick={() =>
                setPageNumber((value) => Math.max(1, value - 1))
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-40"
            >
              ←
            </button>

            <span className="min-w-24 text-center text-sm font-black text-slate-700">
              {totalPages ? `${pageNumber} / ${totalPages}` : "—"}
            </span>

            <button
              type="button"
              disabled={
                !documentProxy ||
                pageNumber >= documentProxy.numPages
              }
              onClick={() =>
                setPageNumber((value) =>
                  Math.min(totalPages, value + 1),
                )
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-40"
            >
              →
            </button>

            <button
              type="button"
              disabled={!documentProxy || zoom <= 0.8}
              onClick={() =>
                setZoom((value) =>
                  Math.max(0.8, Number((value - 0.15).toFixed(2))),
                )
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-40"
            >
              −
            </button>

            <span className="min-w-14 text-center text-xs font-black text-slate-500">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              disabled={!documentProxy || zoom >= 2}
              onClick={() =>
                setZoom((value) =>
                  Math.min(2, Number((value + 0.15).toFixed(2))),
                )
              }
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-40"
            >
              +
            </button>

            <button
              type="button"
              disabled={!documentProxy || printing}
              onClick={() => void handlePrint()}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {printing ? "Menyiapkan Print..." : "Print"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl justify-center p-3 sm:p-6">
        <div className="w-full">
          {error && (
            <div className="mx-auto mb-4 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="font-black text-slate-900">
                Memuat File Locked...
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Viewer dan PDF sedang disiapkan.
              </p>
            </div>
          ) : documentProxy ? (
            <div className="overflow-auto rounded-3xl border border-slate-200 bg-slate-200/60 p-3 shadow-inner sm:p-6">
              <div className="mx-auto w-max max-w-full">
                <div className="relative overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/15">
                  <canvas
                    ref={canvasRef}
                    className="block max-w-full select-none"
                    aria-label={`Halaman ${pageNumber} dari ${totalPages}`}
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-6 overflow-hidden select-none"
                  >
                    {watermarkCopies.map((copy) => (
                      <div
                        key={copy}
                        className="flex items-center justify-center px-3"
                      >
                        <span className="-rotate-[24deg] whitespace-nowrap text-[11px] font-semibold tracking-wide text-slate-700/10 sm:text-sm">
                          {watermarkText}
                        </span>
                      </div>
                    ))}
                  </div>

                  {pageLoading && (
                    <div className="absolute inset-0 grid place-items-center bg-white/65 backdrop-blur-[1px]">
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow">
                        Memuat halaman...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-5 text-slate-500">
            Watermark transparan ditampilkan pada viewer dan dibubuhkan langsung
            ke setiap halaman saat print. File Locked tidak menyediakan tombol
            download atau buka di tab baru.
          </p>
        </div>
      </main>
    </div>
  );
}

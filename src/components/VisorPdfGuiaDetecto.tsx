import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Download } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface VisorPdfGuiaDetectoProps {
  url: string;
}

export const VisorPdfGuiaDetecto: React.FC<VisorPdfGuiaDetectoProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [cargando, setCargando] = useState<boolean>(true);
  const [renderizando, setRenderizando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPdf = async () => {
      setCargando(true);
      setErrorMsg(null);
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`No se pudo cargar el documento (HTTP ${resp.status})`);
        }
        const arrayBuffer = await resp.arrayBuffer();
        loadedTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadedTask.promise;
        if (cancelled) {
          doc.cleanup();
          return;
        }
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(
            err?.message || "No fue posible cargar la Guía de Bolsillo DETECTO en este navegador."
          );
        }
      } finally {
        if (!cancelled) {
          setCargando(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (loadedTask) {
        loadedTask.destroy().catch(() => {});
      }
    };
  }, [url]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let cancelled = false;

    const renderPages = async () => {
      const container = containerRef.current;
      if (!container) return;
      setRenderizando(true);
      container.innerHTML = "";

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      try {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale });
          const wrapper = document.createElement("div");
          wrapper.className =
            "bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/60 mx-auto";
          wrapper.style.width = `${Math.floor(viewport.width)}px`;
          wrapper.style.maxWidth = "100%";

          const pageBadge = document.createElement("div");
          pageBadge.className =
            "bg-slate-800 text-sky-200 text-[10px] font-bold px-3 py-1 flex items-center justify-between";
          pageBadge.textContent = `Página ${pageNum} de ${pdfDoc.numPages}`;
          wrapper.appendChild(pageBadge);

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          wrapper.appendChild(canvas);

          container.appendChild(wrapper);

          if (ctx) {
            await page.render({
              canvasContext: ctx,
              canvas,
              viewport,
              transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
            }).promise;
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || "Error al renderizar las páginas del documento PDF.");
        }
      } finally {
        if (!cancelled) {
          setRenderizando(false);
        }
      }
    };

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, scale]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white shrink-0">
        <span className="font-bold text-sky-200">
          {numPages > 0 ? `${numPages} páginas · Guía de Bolsillo DETECTO v1` : "Cargando documento..."}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(2))))}
            className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
            title="Reducir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold px-2 text-amber-200">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(2))))}
            className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.25)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
            title="Restablecer zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5">
        {cargando && (
          <div className="flex flex-col items-center justify-center py-16 text-sky-200 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-sm font-bold">Cargando Guía de Bolsillo DETECTO v1...</span>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-md mx-auto bg-red-950/80 border border-red-500 text-red-100 rounded-2xl p-5 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-xs font-semibold">{errorMsg}</p>
            <a
              href={url}
              download="DETECTO_Guia_Bolsillo_v1.pdf"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </a>
          </div>
        )}

        {renderizando && !cargando && !errorMsg && (
          <div className="text-center text-[11px] font-bold text-amber-300 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Renderizando páginas en alta resolución...</span>
          </div>
        )}

        <div ref={containerRef} className="space-y-5" />
      </div>
    </div>
  );
};

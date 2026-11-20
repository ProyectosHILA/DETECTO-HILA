import React, { useState, useEffect, useRef } from "react";
import { PacienteRegistro, LaboratoriosDOMData } from "../types";
import { FormularioLaboratorios } from "./FormularioLaboratorios";
import {
  FlaskConical,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  Inbox,
  Timer,
  FileUp,
  FileCheck2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

interface AuditoriaExtraccion {
  fileName: string;
  pacienteDocumento: {
    nombreDetectado: string;
    identificacionDetectada: string;
    fechaReporte: string;
  };
  camposEncontrados: Array<{
    campo: string;
    valor: string;
    fechaHora: string;
    evidencia: string;
  }>;
  camposVacios: string[];
}

interface ModuloLaboratoriosProps {
  pacientesPendientes: PacienteRegistro[];
  onActualizarPaciente: (id: string, patch: Partial<PacienteRegistro>) => Promise<void>;
  onVolverAlInicio: () => void;
}

const LABELS_CATEGORIA: Record<1 | 2 | 3, string> = {
  1: "BAJA POSIBILIDAD DE SEPSIS",
  2: "ALERTA DE SEPSIS (SIN DOMᵃ)",
  3: "ALERTA CHOQUE SEPTICOᵇ O DOMᵃ",
};

export const ModuloLaboratorios: React.FC<ModuloLaboratoriosProps> = ({
  pacientesPendientes,
  onActualizarPaciente,
  onVolverAlInicio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number>(Date.now());
  const [guardando, setGuardando] = useState<boolean>(false);
  const [analizandoPdf, setAnalizandoPdf] = useState<boolean>(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [auditoriaPdf, setAuditoriaPdf] = useState<AuditoriaExtraccion | null>(null);
  const [conservarPrevios, setConservarPrevios] = useState<boolean>(false);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pacienteSeleccionado =
    pacientesPendientes.find((p) => p.id === selectedId) || null;

  const [labsData, setLabsData] = useState<LaboratoriosDOMData>(
    pacienteSeleccionado?.laboratorios || {}
  );

  // Dirty protection so real-time updates NEVER erase what lab tech is typing
  const prevPacIdRef = useRef<string | null>(null);
  const dirtyRef = useRef<boolean>(false);
  const lastSnapRef = useRef<string>("");

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pacienteSeleccionado) {
      prevPacIdRef.current = null;
      dirtyRef.current = false;
      lastSnapRef.current = "";
      setLabsData({});
      setAuditoriaPdf(null);
      setErrorPdf(null);
      return;
    }

    const snap = JSON.stringify(pacienteSeleccionado.laboratorios || {});
    if (prevPacIdRef.current !== pacienteSeleccionado.id) {
      prevPacIdRef.current = pacienteSeleccionado.id;
      dirtyRef.current = false;
      lastSnapRef.current = snap;
      setLabsData(pacienteSeleccionado.laboratorios || {});
      setAuditoriaPdf(null);
      setErrorPdf(null);
      return;
    }

    if (!dirtyRef.current && snap !== lastSnapRef.current) {
      lastSnapRef.current = snap;
      setLabsData(pacienteSeleccionado.laboratorios || {});
    }
  }, [pacienteSeleccionado]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const commaIdx = result.indexOf(",");
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
      reader.readAsDataURL(file);
    });

  const procesarDocumentoLaboratorio = async (file: File) => {
    if (analizandoPdf) return;
    setErrorPdf(null);

    const ext = file.name.toLowerCase();
    const mime =
      file.type ||
      (ext.endsWith(".pdf")
        ? "application/pdf"
        : ext.endsWith(".png")
        ? "image/png"
        : ext.endsWith(".webp")
        ? "image/webp"
        : ext.endsWith(".jpg") || ext.endsWith(".jpeg")
        ? "image/jpeg"
        : "");

    const allowed = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ]);

    if (!allowed.has(mime)) {
      setErrorPdf(
        "Formato inválido. Por favor adjunte un archivo PDF (.pdf) o imagen clínica (.png, .jpg, .webp)."
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorPdf("El archivo supera el límite máximo permitido de 15 MB.");
      return;
    }

    setAnalizandoPdf(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const response = await fetch("/api/laboratorios/interpretar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          mimeType: mime,
          fileName: file.name,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload?.error || "Error interpretando el documento de laboratorio."
        );
      }

      const extracted = (payload?.extracted || {}) as LaboratoriosDOMData;
      const auditoria = payload?.auditoria;

      // Por seguridad clínica: solo se llenan los campos realmente presentes en el documento;
      // los demás quedan estrictamente vacíos (salvo que el usuario marque conservar previos).
      const nextData: LaboratoriosDOMData = conservarPrevios ? { ...labsData } : {};

      const simpleKeys: Array<
        | "hemograma"
        | "tpInr"
        | "fibrinogeno"
        | "dimeroD"
        | "pcr"
        | "astAlt"
        | "bilirrubina"
        | "creatinina"
        | "electrolitos"
        | "monitoreoGastoUrinario"
        | "lactatoSerico"
        | "glucosa"
        | "aislamientosPrevios"
      > = [
        "hemograma",
        "tpInr",
        "fibrinogeno",
        "dimeroD",
        "pcr",
        "astAlt",
        "bilirrubina",
        "creatinina",
        "electrolitos",
        "monitoreoGastoUrinario",
        "lactatoSerico",
        "glucosa",
        "aislamientosPrevios",
      ];

      for (const k of simpleKeys) {
        const entry = extracted[k];
        if (entry?.checked && entry.valor?.trim()) {
          nextData[k] = {
            checked: true,
            fechaHora: entry.fechaHora || "",
            valor: entry.valor,
          };
        } else if (!conservarPrevios) {
          nextData[k] = { checked: false, fechaHora: "", valor: "" };
        }
      }

      if (
        extracted.gasesPaFiO2?.checked &&
        (extracted.gasesPaFiO2.pao2 ||
          extracted.gasesPaFiO2.fio2 ||
          extracted.gasesPaFiO2.resultado)
      ) {
        nextData.gasesPaFiO2 = { ...extracted.gasesPaFiO2 };
      } else if (!conservarPrevios) {
        nextData.gasesPaFiO2 = {
          checked: false,
          fechaHora: "",
          pao2: "",
          fio2: "",
          resultado: "",
        };
      }

      if (
        extracted.spFiO2?.checked &&
        (extracted.spFiO2.spo2 ||
          extracted.spFiO2.fio2 ||
          extracted.spFiO2.resultado)
      ) {
        nextData.spFiO2 = { ...extracted.spFiO2 };
      } else if (!conservarPrevios) {
        nextData.spFiO2 = {
          checked: false,
          fechaHora: "",
          spo2: "",
          fio2: "",
          resultado: "",
        };
      }

      if (extracted.hemocultivosA3?.tomado && extracted.hemocultivosA3.detalle?.trim()) {
        nextData.hemocultivosA3 = { ...extracted.hemocultivosA3 };
      } else if (!conservarPrevios) {
        nextData.hemocultivosA3 = {
          tomado: false,
          fechaHora: "",
          detalle: "",
        };
      }

      dirtyRef.current = true;
      setLabsData(nextData);
      setAuditoriaPdf({
        fileName: file.name,
        pacienteDocumento: auditoria?.pacienteDocumento || {
          nombreDetectado: "",
          identificacionDetectada: "",
          fechaReporte: "",
        },
        camposEncontrados: auditoria?.camposEncontrados || [],
        camposVacios: auditoria?.camposVacios || [],
      });
    } catch (err: any) {
      setErrorPdf(
        err?.message ||
          "No se pudo interpretar el archivo. Verifique que sea legible e inténtelo nuevamente."
      );
    } finally {
      setAnalizandoPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(Math.max(0, totalSeg) / 60);
    const segs = Math.max(0, totalSeg) % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const handleGuardarResultados = async () => {
    if (!pacienteSeleccionado || guardando) return;
    setGuardando(true);
    try {
      const ahoraTs = Date.now();
      const refTs =
        pacienteSeleccionado.tiemposSubmodulos?.timestampValidacionTriage ||
        pacienteSeleccionado.timestampPasoFase2 ||
        pacienteSeleccionado.timestampInicio ||
        ahoraTs;

      dirtyRef.current = false;
      lastSnapRef.current = JSON.stringify(labsData || {});

      await onActualizarPaciente(pacienteSeleccionado.id, {
        laboratorios: labsData,
        estadosModulos: {
          fase1Validada: pacienteSeleccionado.estadosModulos?.fase1Validada ?? true,
          checklist1Completado: pacienteSeleccionado.estadosModulos?.checklist1Completado ?? false,
          laboratoriosCompletado: true,
          anexoCompletado: pacienteSeleccionado.estadosModulos?.anexoCompletado ?? false,
        },
        tiemposSubmodulos: {
          ...(pacienteSeleccionado.tiemposSubmodulos || {}),
          timestampLaboratorios: ahoraTs,
          laboratoriosSegundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
          laboratoriosCompletadoPor: "laboratorios",
        },
      });

      setSelectedId(null);
    } finally {
      setGuardando(false);
    }
  };

  if (pacienteSeleccionado) {
    const catValidada: 1 | 2 | 3 =
      pacienteSeleccionado.categoriaTriageValidada ||
      pacienteSeleccionado.categoriaTriage ||
      1;
    const labelCat =
      pacienteSeleccionado.categoriaTriageValidadaLabel ||
      pacienteSeleccionado.categoriaTriageLabel ||
      LABELS_CATEGORIA[catValidada];

    const segsDesdeReporte = Math.max(
      0,
      Math.floor((ahora - (pacienteSeleccionado.timestampInicio || ahora)) / 1000)
    );
    const metaSegs = catValidada === 3 ? 2700 : 3600;
    const segsRestantes = Math.max(0, metaSegs - segsDesdeReporte);
    const minsRestantes = Math.floor(segsRestantes / 60);
    const segsModulo = segsRestantes % 60;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a solicitudes de Laboratorio</span>
          </button>

          <span className="text-xs font-black uppercase bg-teal-100 text-teal-950 border border-teal-400 px-3 py-1 rounded-full">
            Módulo de Laboratorios · Resultados de Laboratorio
          </span>
        </div>

        {/* Header del Paciente + Cronómetro */}
        <div className="bg-[#0b4d6c] border border-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-950/60 text-teal-200 px-2.5 py-0.5 rounded-lg border border-teal-500/50">
                  {pacienteSeleccionado.codigo}
                </span>
                {catValidada === 3 && (
                  <span className="text-xs font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded-lg">
                    {labelCat}
                  </span>
                )}
                {catValidada === 2 && (
                  <span className="text-xs font-black bg-[#f4b400] text-black px-2.5 py-0.5 rounded-lg">
                    {labelCat}
                  </span>
                )}
                {catValidada === 1 && (
                  <span className="text-xs font-black bg-[#7ecc61] text-black px-2.5 py-0.5 rounded-lg">
                    {labelCat}
                  </span>
                )}
              </div>

              <div>
                {pacienteSeleccionado.nombre && (
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {pacienteSeleccionado.nombre}
                  </h2>
                )}
                <p className="text-sm font-mono font-bold text-teal-200">
                  Cédula / ID: {pacienteSeleccionado.identificacionPaciente || pacienteSeleccionado.codigo}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/90 border-2 border-teal-400/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[300px] shadow-lg">
              <div className="text-center sm:border-r sm:border-slate-800 sm:pr-3">
                <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  Tiempo desde que se reportó
                </span>
                <div className="text-3xl font-mono font-black text-teal-300 tracking-widest mt-1 tabular-nums">
                  {formatearTiempo(segsDesdeReporte)}
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  {catValidada === 3 ? "Meta 45 Min" : "Meta 1 Hora"}
                </span>
                <div
                  className={`text-3xl font-mono font-black tracking-widest mt-1 tabular-nums ${
                    segsRestantes <= 600 ? "text-red-400 animate-pulse" : "text-amber-300"
                  }`}
                >
                  {formatearTiempo(segsRestantes)}
                </div>
                <span className="text-[11px] font-black block mt-1 text-sky-200">
                  {segsRestantes === 0
                    ? "Le queda 00 min 00 seg"
                    : `Le queda ${minsRestantes} min ${segsModulo.toString().padStart(2, "0")} seg`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARGA INTELIGENTE DE PDF / DOCUMENTO DE LABORATORIOS */}
        <div className="bg-white border-2 border-teal-500 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow shrink-0">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Subir PDF o Documento de Resultados de Laboratorio
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  La herramienta leerá el documento adjunto y diligenciará automáticamente <strong>solo los valores reales encontrados</strong>; los campos que no estén en el archivo permanecerán vacíos.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={conservarPrevios}
                onChange={(e) => setConservarPrevios(e.target.checked)}
                className="accent-teal-700"
              />
              <span>Conservar campos previos al subir otro PDF</span>
            </label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) procesarDocumentoLaboratorio(file);
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrandoArchivo(true);
            }}
            onDragLeave={() => setArrastrandoArchivo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrandoArchivo(false);
              const file = e.dataTransfer.files?.[0];
              if (file) procesarDocumentoLaboratorio(file);
            }}
            onClick={() => !analizandoPdf && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
              arrastrandoArchivo
                ? "border-teal-600 bg-teal-50 scale-[1.01]"
                : analizandoPdf
                ? "border-amber-400 bg-amber-50/70 cursor-wait"
                : "border-teal-300 bg-[#f4fbfc] hover:border-teal-600 hover:bg-teal-50/60"
            }`}
          >
            {analizandoPdf ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
                <p className="text-sm font-black text-teal-950">
                  Interpretando documento de laboratorio con alta precisión clínica...
                </p>
                <p className="text-xs text-slate-600">
                  Extrayendo únicamente resultados verificables del anexo adjunto.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
                <div className="p-3 bg-white border border-teal-200 rounded-2xl text-teal-700 shadow-sm">
                  <FileUp className="w-7 h-7" />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <p className="text-sm font-black text-slate-900">
                    Haga clic aquí o arrastre el PDF / imagen del laboratorio
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Formatos soportados: <strong>PDF</strong>, PNG, JPG, WEBP (máx. 15 MB) · Extracción estricta sin datos inventados.
                  </p>
                </div>
                <span className="bg-[#0b4d6c] hover:bg-teal-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm shrink-0">
                  Seleccionar Archivo
                </span>
              </div>
            )}
          </div>

          {errorPdf && (
            <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorPdf}</span>
            </div>
          )}

          {auditoriaPdf && (
            <div className="bg-emerald-50/70 border-2 border-emerald-400 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                      Documento interpretado: {auditoriaPdf.fileName}
                    </h4>
                    <span className="text-[11px] text-emerald-800 font-semibold block">
                      {auditoriaPdf.camposEncontrados.length} campo(s) diligenciado(s) desde el anexo · {auditoriaPdf.camposVacios.length} campo(s) dejado(s) vacío(s)
                    </span>
                  </div>
                </div>

                {(auditoriaPdf.pacienteDocumento.nombreDetectado ||
                  auditoriaPdf.pacienteDocumento.identificacionDetectada) && (
                  <div className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800">
                    <span className="text-emerald-800 uppercase font-black mr-1">
                      Paciente en PDF:
                    </span>
                    {auditoriaPdf.pacienteDocumento.nombreDetectado || "Sin nombre"}{" "}
                    {auditoriaPdf.pacienteDocumento.identificacionDetectada
                      ? `· ID: ${auditoriaPdf.pacienteDocumento.identificacionDetectada}`
                      : ""}
                  </div>
                )}
              </div>

              {auditoriaPdf.camposEncontrados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {auditoriaPdf.camposEncontrados.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-emerald-200 rounded-xl p-2.5 text-xs space-y-0.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-emerald-900">{item.campo}</span>
                        {item.fechaHora && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {item.fechaHora}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900">{item.valor}</p>
                      {item.evidencia && (
                        <p className="text-[10px] text-slate-500 italic truncate">
                          Fuente PDF: "{item.evidencia}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl p-3">
                  No se encontraron parámetros compatibles con la tabla DOM en este documento. Todos los campos se mantuvieron vacíos.
                </p>
              )}

              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-900 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Verifique visualmente los valores extraídos en el formulario inferior antes de presionar <strong>Guardar Resultados de Laboratorio</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Exact Same Resultados de Laboratorio Component as Fase 2 */}
        <FormularioLaboratorios
          data={labsData}
          categoriaValidada={catValidada}
          onChange={(updated) => {
            dirtyRef.current = true;
            setLabsData(updated);
          }}
        />

        {/* Botón Guardar y Sincronizar con Fase 2 */}
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-700 font-semibold max-w-xl">
            <strong className="text-emerald-800 block text-sm">
              Sincronización Automática con Fase 2 (Equipo de Sepsis):
            </strong>
            Al guardar, estos resultados se enviarán inmediatamente a Fase 2 y Fase 3 marcando el módulo en <strong>verde (✓ Guardado)</strong> y esta solicitud desaparecerá de la bandeja pendiente.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardarResultados}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>
                {guardando
                  ? "Guardando..."
                  : "Guardar Resultados de Laboratorio (Enviar a Fase 2)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlInicio}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Salir al inicio
        </button>

        <span className="text-xs font-black uppercase bg-teal-100 text-teal-950 px-3 py-1.5 rounded-xl border border-teal-400">
          Módulo de Laboratorios
        </span>
      </div>

      {/* Main Banner */}
      <div className="bg-[#0b4d6c] border-2 border-teal-500/60 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-teal-500 text-slate-950 rounded-2xl shadow-lg">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Laboratorios · Paraclínicos y Cultivos
            </h2>
            <p className="text-xs text-teal-100 mt-1 max-w-xl">
              Bandeja en tiempo real. Cuando el Médico de Urgencias (Fase 2) valida y habilita los módulos del caso, la orden cae automáticamente aquí para diligenciar <strong>Resultados de Laboratorio</strong>.
            </p>
          </div>
        </div>

        {pacientesPendientes.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pacientesPendientes.length} Orden(es) Pendiente(s)</span>
          </div>
        )}
      </div>

      {/* Pending Lab Orders List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <span>Solicitudes Pendientes por Diligenciar</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pacientesPendientes.length} pendiente(s)
          </span>
        </div>

        {pacientesPendientes.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
              {pacientesPendientes.length === 0 ? (
                <Inbox className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                No hay solicitudes de laboratorio pendientes en este momento.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando en Fase 2 se valide la clasificación de un paciente y se habiliten los 4 módulos, la solicitud aparecerá aquí automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesPendientes.map((p) => {
              const cat = p.categoriaTriageValidada || p.categoriaTriage || 1;
              const refTs =
                p.tiemposSubmodulos?.timestampValidacionTriage ||
                p.timestampPasoFase2 ||
                p.timestampInicio;
              const segsEspera = Math.max(0, Math.floor((ahora - refTs) / 1000));

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group p-5 rounded-2xl border-2 border-rose-300 hover:border-teal-600 bg-rose-50/50 hover:bg-teal-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full tabular-nums">
                        <Clock className="w-3 h-3" />
                        Esperando Lab: {formatearTiempo(segsEspera)}
                      </span>
                      {cat === 3 && (
                        <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded border border-[#e65c5c]">
                          Cat 3: CHOQUE / DOMᵃ
                        </span>
                      )}
                      {cat === 2 && (
                        <span className="text-[10px] font-black bg-[#f4b400] text-black px-2 py-0.5 rounded border border-[#d99b00]">
                          Cat 2: ALERTA SEPSIS
                        </span>
                      )}
                      {cat === 1 && (
                        <span className="text-[10px] font-black bg-[#7ecc61] text-black px-2 py-0.5 rounded border border-[#5ba83e]">
                          Cat 1: BAJA POSIBILIDAD
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {p.nombre ? `${p.nombre} · ` : ""}
                      <span className="font-mono text-teal-900">
                        ID: {p.identificacionPaciente || "Sin identificación"}
                      </span>
                    </h4>

                    <p className="text-xs text-slate-600">
                      <strong>Estado en Fase 2:</strong> Validado y habilitado para Resultados de Laboratorio
                    </p>
                  </div>

                  <button
                    type="button"
                    className="bg-[#0b4d6c] hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 group-hover:scale-105 cursor-pointer"
                  >
                    <span>Diligenciar Laboratorios</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

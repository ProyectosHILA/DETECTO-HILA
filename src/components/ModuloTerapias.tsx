import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PacienteRegistro, LaboratoriosDOMData, FotoGasClinico } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import {
  calcPaFiO2,
  calcSpFiO2,
  evaluarPlaquetasHemograma,
} from "../utils/clinicaGases";
import {
  Wind,
  Calculator,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  Inbox,
  Timer,
  Camera,
  Upload,
  Loader2,
  Lock,
  FlaskConical,
  X,
  Trash2,
  FileCheck2,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ModuloTerapiasProps {
  pacientesActivosCat3: PacienteRegistro[];
  onActualizarPaciente: (id: string, patch: Partial<PacienteRegistro>) => Promise<void>;
  onVolverAlInicio: () => void;
}

export const ModuloTerapias: React.FC<ModuloTerapiasProps> = ({
  pacientesActivosCat3,
  onActualizarPaciente,
  onVolverAlInicio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number>(Date.now());
  const [guardando, setGuardando] = useState<boolean>(false);

  const pacienteSeleccionado =
    pacientesActivosCat3.find((p) => p.id === selectedId) || null;

  const [lactatoSerico, setLactatoSerico] = useState<
    NonNullable<LaboratoriosDOMData["lactatoSerico"]>
  >(pacienteSeleccionado?.laboratorios?.lactatoSerico || {});
  const [gasesPaFiO2, setGasesPaFiO2] = useState<
    NonNullable<LaboratoriosDOMData["gasesPaFiO2"]>
  >(pacienteSeleccionado?.laboratorios?.gasesPaFiO2 || {});
  const [spFiO2, setSpFiO2] = useState<NonNullable<LaboratoriosDOMData["spFiO2"]>>(
    pacienteSeleccionado?.laboratorios?.spFiO2 || {}
  );
  const [fotosGases, setFotosGases] = useState<FotoGasClinico[]>(
    pacienteSeleccionado?.laboratorios?.fotosGases || []
  );

  // Estado de carga IA / Cámara / Fotos
  const [procesandoTipo, setProcesandoTipo] = useState<"venosa" | "arterial" | null>(
    null
  );
  const [errorGases, setErrorGases] = useState<string | null>(null);
  const [infoExtraccion, setInfoExtraccion] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoGasClinico | null>(null);

  // Cámara en vivo (desktop/móvil) + inputs ocultos
  const [camaraTipo, setCamaraTipo] = useState<"venosa" | "arterial" | null>(null);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileVenosaRef = useRef<HTMLInputElement | null>(null);
  const camVenosaFallbackRef = useRef<HTMLInputElement | null>(null);
  const fileArterialRef = useRef<HTMLInputElement | null>(null);
  const camArterialFallbackRef = useRef<HTMLInputElement | null>(null);

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
      setLactatoSerico({});
      setGasesPaFiO2({});
      setSpFiO2({});
      setFotosGases([]);
      setErrorGases(null);
      setInfoExtraccion(null);
      return;
    }

    const currObj = {
      lactatoSerico: pacienteSeleccionado.laboratorios?.lactatoSerico || {},
      gasesPaFiO2: pacienteSeleccionado.laboratorios?.gasesPaFiO2 || {},
      spFiO2: pacienteSeleccionado.laboratorios?.spFiO2 || {},
      fotosGases: pacienteSeleccionado.laboratorios?.fotosGases || [],
    };
    const snap = JSON.stringify(currObj);

    if (prevPacIdRef.current !== pacienteSeleccionado.id) {
      prevPacIdRef.current = pacienteSeleccionado.id;
      dirtyRef.current = false;
      lastSnapRef.current = snap;
      const spInit = { ...currObj.spFiO2 };
      if (!spInit.spo2 && pacienteSeleccionado.vitalesIngreso?.satO2) {
        spInit.spo2 = pacienteSeleccionado.vitalesIngreso.satO2;
      }
      setLactatoSerico(currObj.lactatoSerico);
      setGasesPaFiO2(currObj.gasesPaFiO2);
      setSpFiO2(spInit);
      setFotosGases(currObj.fotosGases);
      setErrorGases(null);
      setInfoExtraccion(null);
      return;
    }

    if (!dirtyRef.current && snap !== lastSnapRef.current) {
      lastSnapRef.current = snap;
      setLactatoSerico(currObj.lactatoSerico);
      setGasesPaFiO2(currObj.gasesPaFiO2);
      setSpFiO2(currObj.spFiO2);
      setFotosGases(currObj.fotosGases);
    }
  }, [pacienteSeleccionado]);

  // Limpiar cámara si se cierra modal o desmonta
  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamaraTipo(null);
    setErrorCamara(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const abrirCamara = async (tipo: "venosa" | "arterial") => {
    setErrorGases(null);
    setErrorCamara(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (tipo === "venosa") camVenosaFallbackRef.current?.click();
      else camArterialFallbackRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCamaraTipo(tipo);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      // Fallback al selector nativo de cámara/archivo si el navegador no permite webcam en vivo
      if (tipo === "venosa") camVenosaFallbackRef.current?.click();
      else camArterialFallbackRef.current?.click();
    }
  };

  const capturarFotoCamara = async () => {
    if (!videoRef.current || !camaraTipo) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const tipo = camaraTipo;
    detenerCamara();

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `camara_${tipo}_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        await procesarArchivoGases(file, tipo);
      },
      "image/jpeg",
      0.88
    );
  };

  const comprimirImagenBase64 = (
    file: File
  ): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("No se pudo inicializar el lienzo de imagen."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          URL.revokeObjectURL(url);
          const idx = dataUrl.indexOf(",");
          resolve({
            base64: idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl,
            mime: "image/jpeg",
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo cargar la imagen seleccionada."));
      };
      img.src = url;
    });

  const procesarArchivoGases = async (
    file: File,
    tipoMuestra: "venosa" | "arterial"
  ) => {
    if (!pacienteSeleccionado || procesandoTipo) return;
    setErrorGases(null);
    setInfoExtraccion(null);

    const lower = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
    const isImage =
      file.type.startsWith("image/") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp");

    if (!isPdf && !isImage) {
      setErrorGases(
        "Formato inválido. Adjunte una foto (JPG, PNG, WEBP) o un archivo PDF de la tirilla."
      );
      return;
    }

    setProcesandoTipo(tipoMuestra);
    try {
      let imageForServerBase64 = "";
      let mimeForServer = "image/jpeg";
      let extractedText = "";

      if (isPdf) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(1);
        const tc = await page.getTextContent();
        extractedText = tc.items
          .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          imageForServerBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        }
        pdf.cleanup();
      } else {
        const comp = await comprimirImagenBase64(file);
        imageForServerBase64 = comp.base64;
        mimeForServer = comp.mime;
      }

      if (!imageForServerBase64) {
        throw new Error("No se pudo procesar la imagen del documento.");
      }

      // 1. Guardar foto en el servidor para historial ("ojito")
      const saveResp = await fetch("/api/terapias/guardar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.id,
          tipo: tipoMuestra,
          imageBase64: imageForServerBase64,
          mimeType: mimeForServer,
          fileName: file.name,
        }),
      });
      const savePayload = await saveResp.json();
      if (!saveResp.ok || !savePayload?.url) {
        throw new Error(
          savePayload?.error || "No se pudo guardar la foto en el servidor."
        );
      }

      // 2. Interpretar tirilla con IA (Venosa -> cLac | Arterial -> pO2, sO2, FO2(I) -> PaFiO2 y SpFiO2)
      const aiResp = await fetch("/api/terapias/interpretar-gases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: imageForServerBase64,
          mimeType: mimeForServer,
          extractedText: extractedText || undefined,
          fileName: file.name,
          tipoMuestraEsperado: tipoMuestra,
        }),
      });
      const aiPayload = await aiResp.json();
      if (!aiResp.ok || !aiPayload) {
        throw new Error(
          aiPayload?.error || "No se pudo interpretar la tirilla de gases."
        );
      }

      let nextLactato = { ...lactatoSerico };
      let nextGases = { ...gasesPaFiO2 };
      let nextSpFi = { ...spFiO2 };
      let resumenFoto = "";

      if (tipoMuestra === "venosa") {
        const cLacVal = aiPayload.cLac ? `${aiPayload.cLac} mmol/L` : "";
        const fhVal = aiPayload.fechaCompleta || aiPayload.fechaHora || "";
        if (cLacVal) {
          nextLactato = {
            checked: true,
            fechaHora: fhVal,
            valor: cLacVal,
          };
          setLactatoSerico(nextLactato);
        }
        resumenFoto = cLacVal
          ? `Venosa · cLac: ${cLacVal}`
          : aiPayload.evidencia || "Muestra venosa cargada";
        setInfoExtraccion(
          cLacVal
            ? `Muestra Venosa interpretada: Lactato sérico (cLac) = ${cLacVal}${
                fhVal ? ` (${fhVal})` : ""
              }.`
            : "Foto venosa guardada en el servidor. No se detectó cLac legible; puede digitarlo manualmente."
        );
      } else {
        const pO2Val = aiPayload.pO2 || "";
        const sO2Val = aiPayload.sO2 || "";
        const fio2Val = aiPayload.fio2 || "";
        const horaVal = aiPayload.fechaHora || "";
        const pafiVal =
          aiPayload.pafiCalculado ||
          (pO2Val && fio2Val ? calcPaFiO2(pO2Val, fio2Val) : "") ||
          aiPayload.pao2Fio2Equipo ||
          "";
        const safiVal =
          aiPayload.safiCalculado ||
          (sO2Val && fio2Val ? calcSpFiO2(sO2Val, fio2Val) : "");

        if (pO2Val || fio2Val || pafiVal) {
          nextGases = {
            checked: true,
            fechaHora: horaVal,
            pao2: pO2Val,
            fio2: fio2Val,
            resultado: pafiVal,
          };
          setGasesPaFiO2(nextGases);
        }
        if (sO2Val || fio2Val || safiVal) {
          nextSpFi = {
            checked: true,
            fechaHora: horaVal,
            spo2: sO2Val,
            fio2: fio2Val,
            resultado: safiVal,
          };
          setSpFiO2(nextSpFi);
        }
        resumenFoto = `Arterial · PaFiO₂: ${pafiVal || "—"} | SpFiO₂: ${
          safiVal || "—"
        }`;
        setInfoExtraccion(
          `Gases Arteriales interpretados: PaO₂=${pO2Val || "—"}, sO₂=${
            sO2Val || "—"
          }%, FiO₂=${fio2Val || "—"} → PaFiO₂=${pafiVal || "—"} | SpFiO₂ (SaFiO₂)=${
            safiVal || "—"
          }.`
        );
      }

      const nuevaFoto: FotoGasClinico = {
        id: `gas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tipo: tipoMuestra,
        url: savePayload.url,
        nombreArchivo: file.name,
        fechaHora: aiPayload.fechaCompleta || aiPayload.fechaHora || "",
        fechaCaptura: Date.now(),
        resumen: resumenFoto,
      };
      const nextFotos = [...fotosGases, nuevaFoto];
      setFotosGases(nextFotos);
      dirtyRef.current = true;

      // Persistir inmediatamente la foto y valores extraídos para que quede en el historial ("ojito")
      await onActualizarPaciente(pacienteSeleccionado.id, {
        laboratorios: {
          ...(pacienteSeleccionado.laboratorios || {}),
          lactatoSerico: nextLactato,
          gasesPaFiO2: nextGases,
          spFiO2: nextSpFi,
          fotosGases: nextFotos,
        },
      });
      lastSnapRef.current = JSON.stringify({
        lactatoSerico: nextLactato,
        gasesPaFiO2: nextGases,
        spFiO2: nextSpFi,
        fotosGases: nextFotos,
      });
      dirtyRef.current = false;
    } catch (err: any) {
      setErrorGases(
        err?.message || "No se pudo procesar o guardar la foto de la muestra."
      );
    } finally {
      setProcesandoTipo(null);
      if (fileVenosaRef.current) fileVenosaRef.current.value = "";
      if (camVenosaFallbackRef.current) camVenosaFallbackRef.current.value = "";
      if (fileArterialRef.current) fileArterialRef.current.value = "";
      if (camArterialFallbackRef.current) camArterialFallbackRef.current.value = "";
    }
  };

  const eliminarFoto = async (fotoId: string) => {
    if (!pacienteSeleccionado) return;
    const nextFotos = fotosGases.filter((f) => f.id !== fotoId);
    setFotosGases(nextFotos);
    await onActualizarPaciente(pacienteSeleccionado.id, {
      laboratorios: {
        ...(pacienteSeleccionado.laboratorios || {}),
        lactatoSerico,
        gasesPaFiO2,
        spFiO2,
        fotosGases: nextFotos,
      },
    });
  };

  const updateLactato = (
    field: "checked" | "fechaHora" | "valor",
    val: any
  ) => {
    dirtyRef.current = true;
    setLactatoSerico((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "valor" && String(val || "").trim()) {
        next.checked = true;
      }
      return next;
    });
  };

  const updateGases = (
    field: "checked" | "pao2" | "fio2" | "resultado" | "fechaHora",
    val: any
  ) => {
    dirtyRef.current = true;
    setGasesPaFiO2((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "pao2" || field === "fio2") {
        const calc = calcPaFiO2(next.pao2 || "", next.fio2 || "");
        if (calc) next.resultado = calc;
      }
      if ((field === "pao2" || field === "fio2") && (next.pao2 || next.fio2)) {
        next.checked = true;
      }
      return next;
    });
  };

  const updateSpFi = (
    field: "checked" | "spo2" | "fio2" | "resultado" | "fechaHora",
    val: any
  ) => {
    dirtyRef.current = true;
    setSpFiO2((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "spo2" || field === "fio2") {
        const calc = calcSpFiO2(next.spo2 || "", next.fio2 || "");
        if (calc) next.resultado = calc;
      }
      if ((field === "spo2" || field === "fio2") && (next.spo2 || next.fio2)) {
        next.checked = true;
      }
      return next;
    });
  };

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(Math.max(0, totalSeg) / 60);
    const segs = Math.max(0, totalSeg) % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const handleGuardarTerapias = async () => {
    if (!pacienteSeleccionado || guardando) return;
    setGuardando(true);
    try {
      const ahoraTs = Date.now();
      const refTs =
        pacienteSeleccionado.tiemposSubmodulos?.timestampValidacionTriage ||
        pacienteSeleccionado.timestampPasoFase2 ||
        pacienteSeleccionado.timestampInicio ||
        ahoraTs;

      const updatedLabs: LaboratoriosDOMData = {
        ...(pacienteSeleccionado.laboratorios || {}),
        lactatoSerico,
        gasesPaFiO2,
        spFiO2,
        fotosGases,
      };

      dirtyRef.current = false;
      lastSnapRef.current = JSON.stringify({
        lactatoSerico,
        gasesPaFiO2,
        spFiO2,
        fotosGases,
      });

      await onActualizarPaciente(pacienteSeleccionado.id, {
        laboratorios: updatedLabs,
        estadosModulos: {
          fase1Validada: pacienteSeleccionado.estadosModulos?.fase1Validada ?? false,
          checklist1Completado:
            pacienteSeleccionado.estadosModulos?.checklist1Completado ?? false,
          laboratoriosCompletado:
            pacienteSeleccionado.estadosModulos?.laboratoriosCompletado ?? false,
          anexoCompletado: pacienteSeleccionado.estadosModulos?.anexoCompletado ?? false,
          vasopresoresCompletado:
            pacienteSeleccionado.estadosModulos?.vasopresoresCompletado ?? false,
          terapiasCompletado: true,
        },
        tiemposSubmodulos: {
          ...(pacienteSeleccionado.tiemposSubmodulos || {}),
          timestampTerapias: ahoraTs,
          terapiasSegundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
        },
      });

      setSelectedId(null);
    } finally {
      setGuardando(false);
    }
  };

  const pendientes = pacientesActivosCat3.filter(
    (p) => !p.estadosModulos?.terapiasCompletado
  );
  const evaluados = pacientesActivosCat3.filter(
    (p) => p.estadosModulos?.terapiasCompletado
  );

  if (pacienteSeleccionado) {
    const segsDesdeReporte = Math.max(
      0,
      Math.floor((ahora - (pacienteSeleccionado.timestampInicio || ahora)) / 1000)
    );
    const metaSegs = 2700;
    const segsRestantes = Math.max(0, metaSegs - segsDesdeReporte);
    const minsRestantes = Math.floor(segsRestantes / 60);
    const segsModulo = segsRestantes % 60;

    const evalPlaquetas = evaluarPlaquetasHemograma(
      pacienteSeleccionado.laboratorios?.hemograma
    );
    const arterialHabilitado = evalPlaquetas.gasesArterialesHabilitados;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a bandeja de TERAPIAS</span>
          </button>

          <span className="text-xs font-black uppercase bg-cyan-100 text-cyan-950 border border-cyan-400 px-3 py-1 rounded-full">
            Módulo TERAPIAS · Gases Venosos, Arteriales y Oximetría (Solo Cat 3)
          </span>
        </div>

        {/* Header Paciente + Cronómetro 45 min */}
        <div className="bg-[#083344] border-2 border-cyan-600 rounded-3xl p-5 sm:p-6 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-950/60 text-cyan-200 px-2.5 py-0.5 rounded-lg border border-cyan-500/50">
                  {pacienteSeleccionado.codigo}
                </span>
                <span className="text-xs font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded-lg">
                  {pacienteSeleccionado.categoriaTriageValidadaLabel ||
                    pacienteSeleccionado.categoriaTriageLabel ||
                    "ALERTA CHOQUE SEPTICOᵇ O DOMᵃ"}
                </span>
              </div>

              <div>
                {pacienteSeleccionado.nombre && (
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {pacienteSeleccionado.nombre}
                  </h2>
                )}
                <p className="text-sm font-mono font-bold text-cyan-200">
                  Cédula / ID:{" "}
                  {pacienteSeleccionado.identificacionPaciente ||
                    pacienteSeleccionado.codigo}
                  {pacienteSeleccionado.vitalesIngreso?.satO2 && (
                    <span className="ml-3 text-xs bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      SatO₂ Ingreso: {pacienteSeleccionado.vitalesIngreso.satO2}%
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/90 border-2 border-cyan-400/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[300px] shadow-lg">
              <div className="text-center sm:border-r sm:border-slate-800 sm:pr-3">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Tiempo desde que se reportó
                </span>
                <div className="text-3xl font-mono font-black text-cyan-300 tracking-widest mt-1 tabular-nums">
                  {formatearTiempo(segsDesdeReporte)}
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  Meta 45 Min (Choque Séptico)
                </span>
                <div
                  className={`text-3xl font-mono font-black tracking-widest mt-1 tabular-nums ${
                    segsRestantes <= 600
                      ? "text-red-400 animate-pulse"
                      : "text-amber-300"
                  }`}
                >
                  {formatearTiempo(segsRestantes)}
                </div>
                <span className="text-[11px] font-black block mt-1 text-sky-200">
                  {segsRestantes === 0
                    ? "Le queda 00 min 00 seg"
                    : `Le queda ${minsRestantes} min ${segsModulo
                        .toString()
                        .padStart(2, "0")} seg`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CAMPO SUPERIOR AL LADO DE LOS EXÁMENES: HEMOGRAMA + ALERTA DE PLAQUETAS (50.000/µL) */}
        <div className="bg-white border-2 border-cyan-600 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-[#083344] text-cyan-300 rounded-xl shrink-0">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-black uppercase text-[#083344] block">
                  Verificación Hemograma Completo para Gases Arteriales
                </span>
                <span className="text-slate-600 font-semibold">
                  Hemograma registrado en Laboratorio:{" "}
                  <strong className="text-slate-900">
                    {pacienteSeleccionado.laboratorios?.hemograma?.valor ||
                      "Pendiente por laboratorio"}
                  </strong>
                </span>
              </div>
            </div>

            <div className="lg:max-w-xl w-full">
              {evalPlaquetas.estado === "adecuadas" && (
                <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-xl px-3.5 py-2.5 flex items-start gap-2 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <span className="font-black block">
                      Supera las 50.000 plaquetas/µL ({evalPlaquetas.plaquetasFormateadas}/µL)
                    </span>
                    <span className="font-semibold text-emerald-900">
                      Sugerencia: Si el paciente tiene 50.000 plaquetas/µL o más, el médico puede considerar ordenar gases arteriales, de acuerdo con su condición clínica y el protocolo institucional.
                    </span>
                  </div>
                </div>
              )}

              {evalPlaquetas.estado === "trombocitopenia" && (
                <div className="bg-red-50 border-2 border-red-500 text-red-950 rounded-xl px-3.5 py-2.5 flex items-start gap-2 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <span className="font-black text-red-700 uppercase block">
                      Riesgo de trombocitopenia ({evalPlaquetas.plaquetasFormateadas} plaquetas/µL &lt; 50.000/µL)
                    </span>
                    <span className="font-bold text-red-900">
                      Alerta únicamente como sugerencia: se plantea evitar la punción arterial de acuerdo con la condición clínica y el protocolo institucional.
                    </span>
                  </div>
                </div>
              )}

              {(evalPlaquetas.estado === "sin_hemograma" ||
                evalPlaquetas.estado === "sin_plaquetas") && (
                <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs leading-snug">
                    <span className="font-black block">
                      Gases arteriales deshabilitados hasta resultado del Hemograma completo
                    </span>
                    <span className="font-semibold text-amber-900">
                      Solo cuando Laboratorio registre el recuento de plaquetas en el Hemograma completo se habilitará el cargue de gases arteriales. Las muestras venosas (Lactato sérico) y oximetría SpFiO₂ permanecen disponibles.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TABLA SUPERIOR DE GASES EN TERAPIAS */}
          <div className="border border-[#007b8f] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#083344] text-white font-black text-center divide-x divide-white/20">
                  <th className="p-2 w-36 text-left pl-3">Tipo de Muestra</th>
                  <th className="p-2 text-left pl-3">Examen / Variable</th>
                  <th className="p-2 w-32 sm:w-36">Fecha/Hora</th>
                  <th className="p-2 w-44 sm:w-56">Valor / Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#007b8f]/30">
                <tr className="bg-white">
                  <td className="p-2.5 font-black text-[#083344] bg-[#e6f6f9] border-r border-[#007b8f]/30">
                    Muestras venosas
                  </td>
                  <td className="p-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(lactatoSerico.checked)}
                        onChange={(e) => updateLactato("checked", e.target.checked)}
                        className="accent-[#007b8f]"
                      />
                      <span className="font-black text-slate-900">
                        Muestras venosas: Lactato sérico (cLac)
                      </span>
                    </label>
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <FormattedTimeInput
                      mode="datetime"
                      value={lactatoSerico.fechaHora || ""}
                      onValueChange={(val) => updateLactato("fechaHora", val)}
                      placeholder="dd/mm hh:mm"
                      className="w-full bg-[#f9fbfb] border border-slate-300 px-2 py-1 text-center font-mono rounded"
                    />
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <input
                      type="text"
                      value={lactatoSerico.valor || ""}
                      onChange={(e) => updateLactato("valor", e.target.value)}
                      placeholder="ej. 1.3 mmol/L (cLac)"
                      className="w-full bg-[#f9fbfb] border border-slate-300 px-2 py-1 font-bold rounded outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </td>
                </tr>

                <tr
                  className={
                    arterialHabilitado ? "bg-[#f8fdff]" : "bg-slate-100/80 opacity-80"
                  }
                >
                  <td className="p-2.5 font-black text-[#083344] bg-[#e6f6f9] border-r border-[#007b8f]/30">
                    Gases arteriales
                  </td>
                  <td className="p-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!arterialHabilitado}
                        checked={Boolean(gasesPaFiO2.checked)}
                        onChange={(e) => updateGases("checked", e.target.checked)}
                        className="accent-[#007b8f]"
                      />
                      <div>
                        <span className="font-black text-slate-900 block">
                          Gases arteriales: (PaO₂ / FiO₂ - PaFiO₂)
                        </span>
                        {!arterialHabilitado && (
                          <span className="text-[10px] font-bold text-amber-800 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Se habilita al tener resultado de Hemograma completo
                          </span>
                        )}
                      </div>
                    </label>
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <FormattedTimeInput
                      mode="time"
                      disabled={!arterialHabilitado}
                      value={gasesPaFiO2.fechaHora || ""}
                      onValueChange={(val) => updateGases("fechaHora", val)}
                      placeholder="hh:mm"
                      className="w-full bg-white border border-slate-300 px-2 py-1 text-center font-mono rounded disabled:bg-slate-200"
                    />
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <input
                      type="text"
                      disabled={!arterialHabilitado}
                      value={gasesPaFiO2.resultado || ""}
                      onChange={(e) => updateGases("resultado", e.target.value)}
                      placeholder={
                        arterialHabilitado
                          ? "PaFiO₂ calculado"
                          : "Bloqueado sin Hemograma"
                      }
                      className="w-full bg-emerald-50 border border-emerald-400 px-2 py-1 font-black text-emerald-950 font-mono rounded disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CARGA POR FOTO (CÁMARA) O ARCHIVO PARA MUESTRA VENOSA Y MUESTRA ARTERIAL */}
        <div className="bg-white border-2 border-[#083344]/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-[#083344] flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-700" />
                <span>
                  Tomar Foto o Subir Archivo de Tirilla de Gases (Lectura Automática IA)
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Puede digitar manualmente abajo o capturar/subir la tirilla del analizador (ej. Radiometer ABL90): en <strong>Muestra Venosa</strong> toma <strong>cLac</strong>; en <strong>Muestra Arterial</strong> extrae y calcula <strong>PaFiO₂</strong> y <strong>SpFiO₂ (SaFiO₂)</strong>. Las fotos quedan guardadas en el servidor.
              </p>
            </div>
          </div>

          {/* Inputs ocultos para archivo y fallback de cámara */}
          <input
            ref={fileVenosaRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) procesarArchivoGases(f, "venosa");
            }}
          />
          <input
            ref={camVenosaFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) procesarArchivoGases(f, "venosa");
            }}
          />
          <input
            ref={fileArterialRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) procesarArchivoGases(f, "arterial");
            }}
          />
          <input
            ref={camArterialFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) procesarArchivoGases(f, "arterial");
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Carga Venosa -> cLac */}
            <div className="bg-purple-50/70 border-2 border-purple-300 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-xs font-black uppercase text-purple-950 block">
                  1. Muestra en Vena → Lactato Sérico (cLac)
                </span>
                <span className="text-[11px] text-purple-900">
                  Extrae automáticamente el valor de <strong>cLac (mmol/L)</strong> y la hora de la muestra venosa.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(procesandoTipo)}
                  onClick={() => abrirCamara("venosa")}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-black text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  {procesandoTipo === "venosa" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>Tomar Foto Venosa</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(procesandoTipo)}
                  onClick={() => fileVenosaRef.current?.click()}
                  className="flex-1 bg-white hover:bg-purple-100 disabled:opacity-60 text-purple-950 border border-purple-400 font-black text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Archivo</span>
                </button>
              </div>
            </div>

            {/* Tarjeta Carga Arterial -> PaFiO2 y SpFiO2 */}
            <div
              className={`border-2 rounded-2xl p-4 space-y-3 ${
                arterialHabilitado
                  ? "bg-cyan-50/80 border-cyan-400"
                  : "bg-slate-100 border-slate-300 opacity-75"
              }`}
            >
              <div>
                <span className="text-xs font-black uppercase text-[#083344] flex items-center gap-1.5">
                  {!arterialHabilitado && <Lock className="w-3.5 h-3.5 text-amber-700" />}
                  <span>2. Muestra en Arteria → Gases Arteriales (PaFiO₂ y SpFiO₂)</span>
                </span>
                <span className="text-[11px] text-slate-700 block">
                  {arterialHabilitado
                    ? "Extrae PaO₂, sO₂ y FiO₂ (FO₂(I)) y calcula automáticamente PaFiO₂ y SpFiO₂ (SaFiO₂)."
                    : "Bloqueado hasta que Laboratorio cargue plaquetas en el Hemograma completo."}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!arterialHabilitado || Boolean(procesandoTipo)}
                  onClick={() => abrirCamara("arterial")}
                  className="flex-1 bg-[#083344] hover:bg-cyan-900 disabled:opacity-50 text-white font-black text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:cursor-not-allowed"
                >
                  {procesandoTipo === "arterial" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>Tomar Foto Arterial</span>
                </button>
                <button
                  type="button"
                  disabled={!arterialHabilitado || Boolean(procesandoTipo)}
                  onClick={() => fileArterialRef.current?.click()}
                  className="flex-1 bg-white hover:bg-cyan-100 disabled:opacity-50 text-[#083344] border border-cyan-500 font-black text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Archivo</span>
                </button>
              </div>
            </div>
          </div>

          {procesandoTipo && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-xs font-bold text-amber-950 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
              <span>
                Guardando foto en servidor y extrayendo valores de muestra{" "}
                {procesandoTipo === "venosa" ? "venosa (cLac)" : "arterial (PaFiO₂ / SpFiO₂)"}...
              </span>
            </div>
          )}

          {errorGases && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorGases}</span>
            </div>
          )}

          {infoExtraccion && (
            <div className="bg-emerald-50 border border-emerald-400 rounded-xl px-4 py-3 text-xs font-bold text-emerald-950 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{infoExtraccion}</span>
            </div>
          )}

          {/* Fotos guardadas en servidor */}
          {fotosGases.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-700 block">
                Fotos de Tirillas Guardadas en Servidor ({fotosGases.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {fotosGases.map((foto) => (
                  <div
                    key={foto.id}
                    className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-2.5 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setFotoAmpliada(foto)}
                      className="shrink-0 cursor-pointer"
                      title="Ampliar imagen"
                    >
                      <img
                        src={foto.url}
                        alt={foto.nombreArchivo}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-300 bg-slate-100"
                      />
                    </button>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span
                        className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                          foto.tipo === "venosa"
                            ? "bg-purple-100 text-purple-900"
                            : "bg-cyan-100 text-cyan-900"
                        }`}
                      >
                        {foto.tipo === "venosa" ? "Venosa" : "Arterial"}
                      </span>
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        {foto.resumen || foto.nombreArchivo}
                      </p>
                      {foto.fechaHora && (
                        <p className="text-[10px] font-mono text-slate-500">
                          {foto.fechaHora}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarFoto(foto.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CALCULADORAS EXACTAS: PaFiO2 Y SpFiO2 (SaFiO2) */}
        <div className="bg-[#f7fcfd] border-2 border-[#007b8f] rounded-2xl p-5 shadow-xl space-y-4 text-slate-900 text-xs">
          <h3 className="font-black text-sm uppercase text-[#074c5d] tracking-wider flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#007b8f]" />
            <span>
              CLASIFICACIÓN SISTEMA RESPIRATORIO · CÁLCULO AUTOMÁTICO PAFIO₂ Y SPFIO₂ (SAFIO₂)
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calculadora PaFiO2 */}
            <div
              className={`bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm ${
                !arterialHabilitado ? "opacity-75 bg-slate-50" : ""
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    disabled={!arterialHabilitado}
                    checked={Boolean(gasesPaFiO2.checked)}
                    onChange={(e) => updateGases("checked", e.target.checked)}
                    className="accent-[#007b8f] w-4 h-4 shrink-0"
                  />
                  <span>Gases Arteriales: PaFiO₂ = PaO₂ / FiO₂</span>
                </label>
                <FormattedTimeInput
                  mode="time"
                  disabled={!arterialHabilitado}
                  value={gasesPaFiO2.fechaHora || ""}
                  onValueChange={(val) => updateGases("fechaHora", val)}
                  placeholder="Hora (hh:mm)"
                  className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 text-center rounded font-mono text-[11px] disabled:bg-slate-200"
                />
              </div>

              {!arterialHabilitado && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Se habilita al conseguir el resultado de plaquetas en Hemograma completo.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    PaO₂ (mmHg)
                  </span>
                  <input
                    type="number"
                    step="any"
                    disabled={!arterialHabilitado}
                    value={gasesPaFiO2.pao2 || ""}
                    onChange={(e) => updateGases("pao2", e.target.value)}
                    placeholder="ej. 75"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f] disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    FiO₂ (0.21-1 o %)
                  </span>
                  <input
                    type="number"
                    step="any"
                    disabled={!arterialHabilitado}
                    value={gasesPaFiO2.fio2 || ""}
                    onChange={(e) => updateGases("fio2", e.target.value)}
                    placeholder="ej. 0.40 o 40"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f] disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-black text-[#0b4d6c] block mb-1">
                    Resultado PaFiO₂
                  </span>
                  <input
                    type="text"
                    disabled={!arterialHabilitado}
                    value={gasesPaFiO2.resultado || ""}
                    onChange={(e) => updateGases("resultado", e.target.value)}
                    placeholder="PaFiO₂"
                    className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-2 rounded-lg font-black text-center text-emerald-900 font-mono text-sm outline-none disabled:bg-slate-100 disabled:border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Calculadora SpFiO2 / SaFiO2 */}
            <div className="bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(spFiO2.checked)}
                    onChange={(e) => updateSpFi("checked", e.target.checked)}
                    className="accent-[#007b8f] w-4 h-4 shrink-0"
                  />
                  <span>Oximetría: SpFiO₂ (SaFiO₂) = SpO₂ / FiO₂</span>
                </label>
                <FormattedTimeInput
                  mode="time"
                  value={spFiO2.fechaHora || ""}
                  onValueChange={(val) => updateSpFi("fechaHora", val)}
                  placeholder="Hora (hh:mm)"
                  className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 text-center rounded font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    SpO₂ / SatO₂ (%)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={spFiO2.spo2 || ""}
                    onChange={(e) => updateSpFi("spo2", e.target.value)}
                    placeholder="ej. 94"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    FiO₂ (0.21-1 o %)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={spFiO2.fio2 || ""}
                    onChange={(e) => updateSpFi("fio2", e.target.value)}
                    placeholder="ej. 0.21 o 21"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-black text-[#0b4d6c] block mb-1">
                    Resultado SpFiO₂
                  </span>
                  <input
                    type="text"
                    value={spFiO2.resultado || ""}
                    onChange={(e) => updateSpFi("resultado", e.target.value)}
                    placeholder="SpFiO₂"
                    className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-2 rounded-lg font-black text-center text-emerald-900 font-mono text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 border border-cyan-300 rounded-xl p-3 text-xs font-semibold text-cyan-950">
            <strong>Referencia Disfunción Respiratoria (DOM):</strong> PaFiO₂ &lt; 400 (o &lt; 300 con soporte) o SpFiO₂ &lt; 292 indica compromiso respiratorio agudo en Choque Séptico pediátrico. Al guardar, los resultados se reflejan automáticamente en <strong>Fase 2, Fase 3, Laboratorios y Anexo 2</strong>.
          </div>
        </div>

        {/* Botón Guardar y Sincronizar */}
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-700 font-semibold max-w-xl">
            <strong className="text-emerald-800 block text-sm">
              Sincronización Inmediata con Fase 2, Fase 3, Laboratorios y Base de Datos:
            </strong>
            Al guardar, los cálculos de Lactato venoso, PaFiO₂, SpFiO₂ y las fotos quedan registrados en la historia clínica del paciente.
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
              onClick={handleGuardarTerapias}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>
                {guardando
                  ? "Guardando..."
                  : "Guardar Gases / PaFiO₂ / SpFiO₂ y Sincronizar"}
              </span>
            </button>
          </div>
        </div>

        {/* MODAL CÁMARA EN VIVO */}
        {camaraTipo && (
          <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase text-[#083344]">
                  Cámara ·{" "}
                  {camaraTipo === "venosa"
                    ? "Capturar Muestra Venosa (cLac)"
                    : "Capturar Gases Arteriales (PaFiO₂ / SpFiO₂)"}
                </span>
                <button
                  type="button"
                  onClick={detenerCamara}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {errorCamara ? (
                <p className="text-xs text-red-700 font-bold">{errorCamara}</p>
              ) : (
                <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={detenerCamara}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturarFotoCamara}
                  className="px-5 py-2 rounded-xl bg-[#083344] hover:bg-cyan-900 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar y Analizar Tirilla</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL VISOR DE FOTO AMPLIADA */}
        {fotoAmpliada && (
          <div
            className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFotoAmpliada(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-xs font-black uppercase text-[#083344] block">
                    {fotoAmpliada.tipo === "venosa"
                      ? "Muestra Venosa (Lactato / cLac)"
                      : "Gases Arteriales (PaFiO₂ / SpFiO₂)"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {fotoAmpliada.resumen || fotoAmpliada.nombreArchivo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFotoAmpliada(null)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto bg-slate-900 rounded-xl flex items-center justify-center p-2">
                <img
                  src={fotoAmpliada.url}
                  alt={fotoAmpliada.nombreArchivo}
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
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

        <span className="text-xs font-black uppercase bg-cyan-100 text-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-400">
          Módulo TERAPIAS · Solo Categoría 3 (Choque Séptico)
        </span>
      </div>

      {/* Main Banner */}
      <div className="bg-[#083344] border-2 border-cyan-500/60 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-cyan-400 text-slate-950 rounded-2xl shadow-lg">
            <Wind className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              TERAPIAS · Gases Venosos, Arteriales y Oximetría
            </h2>
            <p className="text-xs text-cyan-100 mt-1 max-w-xl">
              Módulo exclusivo para pacientes clasificados en <strong>ALERTA CHOQUE SÉPTICO / DOM (Categoría 3)</strong>. Registra Lactato venoso (cLac), Gases arteriales (PaFiO₂, habilitados al completar plaquetas en Hemograma) y SpFiO₂ mediante digitación o foto/archivo con IA.
            </p>
          </div>
        </div>

        {pendientes.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pendientes.length} Caso(s) Cat 3 Pendiente(s)</span>
          </div>
        )}
      </div>

      {/* Pendientes Cat 3 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-700" />
            <span>
              Pacientes Cat 3 (Alerta Choque Séptico) Pendientes de Gases / PaFiO₂ / SpFiO₂
            </span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pendientes.length} pendiente(s)
          </span>
        </div>

        {pendientes.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center border border-cyan-200">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                No hay pacientes en Alerta Choque Séptico (Categoría 3) pendientes en Terapias.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando ingrese o se reclasifique un paciente en Categoría 3 (Alerta Choque Séptico / DOM), aparecerá aquí automáticamente con su alarma.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map((p) => {
              const segsEspera = Math.max(
                0,
                Math.floor((ahora - (p.timestampInicio || ahora)) / 1000)
              );
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group p-5 rounded-2xl border-2 border-red-300 hover:border-cyan-600 bg-rose-50/60 hover:bg-cyan-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full tabular-nums">
                        <Clock className="w-3 h-3" />
                        Choque Séptico · {formatearTiempo(segsEspera)}
                      </span>
                      <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded border border-[#e65c5c]">
                        Cat 3: CHOQUE / DOMᵃ ({p.puntajeTamizaje} pts)
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {p.nombre ? `${p.nombre} · ` : ""}
                      <span className="font-mono text-cyan-900">
                        ID: {p.identificacionPaciente || "Sin identificación"}
                      </span>
                    </h4>
                  </div>

                  <button
                    type="button"
                    className="bg-[#083344] hover:bg-cyan-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 group-hover:scale-105 cursor-pointer"
                  >
                    <span>Registrar Gases / PaFiO₂ / SpFiO₂</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Casos Cat 3 activos ya evaluados */}
      {evaluados.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Casos Cat 3 Activos con Evaluación Respiratoria Guardada ({evaluados.length})
            </span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {evaluados.map((p) => (
              <div
                key={p.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <span className="font-black text-slate-900">
                    {p.codigo} · {p.nombre || "Paciente"} (ID:{" "}
                    {p.identificacionPaciente})
                  </span>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    Lactato: <strong>{p.laboratorios?.lactatoSerico?.valor || "—"}</strong>{" "}
                    · PaFiO₂:{" "}
                    <strong>{p.laboratorios?.gasesPaFiO2?.resultado || "—"}</strong> ·
                    SpFiO₂: <strong>{p.laboratorios?.spFiO2?.resultado || "—"}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer"
                >
                  Actualizar Gases / Oximetría
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

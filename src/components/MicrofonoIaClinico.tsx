import React, { useState, useRef, useEffect } from "react";
import {
  FormularioEquipoSepsis,
  Anexo2ChoqueData,
  Anexo3AlertaSepsisData,
  Anexo4BajaProbabilidadData,
} from "../types";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Send,
} from "lucide-react";

interface MicrofonoIaClinicoProps {
  categoriaValidada: 1 | 2 | 3;
  modoFase: "fase2" | "fase3";
  currentChecklist1: FormularioEquipoSepsis;
  currentAnexo: Anexo2ChoqueData | Anexo3AlertaSepsisData | Anexo4BajaProbabilidadData;
  onAplicarInterpretacion: (patch: {
    textoRectificado: string;
    checklist1Patch?: Partial<FormularioEquipoSepsis>;
    anexoPatch?: Record<string, any>;
    notaClinica?: string;
    camposAplicados: string[];
  }) => void;
}

export const MicrofonoIaClinico: React.FC<MicrofonoIaClinicoProps> = ({
  categoriaValidada,
  modoFase,
  currentChecklist1,
  currentAnexo,
  onAplicarInterpretacion,
}) => {
  const [activo, setActivo] = useState<boolean>(false);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [transcripcionEnVivo, setTranscripcionEnVivo] = useState<string>("");
  const [ultimoRectificado, setUltimoRectificado] = useState<string>("");
  const [ultimosCampos, setUltimosCampos] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarDictadoTexto, setMostrarDictadoTexto] = useState<boolean>(false);
  const [textoManualDictado, setTextoManualDictado] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activoRef = useRef<boolean>(false);
  const pendingTranscriptRef = useRef<string>("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioSliceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpeechAtRef = useRef<number>(0);
  const speechAvailableRef = useRef<boolean>(false);
  const preferredMimeRef = useRef<string>("");

  const latestPropsRef = useRef({
    categoriaValidada,
    modoFase,
    currentChecklist1,
    currentAnexo,
    onAplicarInterpretacion,
  });

  useEffect(() => {
    latestPropsRef.current = {
      categoriaValidada,
      modoFase,
      currentChecklist1,
      currentAnexo,
      onAplicarInterpretacion,
    };
  }, [categoriaValidada, modoFase, currentChecklist1, currentAnexo, onAplicarInterpretacion]);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || "");
        const idx = res.indexOf(",");
        resolve(idx >= 0 ? res.slice(idx + 1) : res);
      };
      reader.onerror = () => reject(new Error("Error leyendo audio grabado"));
      reader.readAsDataURL(blob);
    });

  const enviarAlServidor = async (params: { transcriptRaw?: string; audioBlob?: Blob }) => {
    const raw = (params.transcriptRaw || "").trim();
    if (!raw && (!params.audioBlob || params.audioBlob.size < 800)) return;

    setProcesando(true);
    setErrorMsg(null);
    try {
      let audioBase64 = "";
      let audioMimeType = "";
      if (params.audioBlob && params.audioBlob.size >= 800) {
        audioBase64 = await blobToBase64(params.audioBlob);
        audioMimeType = params.audioBlob.type || "audio/webm";
      }

      const {
        categoriaValidada: cat,
        modoFase: fase,
        currentChecklist1: cl1,
        currentAnexo: anx,
        onAplicarInterpretacion: applyFn,
      } = latestPropsRef.current;

      const resp = await fetch("/api/voz/interpretar-clinico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptRaw: raw,
          audioBase64: audioBase64 || undefined,
          audioMimeType: audioMimeType || undefined,
          categoriaValidada: cat,
          modoFase: fase,
          currentChecklist1: cl1,
          currentAnexo: anx,
        }),
      });

      const rawRespText = await resp.text();
      let data: any = null;
      try {
        data = rawRespText ? JSON.parse(rawRespText) : null;
      } catch {
        data = null;
      }

      if (!resp.ok || !data) {
        const fallbackMsg = rawRespText?.trim().startsWith("<")
          ? `Error de comunicación con el servidor (HTTP ${resp.status}).`
          : rawRespText?.slice(0, 160) || "No fue posible interpretar el dictado clínico.";
        throw new Error(data?.error || fallbackMsg);
      }

      if (data?.textoRectificado) {
        setUltimoRectificado(data.textoRectificado);
        setTranscripcionEnVivo((prev) => prev || data.textoRectificado);
      }
      if (Array.isArray(data?.camposAplicados) && data.camposAplicados.length > 0) {
        setUltimosCampos((prev) =>
          Array.from(new Set([...data.camposAplicados, ...prev])).slice(0, 12)
        );
      }

      applyFn({
        textoRectificado: data.textoRectificado || raw,
        checklist1Patch: data.checklist1Patch,
        anexoPatch: data.anexoPatch,
        notaClinica: data.notaClinica,
        camposAplicados: data.camposAplicados || [],
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Error procesando audio médico con IA.");
    } finally {
      setProcesando(false);
    }
  };

  const startRecorderInstance = (stream: MediaStream) => {
    if (typeof MediaRecorder === "undefined") return;
    const mimeType = preferredMimeRef.current;
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        audioChunksRef.current.push(ev.data);
      }
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
  };

  const stopRecorderAndGetBlob = async (): Promise<Blob | undefined> => {
    const mr = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (!mr || mr.state === "inactive") return undefined;

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      try {
        mr.stop();
      } catch {
        resolve();
      }
    });

    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];
    if (chunks.length === 0) return undefined;
    return new Blob(chunks, { type: mr.mimeType || preferredMimeRef.current || "audio/webm" });
  };

  const detenerMicrofono = async () => {
    activoRef.current = false;
    setActivo(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (audioSliceIntervalRef.current) {
      clearInterval(audioSliceIntervalRef.current);
      audioSliceIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const pendingText = pendingTranscriptRef.current.trim();
    pendingTranscriptRef.current = "";

    const mergedBlob = await stopRecorderAndGetBlob();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (pendingText || (!pendingText && mergedBlob && mergedBlob.size > 1500)) {
      await enviarAlServidor({
        transcriptRaw: pendingText,
        audioBlob: !pendingText ? mergedBlob : undefined,
      });
    }
  };

  const iniciarMicrofono = async () => {
    setErrorMsg(null);
    pendingTranscriptRef.current = "";
    audioChunksRef.current = [];
    lastSpeechAtRef.current = 0;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    speechAvailableRef.current = Boolean(SpeechRecognitionCtor);

    let streamAcquired = false;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        streamAcquired = true;

        if (typeof MediaRecorder !== "undefined") {
          preferredMimeRef.current = MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
          startRecorderInstance(stream);
        }
      }
    } catch (err: any) {
      const errName = String(err?.name || "");
      const errMsg = String(err?.message || "").toLowerCase();
      if (
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errName === "SecurityError" ||
        errMsg.includes("permission") ||
        errMsg.includes("denied")
      ) {
        setErrorMsg(
          "El navegador bloqueó el acceso al micrófono. Verifique el permiso de micrófono en el icono de candado junto a la barra de direcciones o use el dictado rápido por texto abajo."
        );
        setMostrarDictadoTexto(true);
        return;
      }
      if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setErrorMsg(
          "No se detectó un micrófono conectado en este dispositivo. Puede usar el dictado rápido por texto abajo."
        );
        setMostrarDictadoTexto(true);
        return;
      }
      if (!SpeechRecognitionCtor) {
        setErrorMsg(
          "No se pudo acceder al micrófono del dispositivo. Verifique los permisos del navegador o use el dictado por texto."
        );
        setMostrarDictadoTexto(true);
        return;
      }
    }

    if (!streamAcquired && !SpeechRecognitionCtor) {
      setErrorMsg(
        "Su navegador no soporta captura de audio en esta vista. Use el dictado rápido por texto."
      );
      setMostrarDictadoTexto(true);
      return;
    }

    activoRef.current = true;
    setActivo(true);

    // Periodic MediaRecorder fallback every 6s when Web Speech API isn't emitting transcripts
    if (streamAcquired && typeof MediaRecorder !== "undefined") {
      audioSliceIntervalRef.current = setInterval(async () => {
        if (!activoRef.current || !mediaStreamRef.current) return;
        const speechSilentForMs = Date.now() - lastSpeechAtRef.current;
        const speechCurrentlyActive = speechAvailableRef.current && speechSilentForMs < 5500;
        if (speechCurrentlyActive || pendingTranscriptRef.current.trim()) return;

        const sliceBlob = await stopRecorderAndGetBlob();
        if (activoRef.current && mediaStreamRef.current) {
          startRecorderInstance(mediaStreamRef.current);
        }
        if (sliceBlob && sliceBlob.size > 2000) {
          await enviarAlServidor({ audioBlob: sliceBlob });
        }
      }, 6000);
    }

    if (SpeechRecognitionCtor) {
      const rec = new SpeechRecognitionCtor();
      rec.lang = "es-CO";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        lastSpeechAtRef.current = Date.now();
        let interim = "";
        let newlyFinalized = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            newlyFinalized += piece + " ";
          } else {
            interim += piece;
          }
        }

        if (newlyFinalized.trim()) {
          pendingTranscriptRef.current = `${pendingTranscriptRef.current} ${newlyFinalized}`.trim();
          setTranscripcionEnVivo(`${pendingTranscriptRef.current} ${interim}`.trim());

          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            const batch = pendingTranscriptRef.current.trim();
            pendingTranscriptRef.current = "";
            if (batch) {
              enviarAlServidor({ transcriptRaw: batch });
            }
          }, 1200);
        } else if (interim) {
          setTranscripcionEnVivo(`${pendingTranscriptRef.current} ${interim}`.trim());
        }
      };

      rec.onerror = (ev: any) => {
        if (ev?.error === "not-allowed" || ev?.error === "service-not-allowed") {
          if (!streamAcquired) {
            setErrorMsg(
              "Permiso de micrófono denegado en el navegador. Habilite el permiso junto a la URL o use el dictado rápido por texto."
            );
            setMostrarDictadoTexto(true);
            detenerMicrofono();
          } else {
            // SpeechRecognition blocked, keep using MediaRecorder audio streaming seamlessly
            speechAvailableRef.current = false;
          }
        }
      };

      rec.onend = () => {
        if (activoRef.current && speechAvailableRef.current) {
          try {
            rec.start();
          } catch {
            // ignore
          }
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        speechAvailableRef.current = false;
      }
    }
  };

  const handleEnviarTextoManual = async () => {
    const txt = textoManualDictado.trim();
    if (!txt || procesando) return;
    setTranscripcionEnVivo(txt);
    setTextoManualDictado("");
    await enviarAlServidor({ transcriptRaw: txt });
  };

  useEffect(() => {
    return () => {
      activoRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (audioSliceIntervalRef.current) clearInterval(audioSliceIntervalRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-md transition-all ${
        activo
          ? "bg-gradient-to-r from-[#0c2340] to-[#0b4d6c] border-emerald-400 text-white"
          : "bg-white border-sky-300 text-slate-900"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              activo
                ? "bg-red-600 text-white animate-pulse shadow-lg"
                : "bg-sky-100 text-[#0c2340]"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-2">
              <span>Asistente de Voz IA en Tiempo Real (Rectificación Médica)</span>
              {procesando && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Rectificando y diligenciando...</span>
                </span>
              )}
            </h4>
            <p className={`text-[11px] mt-0.5 ${activo ? "text-sky-100" : "text-slate-600"}`}>
              Escucha y rectifica términos clínicos mientras evalúa al paciente para autollenar{" "}
              <strong>Checklist 1, Anexo y Nota Clínica</strong> (excluye Laboratorios, Vasopresores y Módulo 1).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMostrarDictadoTexto((v) => !v)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              activo
                ? "bg-slate-900/70 hover:bg-slate-800 text-sky-100 border-sky-400/50"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
            title="Abrir dictado alternativo por texto o dictado del sistema"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dictado Texto</span>
          </button>

          <button
            type="button"
            onClick={() => (activo ? detenerMicrofono() : iniciarMicrofono())}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              activo
                ? "bg-red-600 hover:bg-red-500 text-white ring-2 ring-white/60"
                : "bg-[#0c2340] hover:bg-sky-900 text-white"
            }`}
          >
            {activo ? (
              <>
                <MicOff className="w-4 h-4 animate-bounce" />
                <span>Detener Micrófono IA</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Habilitar Micrófono IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 bg-red-100 border border-red-300 text-red-900 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mostrarDictadoTexto && (
        <div
          className={`mt-3 rounded-xl p-3 border space-y-2 ${
            activo
              ? "bg-slate-950/70 border-sky-400/50 text-white"
              : "bg-sky-50/70 border-sky-200 text-slate-900"
          }`}
        >
          <span className="text-[11px] font-black uppercase block">
            Dictado / Texto Clínico para Autollenado con IA
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={textoManualDictado}
              onChange={(e) => setTextoManualDictado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEnviarTextoManual();
                }
              }}
              placeholder="Ej: Paciente con LLA, FC 135, FR 28, Temp 38.7, llenado capilar prolongado, iniciar Meropenem y bolo 10 ml/kg..."
              className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              type="button"
              disabled={!textoManualDictado.trim() || procesando}
              onClick={handleEnviarTextoManual}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Interpretar y Diligenciar</span>
            </button>
          </div>
        </div>
      )}

      {(activo || transcripcionEnVivo || ultimoRectificado || ultimosCampos.length > 0) && (
        <div
          className={`mt-3 rounded-xl p-3 text-xs space-y-2 border ${
            activo
              ? "bg-slate-950/60 border-sky-400/40 text-sky-100"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          {transcripcionEnVivo && (
            <div>
              <span className="text-[10px] font-black uppercase opacity-75 block">
                Audio capturado en vivo:
              </span>
              <p className="italic">{transcripcionEnVivo}</p>
            </div>
          )}

          {ultimoRectificado && (
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-500 block">
                Texto médico rectificado por IA:
              </span>
              <p className="font-semibold">{ultimoRectificado}</p>
            </div>
          )}

          {ultimosCampos.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-black uppercase flex items-center gap-1 text-emerald-500 mr-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Autollenado en:
              </span>
              {ultimosCampos.map((c, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

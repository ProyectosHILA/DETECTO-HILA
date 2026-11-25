import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceDictationButtonProps {
  onTranscript: (texto: string) => void;
  valorActual: string;
  className?: string;
  label?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  valorActual,
  className = "",
  label = "Dictar por voz",
}) => {
  const [escuchando, setEscuchando] = useState<boolean>(false);
  const [errorSoporte, setErrorSoporte] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorSoporte("Dictado por voz no soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-CO"; // Colombian Spanish for Hospital Infantil Los Ángeles

    recognition.onresult = (event: any) => {
      let transcripcionFinal = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcripcionFinal += event.results[i][0].transcript;
        }
      }

      if (transcripcionFinal) {
        const textoLimpio = transcripcionFinal.trim();
        const nuevoTexto = valorActual
          ? `${valorActual} ${textoLimpio}`
          : textoLimpio;
        onTranscript(nuevoTexto);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setErrorSoporte("Permiso de micrófono denegado en el navegador.");
      }
      setEscuchando(false);
    };

    recognition.onend = () => {
      setEscuchando(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [valorActual, onTranscript]);

  const toggleEscucha = async () => {
    if (!recognitionRef.current) {
      setErrorSoporte(
        "El reconocimiento de voz requiere permisos de micrófono o Chrome/Edge/Safari."
      );
      return;
    }

    if (escuchando) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setEscuchando(false);
    } else {
      setErrorSoporte(null);
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        }
        recognitionRef.current.start();
        setEscuchando(true);
      } catch (err: any) {
        const name = String(err?.name || "");
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setErrorSoporte("Permiso de micrófono denegado en el navegador.");
        } else {
          setErrorSoporte("No se pudo iniciar el dictado por voz.");
        }
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggleEscucha}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
          escuchando
            ? "bg-red-600 text-white animate-pulse shadow-red-500/50"
            : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-300"
        } ${className}`}
        title={escuchando ? "Detener dictado" : "Iniciar dictado por voz"}
      >
        {escuchando ? (
          <>
            <MicOff className="w-3.5 h-3.5 animate-bounce" />
            <span>Escuchando... (Clic para parar)</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-sky-600" />
            <span>{label}</span>
          </>
        )}
      </button>

      {escuchando && (
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
      )}

      {errorSoporte && (
        <span className="text-[11px] text-amber-600 flex items-center gap-1" title={errorSoporte}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[200px]">{errorSoporte}</span>
        </span>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { PacienteRegistro } from "../types";
import { Timer, Clock, AlertTriangle, Hourglass, User } from "lucide-react";

interface BannerConteoRegresivoCentralProps {
  pacientesActivos: PacienteRegistro[];
}

export const BannerConteoRegresivoCentral: React.FC<BannerConteoRegresivoCentralProps> = ({
  pacientesActivos,
}) => {
  const [ahora, setAhora] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (pacientesActivos.length === 0) return null;

  const formatearReloj = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto mb-6">
      <div className="bg-white border-2 border-[#0c2340] rounded-3xl shadow-xl overflow-hidden">
        {/* Header del banner centrado */}
        <div className="bg-[#0c2340] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-600 rounded-xl shadow animate-pulse">
              <Hourglass className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block leading-none">
                Control Institucional de Tiempos Activos
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white">
                Tiempo desde que se reportó y Conteo Regresivo de Meta
              </h3>
            </div>
          </div>

          <span className="text-[11px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow">
            {pacientesActivos.length} caso(s) activo(s)
          </span>
        </div>

        {/* Grid centrado de pacientes activos */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70">
          {pacientesActivos.map((pac) => {
            const inicio = pac.timestampInicio || pac.fechaCreacion || ahora;
            const segsTranscurridos = Math.max(0, Math.floor((ahora - inicio) / 1000));
            const categoriaActiva = pac.categoriaTriageValidada || pac.categoriaTriage;
            const metaSegundos = categoriaActiva === 3 ? 2700 : 3600; // 45 min para Rojo, 60 min para Amarillo/Verde
            const segsRestantes = Math.max(0, metaSegundos - segsTranscurridos);
            const minsRestantes = Math.floor(segsRestantes / 60);
            const segsModulo = segsRestantes % 60;
            const porcentajeRestante = Math.max(
              0,
              Math.min(100, (segsRestantes / metaSegundos) * 100)
            );

            const vencido = segsRestantes === 0;
            const critico = segsRestantes <= 600;
            const alerta = segsRestantes <= 1800 && segsRestantes > 600;

            let faseLabel = "Fase 1: Triage";
            let faseBadge = "bg-sky-100 text-sky-900 border-sky-300";
            if (pac.faseActual === 3 || pac.reportadoADetecto || pac.estado === "pendiente_detecto") {
              faseLabel = "Fase 3: DETECTO";
              faseBadge = "bg-purple-100 text-purple-950 border-purple-300";
            } else if (pac.faseActual === 2 || pac.estado === "pendiente_urgencias") {
              faseLabel = "Fase 2: Urgencias";
              faseBadge = "bg-amber-100 text-amber-950 border-amber-300";
            }

            const cardBorder = vencido || critico
              ? "border-red-400 bg-red-50/80"
              : alerta
              ? "border-amber-400 bg-amber-50/70"
              : "border-sky-300 bg-white";

            const clockColor = vencido || critico
              ? "text-red-600"
              : alerta
              ? "text-amber-700"
              : "text-[#0c2340]";

            const barColor = vencido || critico
              ? "bg-red-600"
              : alerta
              ? "bg-amber-500"
              : "bg-sky-600";

            return (
              <div
                key={pac.id}
                className={`border-2 rounded-2xl p-3.5 shadow-sm space-y-2.5 transition-colors ${cardBorder}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-[#0c2340] text-white rounded-lg shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      {pac.nombre && (
                        <span className="text-sm font-black text-slate-900 truncate block leading-tight">
                          {pac.nombre}
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-sky-900 truncate block">
                        ID: {pac.identificacionPaciente || pac.codigo} · {pac.codigo}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${faseBadge}`}>
                    {faseLabel}
                  </span>
                </div>

                {/* Dos contadores lado a lado */}
                <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="text-center border-r border-slate-200 pr-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block leading-tight">
                      <Clock className="w-3 h-3 inline mr-1 text-red-500" />
                      Tiempo desde que se reportó
                    </span>
                    <span className="text-xl font-mono font-black text-red-600 block mt-0.5">
                      {formatearReloj(segsTranscurridos)}
                    </span>
                  </div>

                  <div className="text-center pl-1">
                    <span className="text-[10px] font-black text-sky-800 uppercase block leading-tight">
                      <Timer className="w-3 h-3 inline mr-1 text-sky-700" />
                      {categoriaActiva === 3 ? "Meta 45 Min" : "Meta 1 Hora"}
                    </span>
                    <span className={`text-xl font-mono font-black block mt-0.5 ${clockColor}`}>
                      {formatearReloj(segsRestantes)}
                    </span>
                  </div>
                </div>

                <div
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border text-center ${
                    vencido
                      ? "bg-red-600 text-white border-red-700 animate-pulse"
                      : critico
                      ? "bg-red-100 text-red-900 border-red-300"
                      : alerta
                      ? "bg-amber-100 text-amber-950 border-amber-300"
                      : "bg-sky-50 text-[#0c2340] border-sky-200"
                  }`}
                >
                  {vencido ? (
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Le queda 00 min 00 seg (Tiempo cumplido)
                    </span>
                  ) : (
                    <span>
                      ⏳ Le queda {minsRestantes} min {segsModulo.toString().padStart(2, "0")} seg
                    </span>
                  )}
                </div>

                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${porcentajeRestante}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

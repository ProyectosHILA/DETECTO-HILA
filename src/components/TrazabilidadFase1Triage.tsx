import React from "react";
import { PacienteRegistro, CRITERIOS_TAMIZAJE_SEPSIS } from "../types";
import {
  Stethoscope,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  FileText,
  AlertTriangle,
  Check,
  PlusCircle,
  Eye,
} from "lucide-react";

interface TrazabilidadFase1TriageProps {
  paciente: PacienteRegistro;
  onIrAFase2?: () => void;
  onIrAFase3?: () => void;
  onNuevoCasoTriage?: () => void;
  modoSoloLectura?: boolean;
}

export const TrazabilidadFase1Triage: React.FC<TrazabilidadFase1TriageProps> = ({
  paciente,
  onIrAFase2,
  onIrAFase3,
  onNuevoCasoTriage,
  modoSoloLectura = true,
}) => {
  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const criterios =
    paciente.criteriosTamizaje || [false, false, false, false, false, false, false, false];
  const puntaje =
    paciente.puntajeTamizaje ??
    criterios.reduce((acc, c) => acc + (c ? 1 : 0), 0);
  const categoria =
    paciente.categoriaTriage || (puntaje >= 4 ? 3 : puntaje >= 2 ? 2 : 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Patient Identifier & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
            <Stethoscope className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-sky-900 tracking-wider">
                Trazabilidad Histórica · Fase 1 (Triage)
              </span>
              <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                {paciente.codigo}
              </span>
            </div>
            <span className="text-sm font-extrabold text-slate-900">
              Paciente ID: {paciente.identificacionPaciente}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNuevoCasoTriage && (
            <button
              onClick={onNuevoCasoTriage}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Diligenciar Nuevo Caso</span>
            </button>
          )}
          {onIrAFase2 && (
            <button
              onClick={onIrAFase2}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Fase 2 (Urgencias)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onIrAFase3 && (
            <button
              onClick={onIrAFase3}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ir a Fase 3 (DETECTO)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-[#0c2340] border-2 border-sky-500/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Registro Clínico Completado en Triage
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tamizaje de Sepsis · Triage
            </h2>
            <p className="text-xs text-sky-200 max-w-xl">
              Datos registrados por enfermería en el momento del ingreso. Esta información fue validada y transmitida a Urgencias y al Equipo DETECTO.
            </p>
          </div>

          <div className="bg-sky-950/90 border border-sky-600/50 rounded-2xl p-4 text-center min-w-[200px] shadow-inner space-y-1">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
              Tiempo en Fase 1
            </span>
            <div className="text-3xl font-mono font-black text-emerald-400">
              ⏱ {formatearTiempo(paciente.tiempoFase1Segundos || 0)}
            </div>
            <span className="text-[10px] text-sky-200 block">
              Registrado por: {paciente.autorTriage || "Enfermería Triage"}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE LOS 8 CRITERIOS DE TAMIZAJE DILIGENCIADA POR TRIAGE */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Evaluación de Tamizaje Sepsis (8 Criterios)
            </h3>
            <p className="text-xs text-slate-500">
              Tamizaje Sepsis (positivo si ≥ 2) o PEWS/EVAT ≥ 3 (Si el hospital está avalado)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600">Sumatoria:</span>
            <span className="text-sm font-mono font-black px-3 py-1 rounded-xl bg-slate-900 text-white">
              {puntaje} / 8 pts
            </span>
          </div>
        </div>

        {/* Tablita idéntica al protocolo físico con visto bueno verde */}
        <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 text-xs font-black text-slate-800 text-center tracking-wide">
            **Tamizaje Sepsis (positivo si ≥ 2) o PEWS/EVAT ≥ 3 (Si el hospital está avalado)**
          </div>

          <div className="divide-y divide-slate-200 bg-white">
            {CRITERIOS_TAMIZAJE_SEPSIS.map((criterioTexto, idx) => {
              const marcado = Boolean(criterios[idx]);
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 transition-colors ${
                    marcado ? "bg-emerald-50/70" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3 pr-4">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      {idx + 1}.
                    </span>
                    <span
                      className={`text-xs sm:text-sm ${
                        marcado
                          ? "font-extrabold text-slate-950"
                          : "font-medium text-slate-600"
                      }`}
                    >
                      {criterioTexto}
                    </span>
                  </div>

                  {/* Estado / Casilla con visto bueno verde */}
                  <div className="shrink-0 flex items-center gap-2">
                    {marcado ? (
                      <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Cumple (+1)</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300 text-xs font-mono">
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-100 px-4 py-3 border-t-2 border-slate-300 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase">
              Puntaje Total Obtenido en Triage:
            </span>
            <span className="text-sm font-black text-slate-950 font-mono bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-inner">
              {puntaje} de 8 criterios positivos
            </span>
          </div>
        </div>

        {/* BOTÓN / BANNER DE CLASIFICACIÓN DE TRIAGE RESULTANTE */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Categoría Resultante en Triage:
          </label>

          {categoria === 1 && (
            <div className="w-full bg-[#7ecc61] border-2 border-[#5ba83e] p-5 rounded-2xl text-center shadow-lg transition-transform">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Resultado Triage (Puntaje &lt; 2)
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5">
                BAJA POSIBILIDAD DE SEPSIS
              </h4>
              <p className="text-xs font-bold text-slate-900 mt-1">
                Puntaje {puntaje}/8. No cumple umbral para activación de alerta de sepsis sin otros factores.
              </p>
            </div>
          )}

          {categoria === 2 && (
            <div className="w-full bg-[#f4b400] border-2 border-[#d99b00] p-5 rounded-2xl text-center shadow-lg transition-transform">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                Resultado Triage (Puntaje 2 o 3)
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5">
                ALERTA DE SEPSIS (SIN DOMª)
              </h4>
              <p className="text-xs font-bold text-slate-950 mt-1">
                Puntaje {puntaje}/8. Tamizaje positivo. Requiere valoración prioritaria inmediata por Urgencias.
              </p>
            </div>
          )}

          {categoria === 3 && (
            <div className="w-full bg-[#ff9999] border-2 border-[#e65c5c] p-5 rounded-2xl text-center shadow-lg transition-transform">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                Resultado Triage (Puntaje &gt; 3)
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5">
                ALERTA CHOQUE SEPTICOb O DOMª
              </h4>
              <p className="text-xs font-bold text-slate-950 mt-1">
                Puntaje {puntaje}/8. Alerta máxima de choque o disfunción orgánica múltiple.
              </p>
            </div>
          )}
        </div>

        {/* DIAGNÓSTICO EN TRIAGE */}
        <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              Diagnóstico / Observaciones de Triage
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Por: {paciente.autorTriage || "Enfermería"}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 leading-relaxed shadow-inner">
            {paciente.diagnosticoTriage || "Sin observaciones adicionales registradas en Triage."}
          </div>
        </div>

        {/* BOTTOM NAVIGATION ACTIONS */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Estado actual del paciente:{" "}
            <strong className="text-slate-800 uppercase">
              {paciente.faseActual === 1
                ? "En Triage"
                : paciente.faseActual === 2
                ? "En Urgencias"
                : "En Equipo DETECTO"}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {onIrAFase2 && (
              <button
                onClick={onIrAFase2}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>Trazabilidad Fase 2 (Urgencias)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onIrAFase3 && (
              <button
                onClick={onIrAFase3}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>Continuar a Fase 3 (DETECTO)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

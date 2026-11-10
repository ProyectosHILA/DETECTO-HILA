import React, { useState, useEffect } from "react";
import { PacienteRegistro, CRITERIOS_TAMIZAJE_SEPSIS } from "../types";
import { VoiceDictationButton } from "./VoiceDictationButton";
import {
  Clock,
  ArrowRight,
  User,
  FileText,
  CheckCircle2,
  Users,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Activity,
  Check,
  XCircle,
} from "lucide-react";

interface Fase3GrupoDetectoProps {
  paciente: PacienteRegistro;
  onRegistrarCaso: (datos: {
    identificacionPaciente: string;
    diagnosticoDetecto?: string;
    tiempoFase3Segundos: number;
    tiempoTotalSegundos: number;
  }) => void;
  onVolverAlMenu: () => void;
}

export const Fase3GrupoDetecto: React.FC<Fase3GrupoDetectoProps> = ({
  paciente,
  onRegistrarCaso,
  onVolverAlMenu,
}) => {
  const [diagnosticoDetecto, setDiagnosticoDetecto] = useState<string>(
    paciente.diagnosticoDetecto || ""
  );

  // Time in phase 3
  const [segundosFase3, setSegundosFase3] = useState<number>(
    paciente.tiempoFase3Segundos || 0
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosFase3((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const tiempoFase1 = paciente.tiempoFase1Segundos || 0;
  const tiempoFase2 = paciente.tiempoFase2Segundos || 0;
  const tiempoTotalAcumulado = tiempoFase1 + tiempoFase2 + segundosFase3;

  const criterios = paciente.criteriosTamizaje || [false, false, false, false, false, false, false, false];
  const puntaje = paciente.puntajeTamizaje ?? criterios.reduce((acc, c) => acc + (c ? 1 : 0), 0);
  const categoria = paciente.categoriaTriage || (puntaje >= 4 ? 3 : puntaje >= 2 ? 2 : 1);

  const handleRegistrar = () => {
    onRegistrarCaso({
      identificacionPaciente: paciente.identificacionPaciente,
      diagnosticoDetecto: diagnosticoDetecto.trim(),
      tiempoFase3Segundos: segundosFase3,
      tiempoTotalSegundos: tiempoTotalAcumulado,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlMenu}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Volver a lista de DETECTO
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
            {paciente.codigo}
          </span>
          <span className="text-xs font-extrabold uppercase bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-300">
            Fase 3: Equipo DETECTO
          </span>
        </div>
      </div>

      {/* HEADER: FASE 3 GRUPO DETECTO + BIG VISIBLE CHRONOMETER WITH PRIOR TIMES BELOW */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Equipo DETECTO · Revisión Integral & Auditoría
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              FASE 3: EQUIPO DETECTO
            </h2>
            <p className="text-xs text-sky-200">
              Auditoría de historia completa (Triage + Urgencias), diagnóstico del líder y registro formal del caso.
            </p>
          </div>

          {/* CRONÓMETRO VISIBLE Y GRANDE + TIEMPOS FASES ANTERIORES DEBAJO */}
          <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 border-2 border-purple-400/60 rounded-2xl p-4 sm:p-5 text-center min-w-[260px] shadow-lg space-y-2">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              Tiempo en Fase 3 (En Vivo)
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-purple-300 tracking-widest">
              {formatearTiempo(segundosFase3)}
            </div>

            {/* TIEMPOS OCUPADOS EN FASE 1 Y FASE 2 VISIBLES DEBAJO DEL CRONÓMETRO */}
            <div className="pt-2 border-t border-sky-800/80 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Tiempo ocupado en Fase 1:</span>
                <span className="font-mono font-bold text-emerald-400 bg-sky-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {formatearTiempo(tiempoFase1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Tiempo ocupado en Fase 2:</span>
                <span className="font-mono font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                  {formatearTiempo(tiempoFase2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-white font-bold pt-1 border-t border-sky-800/50">
                <span>Tiempo total acumulado:</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {formatearTiempo(tiempoTotalAcumulado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM BODY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        {/* IDENTIFICACIÓN DEL PACIENTE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Número de Identificación del Paciente
              </span>
              <h3 className="text-2xl font-mono font-black text-slate-900">
                {paciente.identificacionPaciente || "Sin identificación"}
              </h3>
            </div>
          </div>

          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border self-start sm:self-auto">
            Caso: {paciente.codigo}
          </span>
        </div>

        {/* CATEGORÍA ASIGNADA EN TRIAGE */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Categoría Determinada en Triage (8 Criterios):
          </label>

          {categoria === 1 && (
            <div className="w-full bg-[#7ecc61] border-2 border-[#5ba83e] p-4 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Categoría 1 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black">
                BAJA POSIBILIDAD DE SEPSIS
              </h4>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos
              </span>
            </div>
          )}

          {categoria === 2 && (
            <div className="w-full bg-[#f4b400] border-2 border-[#d99b00] p-4 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                Categoría 2 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black">
                ALERTA DE SEPSIS (SIN DOMᵃ)
              </h4>
              <span className="text-xs font-bold text-slate-950 mt-0.5 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos
              </span>
            </div>
          )}

          {categoria === 3 && (
            <div className="w-full bg-[#ff9999] border-2 border-[#e65c5c] p-4 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                Categoría 3 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black">
                ALERTA CHOQUE SEPTICOᵇ O DOMᵃ
              </h4>
              <span className="text-xs font-bold text-slate-950 mt-0.5 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos
              </span>
            </div>
          )}
        </div>

        {/* TRAZABILIDAD E HISTORIA CLÍNICA COMPLETA */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-purple-700" />
            Trazabilidad e Historia Clínica Completa
          </h3>

          {/* HISTORIA FASE 1: TRIAGE */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Diagnóstico y Tamizaje en Triage (Fase 1)
              </span>
              <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                Tiempo: {formatearTiempo(tiempoFase1)}
              </span>
            </div>

            {/* Tablita de los 8 criterios de tamizaje */}
            <div className="border border-emerald-300 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="bg-emerald-100/70 px-3 py-1.5 border-b border-emerald-200 flex items-center justify-between text-xs font-black text-emerald-950">
                <span>Tamizaje Sepsis (8 Criterios evaluados)</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {puntaje} / 8 pts
                </span>
              </div>
              <div className="divide-y divide-emerald-100">
                {CRITERIOS_TAMIZAJE_SEPSIS.map((crit, idx) => {
                  const marcado = Boolean(criterios[idx]);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3 py-2 text-xs ${
                        marcado ? "bg-emerald-50/90 font-bold text-emerald-950" : "text-slate-500"
                      }`}
                    >
                      <span>
                        {idx + 1}. {crit}
                      </span>
                      {marcado ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                          <Check className="w-3 h-3 stroke-[3]" /> Sí (+1)
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs font-mono">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-emerald-200 shadow-inner">
              "{paciente.diagnosticoTriage || "Sin registro"}"
            </p>
          </div>

          {/* HISTORIA FASE 2: MÉDICO DE URGENCIAS */}
          <div className="bg-sky-50/70 border-2 border-sky-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                Validación y Diagnóstico de Urgencias (Fase 2)
              </span>
              <span className="bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                Tiempo: {formatearTiempo(tiempoFase2)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span>Dictamen Urgencias:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  paciente.aplicaSepsis !== false
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {paciente.aplicaSepsis !== false
                  ? "✓ CATEGORÍA APROBADA PARA FASE 3"
                  : "✗ NO APROBADA (DESCARTADA)"}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-sky-200 shadow-inner">
              "{paciente.diagnosticoUrgencias || "Sin diagnóstico médico registrado"}"
            </p>
          </div>
        </div>

        {/* CONTENEDOR NO OBLIGATORIO PARA OBSERVACIONES DE DETECTO CON DICTADO POR VOZ */}
        <div className="bg-purple-50/60 border-2 border-purple-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Observaciones del Líder DETECTO</span>
              </label>
              <span className="text-[11px] text-purple-700 font-semibold">
                (Opcional — No obligatorio para registrar)
              </span>
            </div>

            <VoiceDictationButton
              onTranscript={(texto) => setDiagnosticoDetecto(texto)}
              valorActual={diagnosticoDetecto}
              label="Dictar observaciones"
            />
          </div>

          <textarea
            rows={3}
            value={diagnosticoDetecto}
            onChange={(e) => setDiagnosticoDetecto(e.target.value)}
            placeholder="Ingrese o dicte observaciones del equipo DETECTO: validación de código sepsis, asignación de infectología, indicación de paraclínicos urgentes o UCI..."
            className="w-full bg-white border border-purple-200 rounded-xl p-4 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          />
        </div>

        {/* BOTÓN FINAL: REGISTRAR CASO EN BASE DE DATOS */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleRegistrar}
            className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-[#0f2b5c] text-white hover:brightness-110 cursor-pointer py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.99]"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>REGISTRAR CASO EN BASE DE DATOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

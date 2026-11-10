import React from "react";
import { PacienteRegistro } from "../types";
import { FormularioEquipoSepsisPdf } from "./FormularioEquipoSepsisPdf";
import {
  HeartPulse,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertTriangle,
  User,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";

interface TrazabilidadFase2UrgenciasProps {
  paciente: PacienteRegistro;
  onIrAFase1?: () => void;
  onIrAFase3?: () => void;
  onVerPendientesUrgencias?: () => void;
}

export const TrazabilidadFase2Urgencias: React.FC<TrazabilidadFase2UrgenciasProps> = ({
  paciente,
  onIrAFase1,
  onIrAFase3,
  onVerPendientesUrgencias,
}) => {
  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const aplica = paciente.aplicaSepsis !== false;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Patient Identifier & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
            <HeartPulse className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-950 tracking-wider">
                Trazabilidad Histórica · Fase 2 (Médico de Urgencias)
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                {paciente.codigo}
              </span>
            </div>
            <span className="text-sm font-extrabold text-slate-900">
              Paciente ID: {paciente.identificacionPaciente}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onIrAFase1 && (
            <button
              onClick={onIrAFase1}
              className="bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Fase 1 (Triage)</span>
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
      <div className="bg-amber-400 border-2 border-amber-500 rounded-3xl p-6 text-slate-950 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              Validación Médica de Urgencias Emitida
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              Equipo de Sepsis · Médico de Urgencias
            </h2>
            <p className="text-xs text-slate-900 max-w-xl font-medium">
              El médico de urgencias analizó el reporte de Triage, definió si el paciente sospechoso aplica para sepsis y emitió su diagnóstico clínico antes de reportar a DETECTO.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-2xl p-4 text-center min-w-[200px] shadow-lg space-y-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
              Tiempo en Fase 2
            </span>
            <div className="text-3xl font-mono font-black text-amber-300">
              ⏱ {formatearTiempo(paciente.tiempoFase2Segundos || 0)}
            </div>
            <span className="text-[10px] text-slate-300 block">
              Médico: {paciente.autorUrgencias || "Dr. Médico de Urgencias"}
            </span>
          </div>
        </div>
      </div>

      {/* DETALLES DE LA VALIDACIÓN Y DIAGNÓSTICO DE URGENCIAS */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        {/* VALIDACIÓN: ¿APLICA PARA SEPSIS? */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Decisión Clínica del Médico de Urgencias:
          </label>

          {aplica ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                    SÍ APLICA SOSPECHA DE SEPSIS
                  </h4>
                  <p className="text-xs font-bold text-emerald-800">
                    El caso fue verificado y reportado formalmente al Equipo DETECTO para tratamiento temprano y dirigido.
                  </p>
                </div>
              </div>
              <span className="shrink-0 bg-emerald-200 text-emerald-950 font-black text-xs px-3 py-1.5 rounded-full border border-emerald-400">
                Aprobado Urgencias
              </span>
            </div>
          ) : (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-rose-600 text-white rounded-xl shadow-md">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-rose-950 uppercase tracking-tight">
                    NO APLICA / DESCARTADO PARA SEPSIS
                  </h4>
                  <p className="text-xs font-bold text-rose-800">
                    {paciente.motivoDescarte || "Paciente evaluado y descartado para protocolo de sepsis institucional."}
                  </p>
                </div>
              </div>
              <span className="shrink-0 bg-rose-200 text-rose-950 font-black text-xs px-3 py-1.5 rounded-full border border-rose-400">
                Descartado
              </span>
            </div>
          )}
        </div>

        {/* DIAGNÓSTICO EMITIDO POR URGENCIAS */}
        <div className="space-y-2 bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <span className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              Diagnóstico del Médico de Urgencias
            </span>
            <span className="text-[11px] text-amber-900 font-bold">
              {paciente.autorUrgencias || "Dr. Médico Urgencias"}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-300 text-sm font-semibold text-slate-900 leading-relaxed shadow-inner">
            {paciente.diagnosticoUrgencias || "Sin diagnóstico detallado registrado en Urgencias."}
          </div>
        </div>

        {/* LISTA DE CHEQUEO 1 (PDF) DILIGENCIADA */}
        {paciente.formularioEquipoSepsis && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-black uppercase text-[#074c5d] tracking-wider">
                Lista de Chequeo 1 Oficial (PDF) · Diligenciada por Equipo de Sepsis
              </span>
              <span className="text-[10px] font-bold text-[#007b8f] bg-[#e4f4f7] px-2.5 py-0.5 rounded-full border border-[#007b8f]/30">
                Documento Digitalizado
              </span>
            </div>
            <FormularioEquipoSepsisPdf
              data={paciente.formularioEquipoSepsis}
              soloLectura={true}
            />
          </div>
        )}

        {/* RESUMEN DEL REPORTE RECIBIDO DESDE TRIAGE */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              Reporte de Triage recibido y validado en Urgencias
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">
              Fase 1: {formatearTiempo(paciente.tiempoFase1Segundos || 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block text-[10px] uppercase">
                Categoría Triage:
              </span>
              <span className="font-black text-slate-900 text-sm">
                {paciente.categoriaTriageLabel || `Categoría ${paciente.categoriaTriage || 1}`} ({paciente.puntajeTamizaje ?? 0} pts)
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-500 block text-[10px] uppercase">
                Diagnóstico Inicial Triage:
              </span>
              <span className="font-medium text-slate-800 line-clamp-2">
                {paciente.diagnosticoTriage || "Sin registro"}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION ACTIONS */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Tiempo acumulado hasta Urgencias:{" "}
            <strong className="text-slate-900 font-mono">
              ⏱ {formatearTiempo((paciente.tiempoFase1Segundos || 0) + (paciente.tiempoFase2Segundos || 0))}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {onIrAFase1 && (
              <button
                onClick={onIrAFase1}
                className="bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ver Tablita de Triage</span>
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

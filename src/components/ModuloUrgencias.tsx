import React, { useState } from "react";
import { PacienteRegistro, FormularioEquipoSepsis } from "../types";
import { Fase2MedicoUrgencias } from "./Fase2MedicoUrgencias";
import {
  HeartPulse,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
  CheckCircle2,
  Inbox,
  RefreshCw,
} from "lucide-react";

interface ModuloUrgenciasProps {
  pacientesPendientes: PacienteRegistro[];
  pacientesAtendidos: PacienteRegistro[];
  onReportarADetecto: (datos: {
    identificacionPaciente: string;
    diagnosticoUrgencias: string;
    aplicaSepsis: boolean;
    aprobadoUrgencias: boolean;
    motivoDescarte?: string;
    formularioEquipoSepsis?: FormularioEquipoSepsis;
    tiempoFase2Segundos: number;
    tiempoTotalSegundos: number;
    pacienteId: string;
  }) => void;
  onVolverAlInicio: () => void;
}

export const ModuloUrgencias: React.FC<ModuloUrgenciasProps> = ({
  pacientesPendientes,
  pacientesAtendidos,
  onReportarADetecto,
  onVolverAlInicio,
}) => {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteRegistro | null>(
    pacientesPendientes.length === 1 ? pacientesPendientes[0] : null
  );

  const formatEspera = (timestamp: number) => {
    const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    return `${mins} min`;
  };

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  if (pacienteSeleccionado) {
    return (
      <Fase2MedicoUrgencias
        paciente={pacienteSeleccionado}
        onReportarADetecto={(datos) => {
          onReportarADetecto({
            ...datos,
            pacienteId: pacienteSeleccionado.id,
          });
          setPacienteSeleccionado(null);
        }}
        onVolverAlMenu={() => setPacienteSeleccionado(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlInicio}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Salir al inicio
        </button>

        <span className="text-xs font-black uppercase bg-sky-900/80 text-sky-200 px-3 py-1 rounded-full border border-sky-700">
          Servicio de Urgencias · Perfil Médico
        </span>
      </div>

      {/* Main Banner */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-sky-700 text-white rounded-2xl shadow-lg">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Fase 2: Médico de Urgencias
            </h2>
            <p className="text-xs text-sky-200">
              Validación de reporte de Triage, diagnóstico médico y reporte formal al Grupo DETECTO.
            </p>
          </div>
        </div>

        {pacientesPendientes.length > 0 && (
          <div className="bg-red-950/90 border border-red-500 text-red-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{pacientesPendientes.length} Paciente(s) Esperando Atención</span>
          </div>
        )}
      </div>

      {/* PENDING CASES LIST */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-700" />
            <span>Pacientes Remitidos desde Triage (Pendientes)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pacientesPendientes.length} en espera
          </span>
        </div>

        {pacientesPendientes.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              No hay pacientes pendientes de Triage en este momento.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La lista se sincroniza automáticamente en tiempo real cuando el personal de Triage registre y transfiera un paciente con sospecha.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesPendientes.map((p) => (
              <div
                key={p.id}
                onClick={() => setPacienteSeleccionado(p)}
                className="group p-5 rounded-2xl border-2 border-red-200 hover:border-sky-500 bg-red-50/40 hover:bg-sky-50/40 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {p.codigo}
                    </span>
                    <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Esperando hace {formatEspera(p.timestampPasoFase2 || p.timestampInicio)}
                    </span>
                    {p.categoriaTriage === 3 && (
                      <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded border border-[#e65c5c]">
                        Cat 3: CHOQUE / DOMᵃ ({p.puntajeTamizaje} pts)
                      </span>
                    )}
                    {p.categoriaTriage === 2 && (
                      <span className="text-[10px] font-black bg-[#f4b400] text-black px-2 py-0.5 rounded border border-[#d99b00]">
                        Cat 2: ALERTA SEPSIS ({p.puntajeTamizaje} pts)
                      </span>
                    )}
                    {p.categoriaTriage === 1 && (
                      <span className="text-[10px] font-black bg-[#7ecc61] text-black px-2 py-0.5 rounded border border-[#5ba83e]">
                        Cat 1: BAJA POSIBILIDAD ({p.puntajeTamizaje} pts)
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-slate-900 font-mono">
                    ID Paciente: {p.identificacionPaciente || "Sin identificación"}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong className="text-slate-800">Tamizaje Triage:</strong> {p.diagnosticoTriage}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 hidden md:block">
                    Tiempo Fase 1: {formatearTiempo(p.tiempoFase1Segundos)}
                  </span>
                  <button
                    type="button"
                    className="bg-sky-700 hover:bg-sky-600 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md group-hover:scale-105 transition-transform"
                  >
                    <span>Atender Caso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENTLY ATTENDED CASES BY URGENCIAS */}
      {pacientesAtendidos.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Casos Reportados Recientemente a DETECTO</span>
          </h3>

          <div className="divide-y divide-slate-200 text-xs">
            {pacientesAtendidos.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{p.nombre} {p.apellido}</span>
                  <span className="text-slate-500 ml-2">({p.codigo})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    p.aplicaSepsis ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {p.aplicaSepsis ? "Sepsis Confirmada" : "Descartado"}
                  </span>
                  <span className="font-mono text-slate-600">
                    F2: {formatearTiempo(p.tiempoFase2Segundos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

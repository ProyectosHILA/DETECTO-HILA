import React, { useState } from "react";
import { PacienteRegistro } from "../types";
import { WorkspaceAtencionCaso } from "./WorkspaceAtencionCaso";
import {
  HeartPulse,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
} from "lucide-react";

interface ModuloUrgenciasProps {
  pacientesActivos: PacienteRegistro[];
  pacientesCerrados: PacienteRegistro[];
  onActualizarPaciente: (id: string, patch: Partial<PacienteRegistro>) => Promise<void>;
  onReportarADetecto: (
    paciente: PacienteRegistro,
    diagnosticoUrgencias: string,
    segsFase2: number
  ) => Promise<void>;
  onCerrarCaso: (
    paciente: PacienteRegistro,
    datos: { diagnosticoUrgencias?: string; segsFaseActual: number }
  ) => Promise<void>;
  onVolverAlInicio: () => void;
}

export const ModuloUrgencias: React.FC<ModuloUrgenciasProps> = ({
  pacientesActivos,
  pacientesCerrados,
  onActualizarPaciente,
  onReportarADetecto,
  onCerrarCaso,
  onVolverAlInicio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    pacientesActivos.length === 1 ? pacientesActivos[0].id : null
  );

  const pacienteSeleccionado =
    pacientesActivos.find((p) => p.id === selectedId) || null;

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
      <WorkspaceAtencionCaso
        paciente={pacienteSeleccionado}
        modoFase="fase2"
        onActualizarPaciente={(patch) =>
          onActualizarPaciente(pacienteSeleccionado.id, patch)
        }
        onReportarADetecto={(diagUrg, segsFase2) =>
          onReportarADetecto(pacienteSeleccionado, diagUrg, segsFase2)
        }
        onCerrarCaso={async (datos) => {
          await onCerrarCaso(pacienteSeleccionado, datos);
          setSelectedId(null);
        }}
        onVolverALista={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlInicio}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Salir al inicio
        </button>

        <span className="text-xs font-black uppercase bg-amber-100 text-amber-950 px-3 py-1 rounded-full border border-amber-400">
          Servicio de Urgencias · Equipo de Sepsis
        </span>
      </div>

      {/* Main Banner */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-400 text-slate-950 rounded-2xl shadow-lg">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Fase 2: Equipo de Sepsis (Médico de Urgencias)
            </h2>
            <p className="text-xs text-sky-200">
              Validación de Triage, Lista de Chequeo 1, Laboratorios, Anexo Clínico y reporte en vivo a DETECTO.
            </p>
          </div>
        </div>

        {pacientesActivos.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pacientesActivos.length} Caso(s) Activo(s)</span>
          </div>
        )}
      </div>

      {/* ACTIVE CASES LIST (PENDIENTES + REPORTADOS A DETECTO QUE SIGUEN ABIERTOS) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-700" />
            <span>Pacientes en Atención en Urgencias (En curso)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pacientesActivos.length} activo(s)
          </span>
        </div>

        {pacientesActivos.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              No hay pacientes activos pendientes de Triage en este momento.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La lista se sincroniza automáticamente en tiempo real cuando el personal de Triage registre y transfiera un paciente con sospecha.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesActivos.map((p) => {
              const cat = p.categoriaTriageValidada || p.categoriaTriage || 1;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group p-5 rounded-2xl border-2 border-red-200 hover:border-sky-500 bg-red-50/40 hover:bg-sky-50/40 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Reportado hace {formatEspera(p.timestampInicio)}
                      </span>
                      {p.reportadoADetecto && (
                        <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300">
                          ✓ Reportado a DETECTO (Sigue abierto)
                        </span>
                      )}
                      {cat === 3 && (
                        <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded border border-[#e65c5c]">
                          Cat 3: CHOQUE / DOMᵃ ({p.puntajeTamizaje} pts)
                        </span>
                      )}
                      {cat === 2 && (
                        <span className="text-[10px] font-black bg-[#f4b400] text-black px-2 py-0.5 rounded border border-[#d99b00]">
                          Cat 2: ALERTA SEPSIS ({p.puntajeTamizaje} pts)
                        </span>
                      )}
                      {cat === 1 && (
                        <span className="text-[10px] font-black bg-[#7ecc61] text-black px-2 py-0.5 rounded border border-[#5ba83e]">
                          Cat 1: BAJA POSIBILIDAD ({p.puntajeTamizaje} pts)
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {p.nombre ? `${p.nombre} · ` : ""}
                      <span className="font-mono text-sky-900">
                        ID: {p.identificacionPaciente || "Sin identificación"}
                      </span>
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
                      <span>Abrir Gestión 4 Módulos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENTLY CLOSED CASES */}
      {pacientesCerrados.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Casos Cerrados Recientemente</span>
          </h3>

          <div className="divide-y divide-slate-200 text-xs">
            {pacientesCerrados.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">
                    {p.nombre ? `${p.nombre} · ` : ""}ID: {p.identificacionPaciente}
                  </span>
                  <span className="text-slate-500 ml-2">({p.codigo})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Cerrado
                  </span>
                  <span className="font-mono text-slate-600">
                    Total: {formatearTiempo(p.tiempoTotalSegundos)}
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

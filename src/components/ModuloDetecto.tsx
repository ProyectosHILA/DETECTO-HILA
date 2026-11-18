import React, { useState } from "react";
import { PacienteRegistro } from "../types";
import { WorkspaceAtencionCaso } from "./WorkspaceAtencionCaso";
import {
  Users,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Database,
} from "lucide-react";

interface ModuloDetectoProps {
  pacientesPendientes: PacienteRegistro[];
  pacientesRegistrados: PacienteRegistro[];
  pacienteActivoId?: string | null;
  onActualizarPaciente: (id: string, patch: Partial<PacienteRegistro>) => Promise<void>;
  onCerrarCaso: (
    paciente: PacienteRegistro,
    datos: { diagnosticoDetecto?: string; segsFaseActual: number }
  ) => Promise<void>;
  onVerBaseDatos: () => void;
  onVolverAlInicio: () => void;
}

export const ModuloDetecto: React.FC<ModuloDetectoProps> = ({
  pacientesPendientes,
  pacientesRegistrados,
  pacienteActivoId,
  onActualizarPaciente,
  onCerrarCaso,
  onVerBaseDatos,
  onVolverAlInicio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    pacienteActivoId || (pacientesPendientes.length === 1 ? pacientesPendientes[0].id : null)
  );
  const [ahora, setAhora] = useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (pacienteActivoId) {
      setSelectedId(pacienteActivoId);
    }
  }, [pacienteActivoId]);

  const pacienteSeleccionado =
    pacientesPendientes.find((p) => p.id === selectedId) || null;

  const formatEsperaSegundos = (timestamp: number) => {
    const totalSeg = Math.max(0, Math.floor((ahora - timestamp) / 1000));
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
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
        modoFase="fase3"
        onActualizarPaciente={(patch) =>
          onActualizarPaciente(pacienteSeleccionado.id, patch)
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onVolverAlInicio}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Salir al inicio
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onVerBaseDatos}
            className="bg-white hover:bg-slate-100 text-purple-900 border border-purple-200 text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-purple-700" />
            <span>Centro de Control de Casos (Solo Lectura)</span>
          </button>
          <span className="text-xs font-black uppercase bg-purple-100 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-300">
            Fase 3: Equipo DETECTO
          </span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-[#2e1065] border border-purple-400/50 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Fase 3: Equipo DETECTO
            </h2>
            <span className="text-xs font-bold text-purple-200 block">
              Tratamiento temprano y dirigido
            </span>
            <p className="text-xs text-purple-200 mt-1 max-w-md">
              Gestión sincronizada de los 4 módulos clínicos (Triage, Checklist 1, Laboratorios y Anexo) y cierre oficial del caso.
            </p>
          </div>
        </div>

        {pacientesPendientes.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pacientesPendientes.length} Caso(s) en Equipo DETECTO</span>
          </div>
        )}
      </div>

      {/* PENDING CASES FROM URGENCIAS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-700" />
            <span>Casos Reportados por Urgencias para Equipo DETECTO</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pacientesPendientes.length} casos
          </span>
        </div>

        {pacientesPendientes.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                No hay casos pendientes remitidos por Urgencias en este momento.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tan pronto el médico de urgencias reporte un caso sospechoso a DETECTO, aparecerá aquí con su alerta en tiempo real.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesPendientes.map((p) => {
              const cat = p.categoriaTriageValidada || p.categoriaTriage || 1;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group p-5 rounded-2xl border-2 border-red-200 hover:border-purple-500 bg-red-50/40 hover:bg-purple-50/40 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full tabular-nums">
                        <Clock className="w-3 h-3" />
                        Tiempo en Fase 3: {formatEsperaSegundos(p.timestampPasoFase3 || p.timestampInicio)}
                      </span>
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
                      <span className="font-mono text-purple-900">
                        ID: {p.identificacionPaciente || "Sin identificación"}
                      </span>
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      <strong className="text-slate-800">Tamizaje Triage:</strong> {p.diagnosticoTriage}
                    </p>
                    {p.diagnosticoUrgencias && (
                      <p className="text-xs text-slate-700 line-clamp-2">
                        <strong className="text-purple-800">Concepto Urgencias:</strong> {p.diagnosticoUrgencias}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 group-hover:scale-105"
                  >
                    <span>Gestionar y Cerrar Caso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORIAL DE CASOS REGISTRADOS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Casos Cerrados y Registrados por Equipo DETECTO ({pacientesRegistrados.length})</span>
          </h3>
          <button
            onClick={onVerBaseDatos}
            className="text-xs text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
          >
            Ver todos en Centro de Control de Casos →
          </button>
        </div>

        {pacientesRegistrados.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Aún no hay casos registrados en esta sesión.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {pacientesRegistrados.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">
                    {p.nombre ? `${p.nombre} · ` : ""}ID: {p.identificacionPaciente || p.codigo}
                  </span>
                  <span className="text-slate-400 ml-2">
                    Tiempo Total: {formatearTiempo(p.tiempoTotalSegundos)}
                  </span>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Cerrado y Registrado (✓✓✓)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

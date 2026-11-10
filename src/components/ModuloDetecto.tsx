import React, { useState } from "react";
import { PacienteRegistro } from "../types";
import { Fase3GrupoDetecto } from "./Fase3GrupoDetecto";
import {
  Users,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Database,
  Eye,
} from "lucide-react";

interface ModuloDetectoProps {
  pacientesPendientes: PacienteRegistro[];
  pacientesRegistrados: PacienteRegistro[];
  pacienteActivo?: PacienteRegistro | null;
  onRegistrarCaso: (datos: {
    identificacionPaciente: string;
    diagnosticoDetecto?: string;
    tiempoFase3Segundos: number;
    tiempoTotalSegundos: number;
    pacienteId: string;
  }) => void;
  onVerBaseDatos: () => void;
  onVolverAlInicio: () => void;
}

export const ModuloDetecto: React.FC<ModuloDetectoProps> = ({
  pacientesPendientes,
  pacientesRegistrados,
  pacienteActivo,
  onRegistrarCaso,
  onVerBaseDatos,
  onVolverAlInicio,
}) => {
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteRegistro | null>(
    pacienteActivo || (pacientesPendientes.length === 1 ? pacientesPendientes[0] : null)
  );

  React.useEffect(() => {
    if (pacienteActivo) {
      setPacienteSeleccionado(pacienteActivo);
    }
  }, [pacienteActivo?.id]);

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
      <Fase3GrupoDetecto
        paciente={pacienteSeleccionado}
        onRegistrarCaso={(datos) => {
          onRegistrarCaso({
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
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          ← Salir al inicio
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onVerBaseDatos}
            className="bg-white hover:bg-slate-100 text-purple-900 border border-purple-200 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-purple-700" />
            <span>Ver Base de Datos (Solo Lectura)</span>
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
              Revisión integral de historia clínica (Triage + Urgencias), diagnóstico del líder y registro formal del caso en la base de datos institucional.
            </p>
          </div>
        </div>

        {pacientesPendientes.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pacientesPendientes.length} Caso(s) Esperando DETECTO</span>
          </div>
        )}
      </div>

      {/* PENDING CASES FROM URGENCIAS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-700" />
            <span>Casos Reportados por Urgencias para Validación DETECTO</span>
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
                Tan pronto el médico de urgencias valide y reporte un caso sospechoso, aparecerá aquí con su alerta en tiempo real.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesPendientes.map((p) => (
              <div
                key={p.id}
                onClick={() => setPacienteSeleccionado(p)}
                className="group p-5 rounded-2xl border-2 border-red-200 hover:border-purple-500 bg-red-50/40 hover:bg-purple-50/40 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      ID: {p.identificacionPaciente || p.codigo}
                    </span>
                    <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Esperando hace {formatEspera(p.timestampPasoFase3 || p.timestampInicio)}
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

                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong className="text-slate-800">Tamizaje Triage:</strong> {p.diagnosticoTriage}
                  </p>
                  <p className="text-xs text-slate-700 line-clamp-2">
                    <strong className="text-purple-800">Concepto Urgencias:</strong> {p.diagnosticoUrgencias}
                  </p>
                </div>

                <button
                  type="button"
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 group-hover:scale-105"
                >
                  <span>Revisar y Registrar Caso</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
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
            className="text-xs text-purple-700 hover:text-purple-900 font-bold"
          >
            Ver todos en Base de Datos →
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
                  <span className="font-bold text-slate-800">ID: {p.identificacionPaciente || p.codigo}</span>
                  <span className="text-slate-400 ml-2">
                    Tiempo Total: {formatearTiempo(p.tiempoTotalSegundos)}
                  </span>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Registrado (✓✓✓)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

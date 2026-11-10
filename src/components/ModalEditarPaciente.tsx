import React, { useState } from "react";
import { PacienteRegistro } from "../types";
import { User, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface ModalEditarPacienteProps {
  paciente: PacienteRegistro;
  onGuardar: (pacienteActualizado: PacienteRegistro) => void;
  onCerrar: () => void;
}

export const ModalEditarPaciente: React.FC<ModalEditarPacienteProps> = ({
  paciente,
  onGuardar,
  onCerrar,
}) => {
  const [identificacionPaciente, setIdentificacionPaciente] = useState(paciente.identificacionPaciente || "");
  const [diagnosticoTriage, setDiagnosticoTriage] = useState(paciente.diagnosticoTriage);
  const [diagnosticoUrgencias, setDiagnosticoUrgencias] = useState(paciente.diagnosticoUrgencias);
  const [diagnosticoDetecto, setDiagnosticoDetecto] = useState(paciente.diagnosticoDetecto || "");
  const [aplicaSepsis, setAplicaSepsis] = useState(paciente.aplicaSepsis ?? true);
  const [motivoDescarte, setMotivoDescarte] = useState(paciente.motivoDescarte || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({
      ...paciente,
      identificacionPaciente: identificacionPaciente.trim(),
      diagnosticoTriage: diagnosticoTriage.trim(),
      diagnosticoUrgencias: diagnosticoUrgencias.trim(),
      diagnosticoDetecto: diagnosticoDetecto.trim(),
      aplicaSepsis,
      motivoDescarte: !aplicaSepsis ? motivoDescarte.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-slate-900">
              Modificar Registro (Super Usuario)
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Número de Identificación del Paciente
            </label>
            <input
              type="text"
              value={identificacionPaciente}
              onChange={(e) => setIdentificacionPaciente(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Diagnóstico en Triage (Fase 1)
            </label>
            <textarea
              rows={2}
              value={diagnosticoTriage}
              onChange={(e) => setDiagnosticoTriage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Diagnóstico Médico de Urgencias (Fase 2)
            </label>
            <textarea
              rows={2}
              value={diagnosticoUrgencias}
              onChange={(e) => setDiagnosticoUrgencias(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700">Aplica Sepsis:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={aplicaSepsis === true}
                onChange={() => setAplicaSepsis(true)}
              />
              <span className="font-semibold text-emerald-700">Sí Aplica</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={aplicaSepsis === false}
                onChange={() => setAplicaSepsis(false)}
              />
              <span className="font-semibold text-red-700">No Aplica</span>
            </label>
          </div>

          {!aplicaSepsis && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Motivo de Descarte
              </label>
              <input
                type="text"
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Diagnóstico / Observaciones DETECTO (Fase 3)
            </label>
            <textarea
              rows={2}
              value={diagnosticoDetecto}
              onChange={(e) => setDiagnosticoDetecto(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md"
            >
              Guardar Modificaciones
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

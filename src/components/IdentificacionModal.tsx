import React from "react";
import { IdentificacionCaso, Paciente } from "../types";
import { X, Building2, FileText, UserCheck, Hash } from "lucide-react";

interface IdentificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  identificacion: IdentificacionCaso;
  paciente: Paciente;
  onUpdateIdentificacion: (data: Partial<IdentificacionCaso>) => void;
  onUpdatePaciente: (data: Partial<Paciente>) => void;
}

export const IdentificacionModal: React.FC<IdentificacionModalProps> = ({
  isOpen,
  onClose,
  identificacion,
  paciente,
  onUpdateIdentificacion,
  onUpdatePaciente,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0f2b5c] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-400" />
            Identificación del Caso Clínico
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-sky-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-slate-800 text-sm">
          <div>
            <label className="block font-medium text-xs text-slate-600 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              Centro Hospitalario / Institución
            </label>
            <input
              type="text"
              value={identificacion.centro}
              onChange={(e) => onUpdateIdentificacion({ centro: e.target.value })}
              placeholder="Ej: Hospital Infantil Los Ángeles (HILA)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-xs text-slate-600 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                N° Historia Clínica
              </label>
              <input
                type="text"
                value={identificacion.historiaClinica}
                onChange={(e) =>
                  onUpdateIdentificacion({ historiaClinica: e.target.value })
                }
                placeholder="Ej: 1029384"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-xs text-slate-600 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-600" />
                Iniciales Paciente
              </label>
              <input
                type="text"
                value={identificacion.iniciales}
                onChange={(e) =>
                  onUpdateIdentificacion({ iniciales: e.target.value.toUpperCase() })
                }
                placeholder="Ej: J.P.M."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-xs text-slate-600 mb-1">
                N° Consecutivo de Caso
              </label>
              <input
                type="text"
                value={identificacion.numeroCaso}
                onChange={(e) =>
                  onUpdateIdentificacion({ numeroCaso: e.target.value })
                }
                placeholder="Ej: 2026-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-xs text-slate-600 mb-1">
                Peso del Paciente (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={paciente.pesoKg ?? ""}
                onChange={(e) =>
                  onUpdatePaciente({
                    pesoKg: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Ej: 18"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm font-bold text-sky-900"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-sky-50 p-2.5 rounded-lg border border-sky-100">
            🔒 <strong>Protección de Datos:</strong> Los datos se almacenan
            localmente durante la sesión para la generación del informe final.
          </p>
        </div>

        <div className="bg-slate-50 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#0f2b5c] text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-sky-900 transition-colors shadow-sm"
          >
            Guardar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

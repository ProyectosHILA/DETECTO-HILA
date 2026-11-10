import React from "react";
import { CasoSepsis, TamizajeData } from "../types";
import { CRITERIOS_PSSC } from "../data/clinicalData";
import { calcularTamizaje } from "../utils/rulesEngine";
import { Check, ArrowRight, AlertTriangle, Clock } from "lucide-react";

interface Step2TamizajeProps {
  caso: CasoSepsis;
  onUpdateTamizaje: (data: Partial<TamizajeData>) => void;
  onIniciarTimer: () => void;
  onSiguiente: () => void;
}

export const Step2Tamizaje: React.FC<Step2TamizajeProps> = ({
  caso,
  onUpdateTamizaje,
  onIniciarTimer,
  onSiguiente,
}) => {
  const { tamizaje } = caso;

  const toggleCriterioPssc = (criterioId: string) => {
    let nuevosCriterios = [...tamizaje.criteriosPssc];
    if (nuevosCriterios.includes(criterioId)) {
      nuevosCriterios = nuevosCriterios.filter((id) => id !== criterioId);
    } else {
      nuevosCriterios.push(criterioId);
    }

    const esPositivo = calcularTamizaje(
      tamizaje.usaEvat ? tamizaje.puntajeEvat : null,
      nuevosCriterios.length
    );

    onUpdateTamizaje({
      criteriosPssc: nuevosCriterios,
      positivo: esPositivo,
    });

    // Start timer on any screening interaction
    onIniciarTimer();
  };

  const handleToggleUsaEvat = (usa: boolean) => {
    const esPositivo = calcularTamizaje(
      usa ? tamizaje.puntajeEvat : null,
      tamizaje.criteriosPssc.length
    );

    onUpdateTamizaje({
      usaEvat: usa,
      positivo: esPositivo,
    });

    onIniciarTimer();
  };

  const handleEvatScoreChange = (score: number | null) => {
    const esPositivo = calcularTamizaje(
      tamizaje.usaEvat ? score : null,
      tamizaje.criteriosPssc.length
    );

    onUpdateTamizaje({
      puntajeEvat: score,
      positivo: esPositivo,
    });

    onIniciarTimer();
  };

  const numCriterios = tamizaje.criteriosPssc.length;
  const esPositivo = tamizaje.positivo;

  return (
    <div className="space-y-6">
      {/* Step Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 2 — TAMIZAJE DE SEPSIS
        </span>
      </div>

      {/* Threshold Banner Box */}
      <div className="bg-sky-50/80 border-l-4 border-sky-600 p-4 rounded-r-xl space-y-1">
        <h3 className="font-bold text-sky-950 text-base">
          Positivo si: EVAT ≥ 3 | PSSC-MOD ≥ 2
        </h3>
        <p className="text-slate-700 text-sm">
          Cualquiera que sea positivo define tamizaje positivo.
        </p>
      </div>

      {/* EVAT Toggle Section */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
          ¿EL CENTRO USA ESCALA EVAT?
        </label>
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleToggleUsaEvat(false)}
            className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
              !tamizaje.usaEvat
                ? "bg-[#1182a0] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            No usar EVAT
          </button>
          <button
            type="button"
            onClick={() => handleToggleUsaEvat(true)}
            className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
              tamizaje.usaEvat
                ? "bg-[#1182a0] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sí, tengo puntaje EVAT
          </button>
        </div>

        {/* Input for EVAT if enabled */}
        {tamizaje.usaEvat && (
          <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200 space-y-2 mt-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                Puntaje EVAT obtenido (0 - 10):
              </span>
              <input
                type="number"
                min="0"
                max="10"
                value={tamizaje.puntajeEvat ?? ""}
                onChange={(e) =>
                  handleEvatScoreChange(
                    e.target.value !== "" ? parseInt(e.target.value) : null
                  )
                }
                placeholder="0"
                className="w-20 bg-white border border-sky-300 rounded-lg px-3 py-1.5 text-center font-bold text-lg text-sky-950 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            {tamizaje.puntajeEvat !== null && tamizaje.puntajeEvat >= 3 && (
              <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Puntaje EVAT ≥ 3 es POSITIVO
              </p>
            )}
          </div>
        )}
      </div>

      {/* PSSC-MOD Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            PSSC-MOD — MARCAR CRITERIOS PRESENTES
          </label>
          <span className="text-xs font-medium text-slate-500">
            Positivo si suma ≥ 2 criterios
          </span>
        </div>

        <div className="space-y-2.5">
          {CRITERIOS_PSSC.map((item) => {
            const checked = tamizaje.criteriosPssc.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleCriterioPssc(item.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "bg-sky-50/90 border-sky-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    checked
                      ? "bg-[#1182a0] border-[#1182a0] text-white"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {checked && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="font-medium text-slate-800 text-sm">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Large Count Card (Matches Image 3, 4, 5!) */}
      <div className="bg-[#0f2b5c] text-white rounded-2xl p-6 text-center shadow-md space-y-1">
        <div className="text-5xl font-black tracking-tight">{numCriterios}</div>
        <div className="text-xs text-sky-200 uppercase tracking-widest font-semibold">
          criterios PSSC-MOD marcados
        </div>
      </div>

      {/* RED ALERT CARD WHEN TAMIZAJE POSITIVO */}
      {esPositivo && (
        <div className="space-y-3 animate-in zoom-in-95 duration-200">
          <div className="bg-[#c23326] text-white py-3.5 px-4 rounded-xl font-bold text-center text-sm uppercase tracking-wide shadow-md flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 fill-white text-[#c23326]" />
            <span>
              TAMIZAJE POSITIVO (
              {tamizaje.usaEvat && (tamizaje.puntajeEvat ?? 0) >= 3
                ? "EVAT ≥ 3"
                : "PSSC-MOD ≥ 2"}
              )
            </span>
          </div>

          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl space-y-1">
            <h4 className="font-bold text-red-950 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              Activar Equipo de Sepsis ahora
            </h4>
            <p className="text-red-900 text-xs font-medium">
              Evaluación conjunta médico + enfermería en ≤ 10 min
            </p>
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a equipo de sepsis</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

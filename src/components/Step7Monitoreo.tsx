import React from "react";
import { CasoSepsis, MonitoreoData, ResultadoClasificacion, EscenarioClinicoATB } from "../types";
import { Check, AlertTriangle, Star, CheckCircle, ShieldAlert } from "lucide-react";

interface Step7MonitoreoProps {
  caso: CasoSepsis;
  onUpdateMonitoreo: (data: Partial<MonitoreoData>) => void;
  onReclasificarChoqueDOM: () => void;
  onVerResumen: () => void;
}

export const Step7Monitoreo: React.FC<Step7MonitoreoProps> = ({
  caso,
  onUpdateMonitoreo,
  onReclasificarChoqueDOM,
  onVerResumen,
}) => {
  const { monitoreo } = caso;

  const toggleCriterioReevaluacion = (id: string) => {
    let nuevos = [...monitoreo.reevaluacionHoraCriterios];
    if (nuevos.includes(id)) {
      nuevos = nuevos.filter((item) => item !== id);
    } else {
      nuevos.push(id);
    }

    onUpdateMonitoreo({
      reevaluacionHoraCriterios: nuevos,
      reclasificado: nuevos.length > 0,
    });
  };

  const toggleManejoAdicional = (id: string) => {
    let nuevos = [...monitoreo.manejoAdicional];
    if (nuevos.includes(id)) {
      nuevos = nuevos.filter((item) => item !== id);
    } else {
      nuevos.push(id);
    }
    onUpdateMonitoreo({ manejoAdicional: nuevos });
  };

  const criteriosC3List = [
    { id: "hipotension", label: "Hipotensión (PAS o PAM < P5 para la edad)" },
    { id: "lactato", label: "Lactato > 2 mmol/L" },
    { id: "perfusion", label: "Mala perfusión: llenado capilar rápido o ≥3 seg, piel moteada/fría, pulsos anormales" },
    { id: "organos", label: "Compromiso de ≥2 órganos" },
  ];

  const manejoAdicionalList = [
    { id: "suprarrenal", label: "Evaluar riesgo insuficiencia suprarrenal" },
    { id: "hipoglicemia", label: "Corregir hipoglicemia" },
    { id: "hipocalcemia", label: "Corregir hipocalcemia" },
    { id: "intubacion", label: "Considerar intubación / VM no invasiva" },
  ];

  const hayDeterioro = monitoreo.reevaluacionHoraCriterios.length > 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 7 — MONITOREO Y REEVALUACIÓN
        </span>
      </div>

      {/* C1. Monitoreo Continuo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          C1. Monitoreo continuo
        </h4>
        <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
          <li>→ Monitorización continua iniciada</li>
          <li>→ FC · FR · PAS · PAM · SatO2 · temperatura en cada ciclo</li>
          <li>→ Gasto urinario: objetivo &gt;0.5 ml/kg/h</li>
        </ul>
      </div>

      {/* C2. Respuesta al 1er Bolo (evaluar a los 10 min) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          C2. Respuesta al 1er bolo (evaluar a los 10 min)
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateMonitoreo({ respuestaPrimerBolo: true })}
            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
              monitoreo.respuestaPrimerBolo === true
                ? "bg-emerald-50 border-emerald-600 text-emerald-950 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            ✓ Sí hay mejoría
            <span className="block font-normal text-[11px] text-emerald-800 mt-1">
              → Continuar monitoreo
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateMonitoreo({ respuestaPrimerBolo: false })}
            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
              monitoreo.respuestaPrimerBolo === false
                ? "bg-red-50 border-red-600 text-red-950 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            ✗ NO hay mejoría
            <span className="block font-normal text-[11px] text-red-800 mt-1">
              → 2º bolo 10 ml/kg · Vasoactivos tempranos · Hidrocortisona
            </span>
          </button>
        </div>
      </div>

      {/* C3. Reevaluación a la hora */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          C3. Reevaluación a la hora — ¿alguno de estos?
        </h4>

        <div className="space-y-2">
          {criteriosC3List.map((item) => {
            const checked = monitoreo.reevaluacionHoraCriterios.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleCriterioReevaluacion(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "bg-red-50 border-red-500 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    checked
                      ? "bg-[#c23326] border-[#c23326] text-white"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-medium text-slate-800">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {!hayDeterioro ? (
          <div className="bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>✓ Sin deterioro — Continuar manejo actual</span>
          </div>
        ) : (
          <button
            onClick={onReclasificarChoqueDOM}
            className="w-full bg-[#c23326] hover:bg-red-800 text-white p-3 rounded-xl font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-md animate-bounce"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Reclasificar como Alerta de Choque/DOM</span>
          </button>
        )}
      </div>

      {/* C4. Manejo Adicional */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          C4. Manejo adicional
        </h4>

        <div className="space-y-2">
          {manejoAdicionalList.map((item) => {
            const checked = monitoreo.manejoAdicional.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleManejoAdicional(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "bg-emerald-50 border-emerald-500 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    checked
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-xs font-medium text-slate-800">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ICU Transfer Criteria Box (Matches Images 13 & 14!) */}
      <div className="bg-red-50/90 border-l-4 border-red-600 p-4 rounded-r-xl space-y-2">
        <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          Criterios de notificación / traslado a UCI
        </h4>

        <ul className="text-xs text-red-900 space-y-1 font-medium">
          <li>⚠️ Alteración del sensorio</li>
          <li>⚠️ Hipotensión arterial (PAS o PAM &lt; P5)</li>
          <li>⚠️ Signos de mala perfusión: LC ≥3 seg o flash, piel moteada, rubicundez, piel fría, pulsos débiles o saltones</li>
          <li>⚠️ Sobrecarga de volumen · Disfunción miocárdica · Dificultad respiratoria</li>
          <li>⚠️ Reclasificación como Alerta de Choque/DOM</li>
        </ul>
      </div>

      {/* Bottom Buttons (Matches Images 13 & 14!) */}
      <div className="space-y-2.5">
        <button
          onClick={onReclasificarChoqueDOM}
          className="w-full bg-[#c23326] hover:bg-red-800 text-white py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reclasificar como Choque/DOM</span>
        </button>

        <button
          onClick={onVerResumen}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-6 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <Star className="w-5 h-5 fill-white text-emerald-700" />
          <span>Ver resumen del caso ★</span>
        </button>
      </div>
    </div>
  );
};

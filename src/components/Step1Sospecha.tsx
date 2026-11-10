import React from "react";
import { CasoSepsis, SospechaData } from "../types";
import { RANGOS_EDAD } from "../data/clinicalData";
import { Check, ArrowRight, Zap } from "lucide-react";

interface Step1SospechaProps {
  caso: CasoSepsis;
  onUpdateSospecha: (data: Partial<SospechaData>) => void;
  onUpdateRangoEdad: (rango: string) => void;
  onSiguiente: () => void;
}

export const Step1Sospecha: React.FC<Step1SospechaProps> = ({
  caso,
  onUpdateSospecha,
  onUpdateRangoEdad,
  onSiguiente,
}) => {
  const { sospecha, paciente } = caso;
  const rangoSeleccionado = RANGOS_EDAD.find((r) => r.id === paciente.rangoEdad);

  const haySospecha =
    sospecha.fiebre ||
    sospecha.hipotermia ||
    sospecha.taquicardia ||
    sospecha.normotermiaConFoco;

  const toggleCheckbox = (key: keyof Omit<SospechaData, "presente">) => {
    const nuevoValor = !sospecha[key];
    const nuevaSospecha = {
      ...sospecha,
      [key]: nuevoValor,
    };
    const presente =
      nuevaSospecha.fiebre ||
      nuevaSospecha.hipotermia ||
      nuevaSospecha.taquicardia ||
      nuevaSospecha.normotermiaConFoco;

    onUpdateSospecha({
      [key]: nuevoValor,
      presente,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 1 — ¿CUÁNDO SOSPECHAR SEPSIS?
        </span>
      </div>

      {/* Info Blue Card */}
      <div className="bg-sky-50/80 border-l-4 border-sky-600 p-4 rounded-r-xl space-y-1">
        <h3 className="font-bold text-sky-950 text-base">
          Niño con cáncer · En cada valoración clínica
        </h3>
        <p className="text-slate-700 text-sm">
          Sospechar sepsis si presenta <strong className="text-sky-900 font-bold">cualquiera</strong> de los siguientes.
        </p>
      </div>

      {/* Age Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Edad del paciente (para umbrales FC/FR/PAS)
        </label>
        <select
          value={paciente.rangoEdad}
          onChange={(e) => onUpdateRangoEdad(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-800 text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-sm"
        >
          <option value="">— Seleccionar edad —</option>
          {RANGOS_EDAD.map((rango) => (
            <option key={rango.id} value={rango.id}>
              {rango.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Vital Sign Threshold Cards (Matches Image 2!) */}
      {rangoSeleccionado && (
        <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-black text-sky-900">
              &gt; {rangoSeleccionado.fcMax}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              FC &gt; P95 (lpm)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-black text-sky-900">
              &gt; {rangoSeleccionado.frMax}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              FR &gt; P95 (rpm)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
            <div className="text-2xl font-black text-sky-900">
              &lt; {rangoSeleccionado.pasMin}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              PAS &lt; P5 (mmHg)
            </div>
          </div>
        </div>
      )}

      {/* Checkboxes List */}
      <div className="space-y-3">
        {/* Checkbox Item 1 */}
        <div
          onClick={() => toggleCheckbox("fiebre")}
          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
            sospecha.fiebre
              ? "bg-sky-50/90 border-sky-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              sospecha.fiebre
                ? "bg-[#1182a0] border-[#1182a0] text-white"
                : "bg-white border-slate-300"
            }`}
          >
            {sospecha.fiebre && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">Fiebre</span>{" "}
            <span className="text-slate-600 text-sm">
              — axilar ≥38.5°C, o ≥38°C en 2 mediciones separadas por 1h, o sostenida 1h continua
            </span>
          </div>
        </div>

        {/* Checkbox Item 2 */}
        <div
          onClick={() => toggleCheckbox("hipotermia")}
          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
            sospecha.hipotermia
              ? "bg-sky-50/90 border-sky-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              sospecha.hipotermia
                ? "bg-[#1182a0] border-[#1182a0] text-white"
                : "bg-white border-slate-300"
            }`}
          >
            {sospecha.hipotermia && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">Hipotermia</span>{" "}
            <span className="text-slate-600 text-sm">— temperatura &lt;36°C</span>
          </div>
        </div>

        {/* Checkbox Item 3 */}
        <div
          onClick={() => toggleCheckbox("taquicardia")}
          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
            sospecha.taquicardia
              ? "bg-sky-50/90 border-sky-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              sospecha.taquicardia
                ? "bg-[#1182a0] border-[#1182a0] text-white"
                : "bg-white border-slate-300"
            }`}
          >
            {sospecha.taquicardia && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">Taquicardia</span>{" "}
            <span className="text-slate-600 text-sm">
              — FC &gt; P95 para la edad, no explicada por otra causa
            </span>
          </div>
        </div>

        {/* Checkbox Item 4 */}
        <div
          onClick={() => toggleCheckbox("normotermiaConFoco")}
          className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
            sospecha.normotermiaConFoco
              ? "bg-sky-50/90 border-sky-500 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              sospecha.normotermiaConFoco
                ? "bg-[#1182a0] border-[#1182a0] text-white"
                : "bg-white border-slate-300"
            }`}
          >
            {sospecha.normotermiaConFoco && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">
              Normotermia con foco
            </span>{" "}
            <span className="text-slate-600 text-sm">
              — sospecha clínica de infección sin cambio en temperatura
            </span>
          </div>
        </div>
      </div>

      {/* Amber alert box when suspicion present (Matches Image 2!) */}
      {haySospecha && (
        <div className="bg-[#d97706] text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md animate-in zoom-in-95 duration-200">
          <Zap className="w-5 h-5 fill-amber-200 text-amber-200" />
          <span>Sospecha presente — proceder a tamizaje</span>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a tamizaje</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

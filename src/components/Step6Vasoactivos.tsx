import React from "react";
import { CasoSepsis, TratamientoData } from "../types";
import { VASOACTIVOS } from "../data/clinicalData";
import { calcularVasoactivo, calcularHidrocortisona } from "../utils/rulesEngine";
import { ArrowRight, AlertTriangle, Activity, Zap } from "lucide-react";

interface Step6VasoactivosProps {
  caso: CasoSepsis;
  onUpdateTratamiento: (data: Partial<TratamientoData>) => void;
  onUpdatePeso: (peso: number | null) => void;
  onSiguiente: () => void;
}

export const Step6Vasoactivos: React.FC<Step6VasoactivosProps> = ({
  caso,
  onUpdateTratamiento,
  onUpdatePeso,
  onSiguiente,
}) => {
  const { tratamiento, paciente } = caso;
  const peso = paciente.pesoKg ?? 0;
  const dosisActual = tratamiento.dosisVasoactivoMcgKgMin || 0.1;

  const resCalc = calcularVasoactivo(peso, dosisActual);
  const hydroCalc = calcularHidrocortisona(peso);

  const handleDosisChange = (nuevaDosis: number) => {
    const calc = calcularVasoactivo(peso, nuevaDosis);
    onUpdateTratamiento({
      dosisVasoactivoMcgKgMin: nuevaDosis,
      velocidadInfusionMetodoA: calc.metodoAVelocidadMlHr,
      dosisMgMetodoB: calc.metodoBMgEn500cc,
      velocidadInfusionMetodoB: calc.metodoBVelocidadCcHr,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 6 — VASOPRESORES POR VENA PERIFÉRICA
        </span>
      </div>

      {/* Red Warning Banner Box */}
      <div className="bg-red-50/90 border-l-4 border-red-600 p-4 rounded-r-xl space-y-1">
        <h3 className="font-bold text-red-950 text-sm flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-red-600" />
          Iniciar TEMPRANO si no hay respuesta al 1er bolo
        </h3>
        <p className="text-red-900 text-xs font-medium">
          Acceso periférico: máximo 4-6 horas. Si dosis &gt;0.25 mcg/kg/min: acceso central urgente.
        </p>
      </div>

      {/* Weight Input */}
      <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-slate-700">
          Peso del paciente (kg)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={paciente.pesoKg ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseFloat(e.target.value) : null;
            onUpdatePeso(val);
            if (val) {
              const calc = calcularVasoactivo(val, dosisActual);
              onUpdateTratamiento({
                velocidadInfusionMetodoA: calc.metodoAVelocidadMlHr,
                dosisMgMetodoB: calc.metodoBMgEn500cc,
                velocidadInfusionMetodoB: calc.metodoBVelocidadCcHr,
              });
            }
          }}
          placeholder="Ej: 18"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 font-bold text-lg text-sky-950 outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
        />
      </div>

      {/* Vasoactive Drug Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
          Medicamento
        </label>
        <select
          value={tratamiento.vasoactivo}
          onChange={(e) => onUpdateTratamiento({ vasoactivo: e.target.value })}
          className="w-full bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-600 shadow-sm"
        >
          {VASOACTIVOS.map((v) => (
            <option key={v.id} value={v.nombre}>
              {v.descripcion}
            </option>
          ))}
        </select>
      </div>

      {/* Interactive Dose Slider Card (Matches Images 11 & 12!) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Dosis deseada</span>
          <span className="text-xl font-black text-sky-950">
            {dosisActual.toFixed(2)} mcg/kg/min
          </span>
        </div>

        <input
          type="range"
          min="0.05"
          max="2.00"
          step="0.05"
          value={dosisActual}
          onChange={(e) => handleDosisChange(parseFloat(e.target.value))}
          className="w-full accent-[#1182a0] h-2.5 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
          <span>0.05</span>
          <span className="text-amber-700 flex items-center gap-0.5">
            ▲ &gt;0.25 = alerta
          </span>
          <span>2.0</span>
        </div>
      </div>

      {/* Calculated Method A Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h4 className="text-xs font-bold text-slate-900 border-b pb-2">
          Método A — Concentración fija (1 mg / 50 cc = 20 mcg/ml)
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Preparación</span>
            <span className="font-bold text-slate-800">1 mg en 50 cc (20 mcg/ml)</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Diluyente</span>
            <span className="font-bold text-slate-800">SSN 0.9% o DAD 5%</span>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-xs text-slate-500 block font-medium">
            Velocidad de infusión:
          </span>
          <div className="text-3xl font-black text-sky-950">
            {peso > 0 ? `${resCalc.metodoAVelocidadMlHr} ml/hr` : "— ml/hr"}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Ref: 0.1 mcg/kg/min = {peso > 0 ? `${(0.1 * peso * 60 / 20).toFixed(1)} ml/hr` : "5.4 ml/hr"} para este paciente
          </p>
        </div>
      </div>

      {/* Calculated Method B Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-900 border-b pb-2">
          Método B — Fórmula por peso (0.3 × kg mg / 500 cc)
        </h4>

        <div>
          <span className="text-xs text-slate-500 block font-medium">
            Cantidad del medicamento:
          </span>
          <div className="text-2xl font-black text-slate-900">
            {peso > 0 ? `${resCalc.metodoBMgEn500cc} mg en 500 cc` : "— mg en 500 cc"}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Completar hasta 500 cc con SSN 0.9% o DAD 5%
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Referencia: 10 cc/hr = 0.1 mcg/kg/min
          </p>
        </div>

        <div className="pt-1">
          <span className="text-xs text-slate-500 block font-medium">
            Para dosis deseada:
          </span>
          <div className="text-3xl font-black text-sky-950">
            {peso > 0 ? `${resCalc.metodoBVelocidadCcHr} cc/hr` : "— cc/hr"}
          </div>
        </div>
      </div>

      {/* High Dose Alert Box (>0.25 mcg/kg/min) (Matches Image 12!) */}
      {dosisActual > 0.25 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl space-y-1.5 animate-in zoom-in-95 duration-200">
          <span className="font-bold text-red-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            ⚠️ Dosis &gt;0.25 mcg/kg/min
          </span>
          <p className="text-xs font-bold text-red-900">
            Considerar segundo vasoactivo · Iniciar hidrocortisona · Obtener acceso venoso central urgente
          </p>
        </div>
      )}

      {/* Hydrocortisone Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          HIDROCORTISONA — 100 MG/M²/DÍA
        </h5>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Considerar si: choque refractario · sospecha insuficiencia suprarrenal (hipoglicemia + esteroides recientes + compromiso CV) · dosis vasoactivo &gt;0.25 mcg/kg/min
        </p>

        {peso > 0 && (
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Dosis aproximada para este paciente:</span>
            <span className="text-sky-900 font-extrabold text-sm">
              {hydroCalc.dosisMgDia} mg/día ({hydroCalc.dosisCada6h} mg IV c/6h)
            </span>
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a monitoreo</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

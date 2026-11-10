import React from "react";
import { CasoSepsis, TratamientoData, EscenarioClinicoATB } from "../types";
import { ESCENARIOS_ATB, LISTA_INDICACIONES_VANCOMICINA } from "../data/clinicalData";
import { calcularDosisPorPeso } from "../utils/rulesEngine";
import { ArrowRight, Clock, CheckCircle2, ShieldAlert } from "lucide-react";

interface Step5AntibioticoProps {
  caso: CasoSepsis;
  onUpdateTratamiento: (data: Partial<TratamientoData>) => void;
  onUpdatePeso: (peso: number | null) => void;
  onRegistrarHoraATB: () => void;
  onSiguiente: () => void;
}

export const Step5Antibiotico: React.FC<Step5AntibioticoProps> = ({
  caso,
  onUpdateTratamiento,
  onUpdatePeso,
  onRegistrarHoraATB,
  onSiguiente,
}) => {
  const { tratamiento, paciente, tiempos } = caso;
  const peso = paciente.pesoKg ?? 0;

  const escenarioActual =
    ESCENARIOS_ATB.find((e) => e.id === tratamiento.escenarioClinico) ||
    ESCENARIOS_ATB[0];

  // Calculate Principal Antibiotic Dose
  const calculoPrincipal = calcularDosisPorPeso(
    peso,
    escenarioActual.dosisMgKg,
    escenarioActual.dosisMaximaMg
  );

  // Calculate Vancomycin Dose if checked
  const calculoVanco = calcularDosisPorPeso(peso, 15, 500);

  const handleEscenarioChange = (escenarioId: EscenarioClinicoATB) => {
    const esc = ESCENARIOS_ATB.find((e) => e.id === escenarioId) || ESCENARIOS_ATB[0];
    const calc = calcularDosisPorPeso(peso, esc.dosisMgKg, esc.dosisMaximaMg);

    onUpdateTratamiento({
      escenarioClinico: escenarioId,
      antibioticoPrincipal: esc.antibioticoNombre,
      dosisMgPrincipal: calc.dosisMg,
      incluyeVancomicina: escenarioId === "D" ? true : tratamiento.incluyeVancomicina,
      dosisMgVancomicina: escenarioId === "D" ? calculoVanco.dosisMg : tratamiento.dosisMgVancomicina,
    });
  };

  const toggleVancomicina = () => {
    const nuevoIncluye = !tratamiento.incluyeVancomicina;
    onUpdateTratamiento({
      incluyeVancomicina: nuevoIncluye,
      dosisMgVancomicina: nuevoIncluye ? calculoVanco.dosisMg : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 5 — ANTIBIÓTICOS
        </span>
      </div>

      {/* Patient Weight Input */}
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
              const calcP = calcularDosisPorPeso(val, escenarioActual.dosisMgKg, escenarioActual.dosisMaximaMg);
              const calcV = calcularDosisPorPeso(val, 15, 500);
              onUpdateTratamiento({
                dosisMgPrincipal: calcP.dosisMg,
                dosisMgVancomicina: tratamiento.incluyeVancomicina ? calcV.dosisMg : null,
              });
            }
          }}
          placeholder="Ej: 18"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 font-bold text-lg text-sky-950 outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
        />
      </div>

      {/* Clinical Scenario Select */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
          Escenario clínico
        </label>
        <select
          value={tratamiento.escenarioClinico}
          onChange={(e) => handleEscenarioChange(e.target.value as EscenarioClinicoATB)}
          className="w-full bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-600 shadow-sm"
        >
          {ESCENARIOS_ATB.map((esc) => (
            <option key={esc.id} value={esc.id}>
              {esc.label}
            </option>
          ))}
        </select>
      </div>

      {/* META Banner (Matches Image 11!) */}
      <div className="bg-[#1182a0] text-white py-3 px-4 rounded-xl font-black text-center text-sm uppercase tracking-wide shadow-sm">
        META: Antibióticos ≤ {tiempos.metaAntibioticoMinutos} min
      </div>

      {/* Main Calculated Drug Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="text-xs font-bold text-slate-500">
          {escenarioActual.antibioticoNombre}
        </div>
        <div className="text-4xl font-black text-sky-950">
          {peso > 0 ? `${calculoPrincipal.dosisMg} mg` : "— mg"}
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {escenarioActual.posologia}
        </p>
        {calculoPrincipal.observacion && (
          <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-lg">
            ℹ️ {calculoPrincipal.observacion}
          </p>
        )}
      </div>

      {/* Vancomycin Indications Box (Matches Image 11!) */}
      <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Indicaciones de Vancomicina (agregar si aplica)
          </label>
          <button
            type="button"
            onClick={toggleVancomicina}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              tratamiento.incluyeVancomicina
                ? "bg-amber-600 text-white"
                : "bg-amber-200/80 text-amber-900 hover:bg-amber-300"
            }`}
          >
            {tratamiento.incluyeVancomicina ? "✓ Incluida" : "+ Agregar"}
          </button>
        </div>

        <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
          {LISTA_INDICACIONES_VANCOMICINA.join(" · ")}
        </p>

        {tratamiento.incluyeVancomicina && (
          <div className="mt-3 bg-white p-3.5 rounded-xl border border-amber-300 space-y-1 animate-in fade-in duration-200">
            <div className="text-xs font-bold text-amber-900">Vancomicina IV</div>
            <div className="text-2xl font-black text-slate-900">
              {peso > 0 ? `${calculoVanco.dosisMg} mg` : "— mg"}
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              15 mg/kg/dosis · cada 6h · máx 500 mg/dosis
            </p>
          </div>
        )}
      </div>

      {/* Time Registration Button */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
        <button
          onClick={onRegistrarHoraATB}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Clock className="w-4 h-4" />
          <span>Registrar hora de administración de antibiótico</span>
        </button>

        {tiempos.administracionAntibiotico && (
          <p className="text-xs text-emerald-800 font-bold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Registrado a las:{" "}
            {new Date(tiempos.administracionAntibiotico).toLocaleTimeString("es-ES")}
          </p>
        )}
      </div>

      {/* Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a vasoactivos</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

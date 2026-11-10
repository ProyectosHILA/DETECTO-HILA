import React from "react";
import {
  CasoSepsis,
  ClasificacionData,
  ResultadoClasificacion,
  EscenarioClinicoATB,
} from "../types";
import { CRITERIOS_DOM } from "../data/clinicalData";
import { Check, ArrowRight, AlertTriangle, Info } from "lucide-react";

interface Step4ClasificarProps {
  caso: CasoSepsis;
  onUpdateClasificacion: (data: Partial<ClasificacionData>) => void;
  onUpdateMetaATB: (minutos: number) => void;
  onUpdateEscenarioATB: (escenario: EscenarioClinicoATB) => void;
  onSiguiente: () => void;
}

export const Step4Clasificar: React.FC<Step4ClasificarProps> = ({
  caso,
  onUpdateClasificacion,
  onUpdateMetaATB,
  onUpdateEscenarioATB,
  onSiguiente,
}) => {
  const { clasificacion } = caso;

  const seleccionarOpcion = (res: ResultadoClasificacion) => {
    let disfuncionCV = clasificacion.disfuncionCardiovascular;
    if (res === "choque_dom" && !clasificacion.criteriosDom.includes("cardiovascular")) {
      disfuncionCV = true;
    }

    onUpdateClasificacion({
      resultado: res,
      disfuncionCardiovascular: disfuncionCV,
    });

    if (res === "choque_dom") {
      onUpdateMetaATB(45);
      onUpdateEscenarioATB("D");
    } else {
      onUpdateMetaATB(60);
      if (caso.tratamiento.escenarioClinico === "D") {
        onUpdateEscenarioATB("A");
      }
    }
  };

  const toggleCriterioDom = (sistemaId: string) => {
    let nuevosCriterios = [...clasificacion.criteriosDom];
    if (nuevosCriterios.includes(sistemaId)) {
      nuevosCriterios = nuevosCriterios.filter((id) => id !== sistemaId);
    } else {
      nuevosCriterios.push(sistemaId);
    }

    const tieneCV = nuevosCriterios.includes("cardiovascular");
    const numOrganos = nuevosCriterios.length;

    // Auto classify if CV dysfunction or >= 2 organs
    let resultadoAuto: ResultadoClasificacion = clasificacion.resultado;
    if (tieneCV || numOrganos >= 2) {
      resultadoAuto = "choque_dom";
      onUpdateMetaATB(45);
      onUpdateEscenarioATB("D");
    } else if (numOrganos === 1 && !tieneCV) {
      resultadoAuto = "sepsis";
      onUpdateMetaATB(60);
    }

    onUpdateClasificacion({
      criteriosDom: nuevosCriterios,
      disfuncionCardiovascular: tieneCV,
      resultado: resultadoAuto,
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 4 — CLASIFICACIÓN FINAL
        </span>
      </div>

      {/* 3 Main Classification Radio/Card Options (Matches Images 8, 9, 10!) */}
      <div className="space-y-3">
        {/* Option 1: Choque Séptico / DOM */}
        <div
          onClick={() => seleccionarOpcion("choque_dom")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            clasificacion.resultado === "choque_dom"
              ? "bg-red-50/90 border-red-500 ring-2 ring-red-500/30 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                clasificacion.resultado === "choque_dom"
                  ? "bg-[#c23326] border-[#c23326] text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              {clasificacion.resultado === "choque_dom" && (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-red-700 text-sm">
                Alerta de choque séptico / DOM
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Tamizaje positivo CON disfunción cardiovascular (PAS/PAM &lt;P5 · Lactato &gt;2 · Vasopresor) <strong className="text-red-700 font-bold">O</strong> disfunción de ≥2 órganos
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: Alerta de sepsis */}
        <div
          onClick={() => seleccionarOpcion("sepsis")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            clasificacion.resultado === "sepsis"
              ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                clasificacion.resultado === "sepsis"
                  ? "bg-[#1182a0] border-[#1182a0] text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              {clasificacion.resultado === "sepsis" && (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-amber-700 text-sm">
                Alerta de sepsis
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Tamizaje positivo <strong className="text-amber-800 font-bold">SIN</strong> disfunción cardiovascular · puede tener disfunción de máximo 1 órgano
              </p>
            </div>
          </div>
        </div>

        {/* Option 3: Baja posibilidad */}
        <div
          onClick={() => seleccionarOpcion("baja_posibilidad")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            clasificacion.resultado === "baja_posibilidad"
              ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                clasificacion.resultado === "baja_posibilidad"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-slate-300"
              }`}
            >
              {clasificacion.resultado === "baja_posibilidad" && (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-emerald-700 text-sm">
                Baja posibilidad de sepsis
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Sin foco o explicación alternativa — observar ≥1h, MAMUTTS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC ACTION LISTS (Matches Images 9, 10!) */}
      {clasificacion.resultado === "choque_dom" && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-[#c23326] text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            Lista 2 — Choque/DOM - Antibióticos ≤ 45 min
          </div>

          <div className="bg-red-50/80 border-l-4 border-red-600 p-4 rounded-r-xl space-y-2">
            <h5 className="font-bold text-red-950 text-xs uppercase tracking-wider">
              Acciones inmediatas
            </h5>
            <ul className="text-xs text-slate-800 space-y-1.5 font-medium">
              <li>✓ Oxígeno FiO2 100%</li>
              <li>✓ Bolo líquidos 10 ml/kg en 5-10 min</li>
              <li>✓ Hemocultivos central + periférico — NO retrasar ATB</li>
              <li>✓ Labs DOM urgentes (&lt;45 min)</li>
              <li>✓ Meropenem + Vancomicina ≤ 45 min</li>
              <li>✓ Si no mejora al 1er bolo: 2º bolo o vasopresor temprano</li>
              <li>✓ Notificar UCI</li>
            </ul>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl space-y-1 text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Clasificación cambiada — antibiótico actualizado
            </span>
            <p className="text-amber-800">
              Ve a la pestaña <strong>Antibiótico</strong> para ver la dosis recalculada según la nueva clasificación.
            </p>
          </div>
        </div>
      )}

      {clasificacion.resultado === "sepsis" && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-[#1182a0] text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            Lista 3 — Alerta de Sepsis - Antibióticos ≤ 60 min
          </div>

          <div className="bg-sky-50/80 border-l-4 border-sky-600 p-4 rounded-r-xl space-y-2">
            <h5 className="font-bold text-sky-950 text-xs uppercase tracking-wider">
              Acciones inmediatas
            </h5>
            <ul className="text-xs text-slate-800 space-y-1.5 font-medium">
              <li>✓ Identificar foco · Clasificar riesgo MAMUTTS</li>
              <li>✓ Hemocultivos x2</li>
              <li>✓ Labs DOM (resultado ≤2h)</li>
              <li>✓ Escenario A: Cefepime · Escenario B: Pip/Tazo</li>
              <li>✓ Reevaluar a la HORA: ¿disfunción CV o ≥2 órganos? → reclasificar como Choque/DOM</li>
              <li>✓ Notificar UCI si reclasifica o condición de riesgo</li>
            </ul>
          </div>
        </div>
      )}

      {clasificacion.resultado === "baja_posibilidad" && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            Lista 4 — Baja posibilidad - MAMUTTS
          </div>

          <div className="bg-emerald-50/80 border-l-4 border-emerald-600 p-4 rounded-r-xl space-y-2">
            <h5 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
              Acciones
            </h5>
            <ul className="text-xs text-slate-800 space-y-1.5 font-medium">
              <li>✓ Seguir algoritmo MAMUTTS</li>
              <li>✓ Antibióticos escenario A o B ≤ 60 min</li>
              <li>✓ Monitoreo mínimo 1 hora · Ante deterioro: activar equipo de sepsis</li>
            </ul>
          </div>
        </div>
      )}

      {/* DOM System Criteria Selector */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          CRITERIOS DOM POR SISTEMA (≥2 = DOM)
        </label>

        <div className="space-y-2.5">
          {CRITERIOS_DOM.map((sistema) => {
            const isChecked = clasificacion.criteriosDom.includes(sistema.id);
            return (
              <div
                key={sistema.id}
                onClick={() => toggleCriterioDom(sistema.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "bg-sky-50/90 border-sky-500 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <h5 className={`font-bold text-sm ${sistema.esCardiovascular ? "text-red-700" : "text-sky-900"}`}>
                    {sistema.nombreSistema}
                  </h5>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isChecked
                        ? "bg-[#1182a0] border-[#1182a0] text-white"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {sistema.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a antibióticos</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

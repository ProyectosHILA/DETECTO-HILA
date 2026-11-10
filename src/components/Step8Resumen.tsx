import React from "react";
import { CasoSepsis } from "../types";
import { RANGOS_EDAD, ESCENARIOS_ATB } from "../data/clinicalData";
import { descargarResumenPDF } from "../utils/pdfGenerator";
import { FileText, Download, CheckCircle, Clock, ShieldAlert, RotateCcw } from "lucide-react";

interface Step8ResumenProps {
  caso: CasoSepsis;
  onNuevoCaso: () => void;
  onAbrirIdentificacion: () => void;
}

export const Step8Resumen: React.FC<Step8ResumenProps> = ({
  caso,
  onNuevoCaso,
  onAbrirIdentificacion,
}) => {
  const rangoInfo = RANGOS_EDAD.find((r) => r.id === caso.paciente.rangoEdad);
  const escInfo = ESCENARIOS_ATB.find((e) => e.id === caso.tratamiento.escenarioClinico);

  const inicioMs = caso.tiempos.inicioTamizaje;
  const atbMs = caso.tiempos.administracionAntibiotico;

  let deltaMin: number | null = null;
  if (inicioMs && atbMs) {
    deltaMin = Math.floor((atbMs - inicioMs) / 60000);
  }

  const cumptioMeta =
    deltaMin !== null && deltaMin <= caso.tiempos.metaAntibioticoMinutos;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 8 — RESUMEN COMPLETO DEL CASO
        </span>
        <button
          onClick={onAbrirIdentificacion}
          className="text-xs text-sky-700 hover:underline font-bold"
        >
          Editar identificación
        </button>
      </div>

      {/* Main Download PDF Banner */}
      <div className="bg-[#0f2b5c] text-white p-6 rounded-2xl shadow-md space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-300">
            <FileText className="w-7 h-7" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-extrabold">Informe Clínico Consolidado</h3>
          <p className="text-xs text-sky-200 font-medium mt-1">
            Genera un archivo PDF con la auditoría de tiempos, criterios y dosis calculadas.
          </p>
        </div>

        <button
          onClick={() => descargarResumenPDF(caso)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Descargar PDF del Caso</span>
        </button>
      </div>

      {/* Summary Section 1: Identificación */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 border-b pb-2 uppercase tracking-wider text-[11px] text-slate-500">
          1. Paciente e Institución
        </h4>
        <div className="grid grid-cols-2 gap-2 text-slate-800 font-medium">
          <div>
            <span className="text-slate-400 block">Centro:</span>
            <span className="font-bold">{caso.identificacion.centro || "No registrado"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Historia Clínica:</span>
            <span className="font-bold">{caso.identificacion.historiaClinica || "No registrado"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Iniciales / N° Caso:</span>
            <span className="font-bold">
              {caso.identificacion.iniciales || "N/A"} ({caso.identificacion.numeroCaso || "N/A"})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Edad / Peso:</span>
            <span className="font-bold">
              {rangoInfo?.label || "Sin edad"} · {caso.paciente.pesoKg ? `${caso.paciente.pesoKg} kg` : "Sin peso"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 2: Tiempos y Meta */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 border-b pb-2 uppercase tracking-wider text-[11px] text-slate-500 flex items-center justify-between">
          <span>2. Tiempos y Meta de Antibiótico</span>
          <Clock className="w-4 h-4 text-sky-600" />
        </h4>

        <div className="grid grid-cols-2 gap-2 text-slate-800 font-medium">
          <div>
            <span className="text-slate-400 block">Inicio Tamizaje Positivo:</span>
            <span className="font-bold">
              {inicioMs ? new Date(inicioMs).toLocaleTimeString("es-ES") : "Sin activar"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Meta Establecida:</span>
            <span className="font-bold">≤ {caso.tiempos.metaAntibioticoMinutos} minutos</span>
          </div>
          <div>
            <span className="text-slate-400 block">Administración ATB:</span>
            <span className="font-bold">
              {atbMs ? new Date(atbMs).toLocaleTimeString("es-ES") : "No registrado"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Tiempo Transcurrido:</span>
            <span
              className={`font-extrabold ${
                cumptioMeta ? "text-emerald-700" : deltaMin !== null ? "text-red-700" : "text-slate-600"
              }`}
            >
              {deltaMin !== null ? `${deltaMin} min (${cumptioMeta ? "Cumplido ✓" : "Excedido ⚠️"})` : "Pendiente"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 3: Clasificación */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 border-b pb-2 uppercase tracking-wider text-[11px] text-slate-500">
          3. Tamizaje y Clasificación
        </h4>

        <div className="space-y-1.5 text-slate-800 font-medium">
          <div>
            <span className="text-slate-400">Tamizaje EVAT: </span>
            <span className="font-bold">
              {caso.tamizaje.usaEvat ? `Puntaje ${caso.tamizaje.puntajeEvat ?? 0}` : "No usado"}
            </span>
          </div>
          <div>
            <span className="text-slate-400">PSSC-MOD Criterios: </span>
            <span className="font-bold">{caso.tamizaje.criteriosPssc.length} marcados</span>
          </div>
          <div>
            <span className="text-slate-400">Clasificación Diagnóstica: </span>
            <span
              className={`font-black ${
                caso.clasificacion.resultado === "choque_dom"
                  ? "text-red-700"
                  : caso.clasificacion.resultado === "sepsis"
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {caso.clasificacion.resultado === "choque_dom"
                ? "CHOQUE SÉPTICO / DOM"
                : caso.clasificacion.resultado === "sepsis"
                ? "ALERTA DE SEPSIS"
                : "BAJA POSIBILIDAD DE SEPSIS"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 4: Medicamentos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 border-b pb-2 uppercase tracking-wider text-[11px] text-slate-500">
          4. Medicamentos Calculados
        </h4>

        <div className="space-y-1.5 text-slate-800 font-medium">
          <div>
            <span className="text-slate-400 block">Antibiótico Principal:</span>
            <span className="font-bold text-sky-950 text-sm">
              {caso.tratamiento.antibioticoPrincipal} ({caso.tratamiento.dosisMgPrincipal ?? 0} mg)
            </span>
          </div>

          {caso.tratamiento.incluyeVancomicina && (
            <div>
              <span className="text-slate-400 block">Vancomicina:</span>
              <span className="font-bold text-amber-900 text-sm">
                Vancomicina IV ({caso.tratamiento.dosisMgVancomicina ?? 0} mg)
              </span>
            </div>
          )}

          <div className="pt-1">
            <span className="text-slate-400 block">Vasoactivo ({caso.tratamiento.vasoactivo}):</span>
            <span className="font-bold">
              Dosis: {caso.tratamiento.dosisVasoactivoMcgKgMin} mcg/kg/min · Infusión Método A:{" "}
              {caso.tratamiento.velocidadInfusionMetodoA ?? 0} ml/hr
            </span>
          </div>
        </div>
      </div>

      {/* Restart Case Button */}
      <button
        onClick={onNuevoCaso}
        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Iniciar Nuevo Caso Clínico</span>
      </button>

      {/* Institutional Legal Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center leading-normal px-2">
        DETECTO© Soporte a Decisiones Clínicas Pediátricas 2026.
        <br />
        Esta herramienta apoya, pero no sustituye, el juicio clínico del profesional responsable.
      </p>
    </div>
  );
};

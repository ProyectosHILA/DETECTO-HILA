import React from "react";
import { CasoSepsis } from "../types";
import { ESCENARIOS_ATB, RANGOS_EDAD } from "../data/clinicalData";
import {
  Clock,
  Play,
  Volume2,
  VolumeX,
  User,
  Scale,
  Pill,
  Activity,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface ClinicalSidebarProps {
  caso: CasoSepsis;
  pasoActual: number;
  segundosTranscurridos: number;
  sonidoHabilitado: boolean;
  onToggleSonido: () => void;
  onIniciarTimer: () => void;
  onAbrirIdentificacion: () => void;
  onUpdatePeso: (peso: number | null) => void;
  onReclasificarChoqueDOM: () => void;
  onIrAPaso: (paso: number) => void;
}

export const ClinicalSidebar: React.FC<ClinicalSidebarProps> = ({
  caso,
  pasoActual,
  segundosTranscurridos,
  sonidoHabilitado,
  onToggleSonido,
  onIniciarTimer,
  onAbrirIdentificacion,
  onUpdatePeso,
  onReclasificarChoqueDOM,
  onIrAPaso,
}) => {
  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const timerActivo = caso.tiempos.inicioTamizaje !== null;
  const minutosTranscurridos = Math.floor(segundosTranscurridos / 60);
  const metaMinutos = caso.tiempos.metaAntibioticoMinutos;
  const rangoInfo = RANGOS_EDAD.find((r) => r.id === caso.paciente.rangoEdad);
  const escInfo = ESCENARIOS_ATB.find((e) => e.id === caso.tratamiento.escenarioClinico);

  // Timer alert styling
  let timerBadgeBg = "bg-slate-800 text-slate-300";
  let clockColor = "text-sky-400";

  if (timerActivo) {
    if (minutosTranscurridos >= metaMinutos) {
      timerBadgeBg = "bg-red-950/90 border border-red-500 text-red-200 animate-pulse";
      clockColor = "text-red-400";
    } else if (minutosTranscurridos >= metaMinutos - 15) {
      timerBadgeBg = "bg-amber-950/90 border border-amber-500 text-amber-200";
      clockColor = "text-amber-400";
    } else {
      timerBadgeBg = "bg-emerald-950/90 border border-emerald-500 text-emerald-200";
      clockColor = "text-emerald-400";
    }
  }

  return (
    <div className="space-y-4 sticky top-20">
      {/* 1. Live Chronometer Panel */}
      <div className="bg-[#0b1f42] border border-sky-900/60 rounded-2xl p-5 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-sky-800/50 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-400" />
            Control de Tiempos
          </span>
          <button
            onClick={onToggleSonido}
            className="p-1.5 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-200 transition-colors"
            title={sonidoHabilitado ? "Silenciar alertas" : "Activar sonido"}
          >
            {sonidoHabilitado ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Big Digital Display */}
        <div className="text-center py-1">
          <div className={`text-4xl lg:text-5xl font-mono font-black tracking-widest ${clockColor}`}>
            {timerActivo ? formatearTiempo(segundosTranscurridos) : "00:00"}
          </div>

          <div className="mt-2">
            {!timerActivo ? (
              <div className="space-y-2">
                <span className="inline-block text-[11px] bg-slate-800/90 text-slate-300 px-3 py-1 rounded-full font-medium border border-slate-700">
                  ⏸ Cronómetro inactivo — Inicia con tamizaje
                </span>
                <button
                  onClick={onIniciarTimer}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Iniciar Cronómetro Ahora</span>
                </button>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold ${timerBadgeBg}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>CRONÓMETRO ACTIVO</span>
              </div>
            )}
          </div>
        </div>

        {/* Meta Box */}
        <div className="bg-sky-950/80 p-3 rounded-xl border border-sky-800/60 flex items-center justify-between text-xs">
          <span className="text-sky-300 font-medium">Meta Antibiótico:</span>
          <span className="font-black text-white bg-sky-800/80 px-2.5 py-0.5 rounded text-sm">
            ≤ {metaMinutos} min
          </span>
        </div>

        {caso.tiempos.administracionAntibiotico && (
          <div className="bg-emerald-950/80 border border-emerald-600/60 p-2.5 rounded-xl text-xs text-emerald-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ATB administrado a los{" "}
              {Math.floor((caso.tiempos.administracionAntibiotico - (caso.tiempos.inicioTamizaje || Date.now())) / 60000)}{" "}
              min
            </span>
          </div>
        )}
      </div>

      {/* 2. Patient Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            Paciente
          </span>
          <button
            onClick={onAbrirIdentificacion}
            className="text-[11px] font-bold text-sky-700 hover:underline"
          >
            Editar HC
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-medium">Historia Clínica</span>
            <span className="font-extrabold text-slate-800 truncate block">
              {caso.identificacion.historiaClinica || "Sin HC"}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-medium">Rango de Edad</span>
            <span className="font-bold text-slate-800 truncate block">
              {rangoInfo?.label.split("(")[0] || "6m - 12a"}
            </span>
          </div>
        </div>

        {/* Peso Input in Sidebar */}
        <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-sky-950 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            Peso:
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              value={caso.paciente.pesoKg ?? ""}
              onChange={(e) =>
                onUpdatePeso(e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-16 bg-white border border-sky-300 rounded-lg px-2 py-1 text-center font-black text-sm text-sky-950 focus:ring-2 focus:ring-sky-600 outline-none"
              placeholder="0"
            />
            <span className="text-xs font-bold text-sky-900">kg</span>
          </div>
        </div>
      </div>

      {/* 3. Real-time Clinical Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          Resumen Clínico en Vivo
        </span>

        {/* Screening Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Tamizaje:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-md ${
              caso.tamizaje.positivo
                ? "bg-red-100 text-red-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {caso.tamizaje.positivo ? "⚠️ POSITIVO" : "✓ NEGATIVO"}
          </span>
        </div>

        {/* Classification Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Clasificación:</span>
          <span
            className={`font-black px-2.5 py-0.5 rounded-md ${
              caso.clasificacion.resultado === "choque_dom"
                ? "bg-red-600 text-white"
                : caso.clasificacion.resultado === "sepsis"
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {caso.clasificacion.resultado === "choque_dom"
              ? "CHOQUE SÉPTICO"
              : caso.clasificacion.resultado === "sepsis"
              ? "ALERTA SEPSIS"
              : "BAJA POSIBILIDAD"}
          </span>
        </div>

        {/* Antibiotic Dose */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="text-slate-400 block font-medium text-[10px] uppercase">
            Antibiótico Calculado
          </span>
          <div className="font-extrabold text-sky-950 flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>{caso.tratamiento.antibioticoPrincipal}</span>
          </div>
          <div className="text-slate-700 font-bold text-sm">
            {caso.paciente.pesoKg
              ? `${caso.tratamiento.dosisMgPrincipal} mg IV`
              : "Ingrese peso (kg)"}
          </div>
        </div>

        {/* Vasoactive Dose */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="text-slate-400 block font-medium text-[10px] uppercase">
            Inotrópico / Vasopresor
          </span>
          <div className="font-extrabold text-slate-900 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {caso.tratamiento.vasoactivo} ({caso.tratamiento.dosisVasoactivoMcgKgMin} mcg/kg/min)
            </span>
          </div>
          <div className="text-sky-900 font-bold">
            Infusión Met. A: {caso.paciente.pesoKg ? `${caso.tratamiento.velocidadInfusionMetodoA} ml/hr` : "—"}
          </div>
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={onReclasificarChoqueDOM}
          className="w-full bg-[#c23326] hover:bg-red-800 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reclasificar Choque/DOM</span>
        </button>

        <button
          onClick={() => onIrAPaso(8)}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
        >
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Ver Resumen & Exportar PDF</span>
        </button>
      </div>
    </div>
  );
};

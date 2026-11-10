import React, { useState, useEffect } from "react";
import { PacienteRegistro, CRITERIOS_TAMIZAJE_SEPSIS } from "../types";
import { VoiceDictationButton } from "./VoiceDictationButton";
import {
  Clock,
  ArrowRight,
  User,
  FileText,
  AlertTriangle,
  Zap,
  Check,
  CheckCircle2,
  Activity,
  ShieldAlert,
} from "lucide-react";

interface Fase1TriageProps {
  pacienteEnEdicion: Partial<PacienteRegistro>;
  onGuardarYPasaAFase2: (datos: {
    identificacionPaciente: string;
    criteriosTamizaje: boolean[];
    puntajeTamizaje: number;
    categoriaTriage: 1 | 2 | 3;
    categoriaTriageLabel: string;
    diagnosticoTriage: string;
    tiempoFase1Segundos: number;
  }) => void;
  onVolverAlMenu: () => void;
}

export const Fase1Triage: React.FC<Fase1TriageProps> = ({
  pacienteEnEdicion,
  onGuardarYPasaAFase2,
  onVolverAlMenu,
}) => {
  const [identificacion, setIdentificacion] = useState<string>(
    pacienteEnEdicion.identificacionPaciente || ""
  );

  // 8 criteria checklist: true / false for each
  const [criterios, setCriterios] = useState<boolean[]>(() => {
    if (pacienteEnEdicion.criteriosTamizaje && pacienteEnEdicion.criteriosTamizaje.length === 8) {
      return [...pacienteEnEdicion.criteriosTamizaje];
    }
    return [false, false, false, false, false, false, false, false];
  });

  const [diagnosticoTriage, setDiagnosticoTriage] = useState<string>(
    pacienteEnEdicion.diagnosticoTriage || ""
  );

  // Big visible timer that starts as soon as we enter Phase 1
  const [segundosTranscurridos, setSegundosTranscurridos] = useState<number>(
    pacienteEnEdicion.tiempoFase1Segundos || 0
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosTranscurridos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const toggleCriterio = (index: number) => {
    setCriterios((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  // Score calculation: 1 point per selected criterion
  const sumatoriaPuntos = criterios.reduce((acc, curr) => acc + (curr ? 1 : 0), 0);

  // Determine Category based on user rule:
  // < 2 -> Categoría 1: BAJA POSIBILIDAD DE SEPSIS (Verde - imagen 2)
  // 2 o 3 -> Categoría 2: ALERTA DE SEPSIS (SIN DOMᵃ) (Amarillo - imagen 3)
  // > 3 -> Categoría 3: ALERTA CHOQUE SEPTICOᵇ O DOMᵃ (Rosado/Rojo - imagen 4)
  let categoria: 1 | 2 | 3 = 1;
  let categoriaLabel = "BAJA POSIBILIDAD DE SEPSIS";

  if (sumatoriaPuntos >= 4) {
    categoria = 3;
    categoriaLabel = "ALERTA CHOQUE SEPTICOᵇ O DOMᵃ";
  } else if (sumatoriaPuntos >= 2) {
    categoria = 2;
    categoriaLabel = "ALERTA DE SEPSIS (SIN DOMᵃ)";
  } else {
    categoria = 1;
    categoriaLabel = "BAJA POSIBILIDAD DE SEPSIS";
  }

  // Validation: Identification required
  const identificacionValida = identificacion.trim().length >= 2;

  const handlePasarAFase2 = () => {
    if (!identificacionValida) return;

    // Auto-generate summary for triage notes if empty
    const diagnosticoFinal = diagnosticoTriage.trim() ||
      `Tamizaje Triage: ${sumatoriaPuntos}/8 puntos (${categoriaLabel}). ${criterios
        .map((c, i) => (c ? CRITERIOS_TAMIZAJE_SEPSIS[i] : null))
        .filter(Boolean)
        .join(", ")}`;

    onGuardarYPasaAFase2({
      identificacionPaciente: identificacion.trim(),
      criteriosTamizaje: criterios,
      puntajeTamizaje: sumatoriaPuntos,
      categoriaTriage: categoria,
      categoriaTriageLabel: categoriaLabel,
      diagnosticoTriage: diagnosticoFinal,
      tiempoFase1Segundos: segundosTranscurridos,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlMenu}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Volver al inicio
        </button>

        <span className="text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
          Ruta Prioritaria · Fase 1 de 3
        </span>
      </div>

      {/* HEADER: FASE 1 TRIAGE + BIG VISIBLE CHRONOMETER */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Triage Asistencial · Recepción Inmediata
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              FASE 1: TRIAGE
            </h2>
            <p className="text-xs text-sky-200">
              Ingrese la identificación del paciente y marque la lista de chequeo de Tamizaje de Sepsis.
            </p>
          </div>

          {/* CRONÓMETRO DIGITAL VISIBLE Y GRANDE */}
          <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 text-center min-w-[200px] shadow-lg">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              Tiempo en Fase 1
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-400 tracking-widest mt-1">
              {formatearTiempo(segundosTranscurridos)}
            </div>
            <span className="text-[10px] text-slate-300 block mt-1">
              Control de tiempo en vivo
            </span>
          </div>
        </div>
      </div>

      {/* GUÍAS CLÍNICAS INSTITUCIONALES (IMAGEN 2 Y 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GUÍA 1: CRITERIOS DE SOSPECHA DE SEPSIS (IMAGEN 2) */}
        <div className="bg-white border-2 border-red-600 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 border-b border-red-100 pb-2">
              <span className="text-red-600 font-extrabold mr-1">*</span>
              Sospecha sepsis (cualquier criterio)
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold leading-none mt-1">•</span>
                <span>
                  <strong>Hipotermia (&lt;36°C) o Fiebre</strong> (≥38.5°C o ≥38°C en dos tomas separadas o sostenida 1 hora)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold leading-none mt-1">•</span>
                <span>
                  <strong>Niño sin fiebre</strong> pero con sospecha de sepsis con un foco específico
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold leading-none mt-1">•</span>
                <span>
                  <strong>Taquicardia</strong>
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-red-700 font-bold text-right">
            Guía Clínica HILA · Sospecha
          </div>
        </div>

        {/* GUÍA 2: EVALUACIÓN Y ROLES (IMAGEN 3) */}
        <div className="bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-3">
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-800">
            <div>
              <span className="font-black text-slate-950">¿Quién? </span>
              <span className="text-slate-700">Médico a cargo o residente y enfermero.</span>
            </div>
            <div>
              <span className="font-black text-slate-950">¿Qué evaluar? </span>
              <span className="text-slate-700 leading-relaxed">
                Signos vitales; Examen físico y evaluación clínica de disfunción órganos; cambios conciencia, alteración en la respiración; ritmo, pulso, perfusión por cambios en piel; gasto urinario, <strong>EVAT</strong> (si disponible)
              </span>
            </div>
            <div>
              <span className="font-black text-slate-950">¿Qué revisar? </span>
              <span className="text-slate-700 leading-relaxed">
                Neutrófilos recientes; diagnóstico primario, fase quimioterapia y otro tratamiento, aislamientos.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-center">
            <span className="text-red-600 font-black text-sm sm:text-base tracking-wide uppercase">
              Objetivo: diagnosticar sepsis y clasificar
            </span>
          </div>
        </div>
      </div>

      {/* PATIENT IDENTIFICATION CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-sky-600" />
            1. Identificación del Paciente
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingrese el número de documento de identidad (Registro Civil, Tarjeta de Identidad, Cédula o Historia Clínica).
          </p>
        </div>

        {/* CONTENEDOR DE IDENTIFICACIÓN */}
        <div className="bg-slate-50 border-2 border-slate-200 focus-within:border-sky-500 rounded-2xl p-5 transition-all">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
            <span>Número de Identificación del Paciente</span>
            <span className="text-[10px] text-red-500 font-bold">* Obligatorio</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            placeholder="Ingrese número de identificación o documento..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 outline-none"
            autoFocus
          />
          <span className="text-[11px] text-slate-500 block mt-1.5">
            Permite ingresar números de identificación, TI, RC o código de historia clínica.
          </span>
        </div>

        {/* 2. TABLA DE TAMIZAJE SEPSIS CON CASILLA PARA CLIQUEAR Y VISTO BUENO VERDE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>2. Tamizaje Sepsis Pediátrica</span>
            </h3>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
              Sumatoria: {sumatoriaPuntos} / 8 pts
            </span>
          </div>

          {/* TABLA EXACTA BASADA EN IMAGEN 1 */}
          <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-md bg-white">
            {/* Header de la tabla */}
            <div className="bg-white border-b-2 border-slate-900 p-3.5 text-center text-slate-900">
              <div className="font-black text-sm sm:text-base leading-tight">
                **Tamizaje Sepsis (positivo si ≥ 2) o PEWS/EVAT ≥ 3
              </div>
              <div className="text-xs font-bold text-slate-700">
                (Si el hospital está avalado)
              </div>
            </div>

            {/* Filas de los 8 criterios */}
            <div className="divide-y divide-slate-300">
              {CRITERIOS_TAMIZAJE_SEPSIS.map((criterio, idx) => {
                const seleccionado = criterios[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCriterio(idx)}
                    className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors select-none ${
                      seleccionado
                        ? "bg-emerald-50/80 hover:bg-emerald-100/70"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-300">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs sm:text-sm ${
                          seleccionado
                            ? "font-black text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {criterio}
                      </span>
                    </div>

                    {/* CASILLA PARA CLIQUEAR CON VISTO BUENO VERDE (1 PUNTO) */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold ${
                          seleccionado ? "text-emerald-700 font-black" : "text-slate-400"
                        }`}
                      >
                        {seleccionado ? "+1 pto" : "0 pto"}
                      </span>
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                          seleccionado
                            ? "bg-emerald-600 border-emerald-700 text-white shadow-md scale-105"
                            : "bg-white border-slate-400 text-transparent hover:border-emerald-500"
                        }`}
                      >
                        <Check className="w-6 h-6 stroke-[3.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fila final de sumatoria */}
            <div className="bg-slate-100 border-t-2 border-slate-900 p-4 flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm uppercase">
                Sumatoria de Puntos Seleccionados:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {sumatoriaPuntos}
                </span>
                <span className="text-xs font-bold text-slate-500">/ 8</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTÓN/BANNER GRANDE DE CATEGORÍA SEGÚN SUMATORIA */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
            Resultado de Clasificación en Triage:
          </label>

          {/* CATEGORÍA 1: < 2 PUNTOS -> BOTÓN VERDE (IMAGEN 2) */}
          {sumatoriaPuntos < 2 && (
            <div className="w-full bg-[#7ecc61] border-2 border-[#5ba83e] p-5 sm:p-6 rounded-2xl text-center shadow-lg transition-all animate-fadeIn">
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                BAJA POSIBILIDAD DE SEPSIS
              </h4>
              <p className="text-xs font-bold text-slate-900 mt-1">
                Sumatoria: {sumatoriaPuntos} / 8 puntos (Puntaje &lt; 2)
              </p>
            </div>
          )}

          {/* CATEGORÍA 2: 2 O 3 PUNTOS -> BOTÓN AMARILLO (IMAGEN 3) */}
          {(sumatoriaPuntos === 2 || sumatoriaPuntos === 3) && (
            <div className="w-full bg-[#f4b400] border-2 border-[#d99b00] p-5 sm:p-6 rounded-2xl text-center shadow-lg transition-all animate-fadeIn">
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                ALERTA DE SEPSIS (SIN DOMᵃ)
              </h4>
              <p className="text-xs font-bold text-slate-950 mt-1">
                Sumatoria: {sumatoriaPuntos} / 8 puntos (Puntaje 2 o 3)
              </p>
            </div>
          )}

          {/* CATEGORÍA 3: > 3 PUNTOS -> BOTÓN ROSADO TIPO ROJO (IMAGEN 4) */}
          {sumatoriaPuntos > 3 && (
            <div className="w-full bg-[#ff9999] border-2 border-[#e65c5c] p-5 sm:p-6 rounded-2xl text-center shadow-lg transition-all animate-fadeIn">
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                ALERTA CHOQUE SEPTICOᵇ O DOMᵃ
              </h4>
              <p className="text-xs font-bold text-slate-950 mt-1">
                Sumatoria: {sumatoriaPuntos} / 8 puntos (Puntaje &gt; 3)
              </p>
            </div>
          )}
        </div>

        {/* NOTAS O DIAGNÓSTICO ADICIONAL CON DICTADO POR VOZ (OPCIONAL) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              Observaciones de Triage / Dictado por Voz (Opcional):
            </span>
            <VoiceDictationButton
              onTranscript={(texto) => setDiagnosticoTriage(texto)}
              valorActual={diagnosticoTriage}
              label="Dictar notas"
            />
          </div>
          <textarea
            rows={2}
            value={diagnosticoTriage}
            onChange={(e) => setDiagnosticoTriage(e.target.value)}
            placeholder="Observaciones clínicas adicionales (opcional, se autogenera con los criterios seleccionados)..."
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* BOTÓN GRANDE AL FINAL: "PASAR A FASE 2" Y MENSAJE "RÁPIDO QUE EL TIEMPO ES VIDA" */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-3">
          <button
            type="button"
            onClick={handlePasarAFase2}
            disabled={!identificacionValida}
            className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-xl ${
              identificacionValida
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white hover:brightness-110 cursor-pointer hover:shadow-emerald-900/30 active:scale-[0.99]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            }`}
          >
            <span>PASAR A FASE 2 (MÉDICO DE URGENCIAS)</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* MENSAJE OBLIGATORIO DESTACADO */}
          <div className="py-1">
            <span className="text-base sm:text-lg font-black text-red-600 uppercase tracking-wide animate-pulse inline-flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¡Rápido que el tiempo es vida!
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </span>
          </div>

          {!identificacionValida && (
            <p className="text-xs text-amber-600 font-semibold">
              ⚠️ Ingrese el número de identificación del paciente para habilitar la transferencia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

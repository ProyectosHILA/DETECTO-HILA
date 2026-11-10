import React, { useState, useEffect } from "react";
import {
  PacienteRegistro,
  CRITERIOS_TAMIZAJE_SEPSIS,
  FormularioEquipoSepsis,
} from "../types";
import { FormularioEquipoSepsisPdf } from "./FormularioEquipoSepsisPdf";
import { VoiceDictationButton } from "./VoiceDictationButton";
import {
  Clock,
  ArrowRight,
  User,
  FileText,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Activity,
  Check,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

interface Fase2MedicoUrgenciasProps {
  paciente: PacienteRegistro;
  onReportarADetecto: (datos: {
    identificacionPaciente: string;
    diagnosticoUrgencias: string;
    aplicaSepsis: boolean;
    aprobadoUrgencias: boolean;
    motivoDescarte?: string;
    formularioEquipoSepsis?: FormularioEquipoSepsis;
    tiempoFase2Segundos: number;
    tiempoTotalSegundos: number;
  }) => void;
  onVolverAlMenu: () => void;
}

export const Fase2MedicoUrgencias: React.FC<Fase2MedicoUrgenciasProps> = ({
  paciente,
  onReportarADetecto,
  onVolverAlMenu,
}) => {
  const [aprobado, setAprobado] = useState<boolean>(
    paciente.aprobadoUrgencias !== undefined ? paciente.aprobadoUrgencias : true
  );
  const [diagnosticoUrgencias, setDiagnosticoUrgencias] = useState<string>(
    paciente.diagnosticoUrgencias || ""
  );
  const [motivoDescarte, setMotivoDescarte] = useState<string>(
    paciente.motivoDescarte || ""
  );

  // Digitalized PDF Form (Lista de Chequeo 1 - Evaluación por Equipo de Sepsis)
  const [formulario, setFormulario] = useState<FormularioEquipoSepsis>(
    paciente.formularioEquipoSepsis || {
      dxOncologico: "",
      faseQuimioterapia: "",
      signosVitales: {
        temperatura: "",
        fc: "",
        fr: "",
        pas: "",
        pam: "",
        satO2: "",
        fio2: "21%",
      },
      evat: {
        centroAvalado: null,
        puntaje: "",
      },
      examenFisico: {
        glasgowTotal: "15",
        glasgowO: "4",
        glasgowV: "5",
        glasgowM: "6",
        llenadoCapilar: "normal",
        colorPiel: "rosada",
        dificultadRespiratoria: "no",
        auscultacion: "normal",
        gastoUrinario: "mayor_05",
        extremidades: "calientes",
        pulsos: "normales",
        cateteres: {
          periferico: "normal",
          central: "normal",
        },
        focoInfeccioso: {
          presente: false,
          especificar: "",
        },
      },
      paraclinicos: {},
      horaInicio: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      medicoFirma: "Dr. Médico Urgencias",
      enfermeroFirma: "Enf. Turno",
    }
  );

  // Time in phase 2 starts tracking
  const [segundosFase2, setSegundosFase2] = useState<number>(
    paciente.tiempoFase2Segundos || 0
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosFase2((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const tiempoFase1 = paciente.tiempoFase1Segundos || 0;
  const tiempoTotalAcumulado = tiempoFase1 + segundosFase2;

  // Criteria evaluated in Triage
  const criterios = paciente.criteriosTamizaje || [false, false, false, false, false, false, false, false];
  const puntaje = paciente.puntajeTamizaje ?? criterios.reduce((acc, c) => acc + (c ? 1 : 0), 0);
  const categoria = paciente.categoriaTriage || (puntaje >= 4 ? 3 : puntaje >= 2 ? 2 : 1);

  // Strict validation: Must write diagnostic / approval reason
  const camposLlenos =
    diagnosticoUrgencias.trim().length > 0 ||
    (!aprobado && motivoDescarte.trim().length > 0);

  const handleEnviar = () => {
    if (!camposLlenos) return;
    onReportarADetecto({
      identificacionPaciente: paciente.identificacionPaciente,
      diagnosticoUrgencias: diagnosticoUrgencias.trim(),
      aplicaSepsis: aprobado,
      aprobadoUrgencias: aprobado,
      motivoDescarte: !aprobado ? motivoDescarte.trim() : undefined,
      formularioEquipoSepsis: formulario,
      tiempoFase2Segundos: segundosFase2,
      tiempoTotalSegundos: tiempoTotalAcumulado,
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
          ← Volver a lista de urgencias
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
            {paciente.codigo}
          </span>
          <span className="text-xs font-extrabold uppercase bg-sky-100 text-sky-900 px-3 py-1 rounded-full border border-sky-300">
            Fase 2: Médico de Urgencias
          </span>
        </div>
      </div>

      {/* HEADER: FASE 2 + BIG VISIBLE CHRONOMETER WITH PRIOR TIMES BELOW */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              Validación y Decisión Médica
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              FASE 2: MÉDICO DE URGENCIAS
            </h2>
            <p className="text-xs text-sky-200">
              Revise la identificación, el puntaje de tamizaje (8 criterios) y apruebe en la cápsula la categoría para Fase 3.
            </p>
          </div>

          {/* CRONÓMETRO VISIBLE Y GRANDE + TIEMPO FASE 1 DEBAJO */}
          <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 border-2 border-sky-400/60 rounded-2xl p-4 sm:p-5 text-center min-w-[240px] shadow-lg space-y-2">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              Tiempo en Fase 2 (En Vivo)
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-sky-300 tracking-widest">
              {formatearTiempo(segundosFase2)}
            </div>

            {/* TIEMPO OCUPADO EN FASE 1 DEBAJO DEL CRONÓMETRO */}
            <div className="pt-2 border-t border-sky-800/80 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Tiempo ocupado en Fase 1:</span>
                <span className="font-mono font-bold text-emerald-400 bg-sky-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {formatearTiempo(tiempoFase1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Tiempo total transcurrido:</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatearTiempo(tiempoTotalAcumulado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT IDENTIFICATION CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-800 rounded-2xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Número de Identificación del Paciente
              </span>
              <h3 className="text-2xl font-mono font-black text-slate-900">
                {paciente.identificacionPaciente || "Sin identificación"}
              </h3>
            </div>
          </div>

          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border self-start sm:self-auto">
            Código Caso: {paciente.codigo}
          </span>
        </div>

        {/* 1. CATEGORÍA DE TRIAGE QUE QUEDÓ (1, 2 O 3) */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Categoría Asignada en Triage:
          </label>

          {categoria === 1 && (
            <div className="w-full bg-[#7ecc61] border-2 border-[#5ba83e] p-4 sm:p-5 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block mb-0.5">
                Categoría 1 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                BAJA POSIBILIDAD DE SEPSIS
              </h4>
              <span className="text-xs font-bold text-slate-900 mt-1 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos (&lt; 2)
              </span>
            </div>
          )}

          {categoria === 2 && (
            <div className="w-full bg-[#f4b400] border-2 border-[#d99b00] p-4 sm:p-5 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block mb-0.5">
                Categoría 2 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                ALERTA DE SEPSIS (SIN DOMᵃ)
              </h4>
              <span className="text-xs font-bold text-slate-950 mt-1 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos (2 o 3)
              </span>
            </div>
          )}

          {categoria === 3 && (
            <div className="w-full bg-[#ff9999] border-2 border-[#e65c5c] p-4 sm:p-5 rounded-2xl text-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block mb-0.5">
                Categoría 3 de Triage
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-black tracking-wide">
                ALERTA CHOQUE SEPTICOᵇ O DOMᵃ
              </h4>
              <span className="text-xs font-bold text-slate-950 mt-1 block">
                Puntaje de Tamizaje: {puntaje} / 8 puntos (&gt; 3)
              </span>
            </div>
          )}
        </div>

        {/* 2. LOS 8 PUNTOS EN LA CALIFICACIÓN QUE QUEDARON */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Calificación de los 8 Criterios de Tamizaje:</span>
            </h4>
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border">
              Total: {puntaje} / 8 puntos
            </span>
          </div>

          <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50">
            <div className="divide-y divide-slate-200">
              {CRITERIOS_TAMIZAJE_SEPSIS.map((crit, i) => {
                const activo = Boolean(criterios[i]);
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 text-xs ${
                      activo ? "bg-emerald-50/70" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span className={activo ? "font-black text-slate-900" : "text-slate-600"}>
                        {crit}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {activo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Positivo (1 pto)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5">
                          No presente (0)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FORMULARIO OFICIAL DIGITALIZADO: EVALUACIÓN POR EQUIPO DE SEPSIS (PDF) */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <h4 className="text-sm font-black uppercase text-[#074c5d] tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#007b8f]" />
                <span>Formulario Oficial Clínico: Evaluación por Equipo de Sepsis (PDF)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Lista de chequeo digitalizada idéntica a la guía de bolsillo institucional (≤ 10 min desde tamizaje positivo).
              </p>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#007b8f] bg-[#e4f4f7] px-3 py-1 rounded-full border border-[#007b8f]/40">
              Protocolo DETECTO©
            </span>
          </div>

          <FormularioEquipoSepsisPdf
            data={formulario}
            onChange={setFormulario}
            soloLectura={false}
          />
        </div>

        {/* 3. CÁPSULA DE DECISIÓN DEL MÉDICO DE URGENCIAS */}
        <div className="bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50 border-2 border-sky-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-sky-200 pb-3">
            <h4 className="text-sm font-black uppercase text-sky-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-700" />
              <span>Cápsula de Decisión del Médico de Urgencias</span>
            </h4>
            <span className="text-xs font-bold text-sky-800 bg-sky-200/80 px-2.5 py-0.5 rounded-full">
              Paso Crítico para Fase 3
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ¿Aprueba la categoría de triage para continuar el paciente a Fase 3 (Equipo DETECTO)?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAprobado(true)}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between font-black text-xs sm:text-sm transition-all ${
                  aprobado
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SÍ APRUEBO CATEGORÍA</span>
                </span>
                <span className="text-[11px] opacity-90">Continuar a Fase 3</span>
              </button>

              <button
                type="button"
                onClick={() => setAprobado(false)}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between font-black text-xs sm:text-sm transition-all ${
                  !aprobado
                    ? "bg-amber-600 text-white border-amber-700 shadow-md"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>NO APRUEBO (DESCARTAR)</span>
                </span>
                <span className="text-[11px] opacity-90">Cierre / No Sepsis</span>
              </button>
            </div>
          </div>

          {/* ÁREA DE TEXTO CON DICTADO POR VOZ */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-700" />
                <span>
                  {aprobado
                    ? "Diagnóstico Médico de Urgencias y Justificación Clínica:"
                    : "Motivo y Justificación de No Aprobación / Descarte:"}
                </span>
                <span className="text-[10px] text-red-500 font-bold">* Obligatorio</span>
              </label>

              <VoiceDictationButton
                onTranscript={(texto) => setDiagnosticoUrgencias(texto)}
                valorActual={diagnosticoUrgencias}
                label="Dictar diagnóstico médico"
              />
            </div>

            <textarea
              rows={3}
              value={diagnosticoUrgencias}
              onChange={(e) => setDiagnosticoUrgencias(e.target.value)}
              placeholder="Escriba o dicte por voz el diagnóstico del médico de urgencias: estado cardiovascular, órganos afectados, justificación de la categoría aprobada y conducta inmediata..."
              className="w-full bg-white border border-sky-300 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-600 leading-relaxed shadow-inner"
            />
          </div>
        </div>

        {/* BOTÓN GRANDE AL FINAL */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-3">
          <button
            type="button"
            onClick={handleEnviar}
            disabled={!camposLlenos}
            className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-xl ${
              camposLlenos
                ? "bg-gradient-to-r from-sky-700 via-blue-700 to-[#0f2b5c] text-white hover:brightness-110 cursor-pointer hover:shadow-sky-900/30 active:scale-[0.99]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            }`}
          >
            <span>
              {aprobado
                ? "REPORTAR A DETECTO (PASAR A FASE 3)"
                : "FINALIZAR CASO COMO NO APROBADO"}
            </span>
            <ArrowRight className="w-6 h-6" />
          </button>

          {!camposLlenos && (
            <p className="text-xs text-amber-600 font-semibold">
              ⚠️ Diligencie su diagnóstico o justificación médica para habilitar el reporte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

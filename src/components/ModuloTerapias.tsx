import React, { useState, useEffect, useRef } from "react";
import { PacienteRegistro, LaboratoriosDOMData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import {
  Wind,
  Calculator,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  Inbox,
  Timer,
} from "lucide-react";

interface ModuloTerapiasProps {
  pacientesActivosCat3: PacienteRegistro[];
  onActualizarPaciente: (id: string, patch: Partial<PacienteRegistro>) => Promise<void>;
  onVolverAlInicio: () => void;
}

export const ModuloTerapias: React.FC<ModuloTerapiasProps> = ({
  pacientesActivosCat3,
  onActualizarPaciente,
  onVolverAlInicio,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ahora, setAhora] = useState<number>(Date.now());
  const [guardando, setGuardando] = useState<boolean>(false);

  const pacienteSeleccionado =
    pacientesActivosCat3.find((p) => p.id === selectedId) || null;

  const [gasesPaFiO2, setGasesPaFiO2] = useState<NonNullable<LaboratoriosDOMData["gasesPaFiO2"]>>(
    pacienteSeleccionado?.laboratorios?.gasesPaFiO2 || {}
  );
  const [spFiO2, setSpFiO2] = useState<NonNullable<LaboratoriosDOMData["spFiO2"]>>(
    pacienteSeleccionado?.laboratorios?.spFiO2 || {}
  );

  const prevPacIdRef = useRef<string | null>(null);
  const dirtyRef = useRef<boolean>(false);
  const lastSnapRef = useRef<string>("");

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pacienteSeleccionado) {
      prevPacIdRef.current = null;
      dirtyRef.current = false;
      lastSnapRef.current = "";
      setGasesPaFiO2({});
      setSpFiO2({});
      return;
    }

    const currObj = {
      gasesPaFiO2: pacienteSeleccionado.laboratorios?.gasesPaFiO2 || {},
      spFiO2: pacienteSeleccionado.laboratorios?.spFiO2 || {},
    };
    const snap = JSON.stringify(currObj);

    if (prevPacIdRef.current !== pacienteSeleccionado.id) {
      prevPacIdRef.current = pacienteSeleccionado.id;
      dirtyRef.current = false;
      lastSnapRef.current = snap;
      // Pre-llenar SpO2 si viene desde Signos Vitales de Fase 1 y aún no hay SpO2 en Terapias
      const spInit = { ...currObj.spFiO2 };
      if (!spInit.spo2 && pacienteSeleccionado.vitalesIngreso?.satO2) {
        spInit.spo2 = pacienteSeleccionado.vitalesIngreso.satO2;
      }
      setGasesPaFiO2(currObj.gasesPaFiO2);
      setSpFiO2(spInit);
      return;
    }

    if (!dirtyRef.current && snap !== lastSnapRef.current) {
      lastSnapRef.current = snap;
      setGasesPaFiO2(currObj.gasesPaFiO2);
      setSpFiO2(currObj.spFiO2);
    }
  }, [pacienteSeleccionado]);

  const calcPaFiO2 = (pao2Str: string, fio2Str: string) => {
    const pao2 = parseFloat(pao2Str);
    let fio2 = parseFloat(fio2Str);
    if (!isNaN(pao2) && !isNaN(fio2) && fio2 > 0) {
      if (fio2 > 1) fio2 = fio2 / 100;
      return (pao2 / fio2).toFixed(1);
    }
    return "";
  };

  const calcSpFiO2 = (spo2Str: string, fio2Str: string) => {
    const spo2 = parseFloat(spo2Str);
    let fio2 = parseFloat(fio2Str);
    if (!isNaN(spo2) && !isNaN(fio2) && fio2 > 0) {
      if (fio2 > 1) fio2 = fio2 / 100;
      return (spo2 / fio2).toFixed(1);
    }
    return "";
  };

  const updateGases = (
    field: "checked" | "pao2" | "fio2" | "resultado" | "fechaHora",
    val: any
  ) => {
    dirtyRef.current = true;
    setGasesPaFiO2((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "pao2" || field === "fio2") {
        const calc = calcPaFiO2(next.pao2 || "", next.fio2 || "");
        if (calc) next.resultado = calc;
      }
      if ((field === "pao2" || field === "fio2") && (next.pao2 || next.fio2)) {
        next.checked = true;
      }
      return next;
    });
  };

  const updateSpFi = (
    field: "checked" | "spo2" | "fio2" | "resultado" | "fechaHora",
    val: any
  ) => {
    dirtyRef.current = true;
    setSpFiO2((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "spo2" || field === "fio2") {
        const calc = calcSpFiO2(next.spo2 || "", next.fio2 || "");
        if (calc) next.resultado = calc;
      }
      if ((field === "spo2" || field === "fio2") && (next.spo2 || next.fio2)) {
        next.checked = true;
      }
      return next;
    });
  };

  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(Math.max(0, totalSeg) / 60);
    const segs = Math.max(0, totalSeg) % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const handleGuardarTerapias = async () => {
    if (!pacienteSeleccionado || guardando) return;
    setGuardando(true);
    try {
      const ahoraTs = Date.now();
      const refTs =
        pacienteSeleccionado.tiemposSubmodulos?.timestampValidacionTriage ||
        pacienteSeleccionado.timestampPasoFase2 ||
        pacienteSeleccionado.timestampInicio ||
        ahoraTs;

      const updatedLabs: LaboratoriosDOMData = {
        ...(pacienteSeleccionado.laboratorios || {}),
        gasesPaFiO2,
        spFiO2,
      };

      dirtyRef.current = false;
      lastSnapRef.current = JSON.stringify({ gasesPaFiO2, spFiO2 });

      await onActualizarPaciente(pacienteSeleccionado.id, {
        laboratorios: updatedLabs,
        estadosModulos: {
          fase1Validada: pacienteSeleccionado.estadosModulos?.fase1Validada ?? false,
          checklist1Completado: pacienteSeleccionado.estadosModulos?.checklist1Completado ?? false,
          laboratoriosCompletado:
            pacienteSeleccionado.estadosModulos?.laboratoriosCompletado ?? false,
          anexoCompletado: pacienteSeleccionado.estadosModulos?.anexoCompletado ?? false,
          vasopresoresCompletado:
            pacienteSeleccionado.estadosModulos?.vasopresoresCompletado ?? false,
          terapiasCompletado: true,
        },
        tiemposSubmodulos: {
          ...(pacienteSeleccionado.tiemposSubmodulos || {}),
          timestampTerapias: ahoraTs,
          terapiasSegundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
        },
      });

      setSelectedId(null);
    } finally {
      setGuardando(false);
    }
  };

  const pendientes = pacientesActivosCat3.filter(
    (p) => !p.estadosModulos?.terapiasCompletado
  );
  const evaluados = pacientesActivosCat3.filter(
    (p) => p.estadosModulos?.terapiasCompletado
  );

  if (pacienteSeleccionado) {
    const segsDesdeReporte = Math.max(
      0,
      Math.floor((ahora - (pacienteSeleccionado.timestampInicio || ahora)) / 1000)
    );
    const metaSegs = 2700; // Cat 3 siempre 45 min
    const segsRestantes = Math.max(0, metaSegs - segsDesdeReporte);
    const minsRestantes = Math.floor(segsRestantes / 60);
    const segsModulo = segsRestantes % 60;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a bandeja de TERAPIAS</span>
          </button>

          <span className="text-xs font-black uppercase bg-cyan-100 text-cyan-950 border border-cyan-400 px-3 py-1 rounded-full">
            Módulo TERAPIAS · Clasificación Sistema Respiratorio (Solo Cat 3)
          </span>
        </div>

        {/* Header Paciente + Cronómetro 45 min */}
        <div className="bg-[#083344] border-2 border-cyan-600 rounded-3xl p-5 sm:p-6 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-950/60 text-cyan-200 px-2.5 py-0.5 rounded-lg border border-cyan-500/50">
                  {pacienteSeleccionado.codigo}
                </span>
                <span className="text-xs font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded-lg">
                  {pacienteSeleccionado.categoriaTriageValidadaLabel ||
                    pacienteSeleccionado.categoriaTriageLabel ||
                    "ALERTA CHOQUE SEPTICOᵇ O DOMᵃ"}
                </span>
              </div>

              <div>
                {pacienteSeleccionado.nombre && (
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {pacienteSeleccionado.nombre}
                  </h2>
                )}
                <p className="text-sm font-mono font-bold text-cyan-200">
                  Cédula / ID: {pacienteSeleccionado.identificacionPaciente || pacienteSeleccionado.codigo}
                  {pacienteSeleccionado.vitalesIngreso?.satO2 && (
                    <span className="ml-3 text-xs bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      SatO₂ Ingreso: {pacienteSeleccionado.vitalesIngreso.satO2}%
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/90 border-2 border-cyan-400/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[300px] shadow-lg">
              <div className="text-center sm:border-r sm:border-slate-800 sm:pr-3">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Tiempo desde que se reportó
                </span>
                <div className="text-3xl font-mono font-black text-cyan-300 tracking-widest mt-1 tabular-nums">
                  {formatearTiempo(segsDesdeReporte)}
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-rose-400" />
                  Meta 45 Min (Choque Séptico)
                </span>
                <div
                  className={`text-3xl font-mono font-black tracking-widest mt-1 tabular-nums ${
                    segsRestantes <= 600 ? "text-red-400 animate-pulse" : "text-amber-300"
                  }`}
                >
                  {formatearTiempo(segsRestantes)}
                </div>
                <span className="text-[11px] font-black block mt-1 text-sky-200">
                  {segsRestantes === 0
                    ? "Le queda 00 min 00 seg"
                    : `Le queda ${minsRestantes} min ${segsModulo.toString().padStart(2, "0")} seg`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CALCULADORAS EXACTAS DE LA IMAGEN: PaFiO2 Y SpFiO2 (SaFiO2) */}
        <div className="bg-[#f7fcfd] border-2 border-[#007b8f] rounded-2xl p-5 shadow-xl space-y-4 text-slate-900 text-xs">
          <h3 className="font-black text-sm uppercase text-[#074c5d] tracking-wider flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#007b8f]" />
            <span>CLASIFICACIÓN SISTEMA RESPIRATORIO · CÁLCULO AUTOMÁTICO PAFIO₂ Y SPFIO₂ (SAFIO₂)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calculadora PaFiO2 */}
            <div className="bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(gasesPaFiO2.checked)}
                    onChange={(e) => updateGases("checked", e.target.checked)}
                    className="accent-[#007b8f] w-4 h-4 shrink-0"
                  />
                  <span>Gases Arteriales: PaFiO₂ = PaO₂ / FiO₂</span>
                </label>
                <FormattedTimeInput
                  mode="time"
                  value={gasesPaFiO2.fechaHora || ""}
                  onValueChange={(val) => updateGases("fechaHora", val)}
                  placeholder="Hora (hh:mm)"
                  className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 text-center rounded font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    PaO₂ (mmHg)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={gasesPaFiO2.pao2 || ""}
                    onChange={(e) => updateGases("pao2", e.target.value)}
                    placeholder="ej. 75"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    FiO₂ (0.21-1 o %)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={gasesPaFiO2.fio2 || ""}
                    onChange={(e) => updateGases("fio2", e.target.value)}
                    placeholder="ej. 0.40 o 40"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-black text-[#0b4d6c] block mb-1">
                    Resultado PaFiO₂
                  </span>
                  <input
                    type="text"
                    value={gasesPaFiO2.resultado || ""}
                    onChange={(e) => updateGases("resultado", e.target.value)}
                    placeholder="PaFiO₂"
                    className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-2 rounded-lg font-black text-center text-emerald-900 font-mono text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Calculadora SpFiO2 / SaFiO2 */}
            <div className="bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(spFiO2.checked)}
                    onChange={(e) => updateSpFi("checked", e.target.checked)}
                    className="accent-[#007b8f] w-4 h-4 shrink-0"
                  />
                  <span>Oximetría: SpFiO₂ (SaFiO₂) = SpO₂ / FiO₂</span>
                </label>
                <FormattedTimeInput
                  mode="time"
                  value={spFiO2.fechaHora || ""}
                  onValueChange={(val) => updateSpFi("fechaHora", val)}
                  placeholder="Hora (hh:mm)"
                  className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 text-center rounded font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    SpO₂ / SatO₂ (%)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={spFiO2.spo2 || ""}
                    onChange={(e) => updateSpFi("spo2", e.target.value)}
                    placeholder="ej. 94"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    FiO₂ (0.21-1 o %)
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={spFiO2.fio2 || ""}
                    onChange={(e) => updateSpFi("fio2", e.target.value)}
                    placeholder="ej. 0.21 o 21"
                    className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-2 rounded-lg font-bold text-center text-sm outline-none focus:ring-2 focus:ring-[#007b8f]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-black text-[#0b4d6c] block mb-1">
                    Resultado SpFiO₂
                  </span>
                  <input
                    type="text"
                    value={spFiO2.resultado || ""}
                    onChange={(e) => updateSpFi("resultado", e.target.value)}
                    placeholder="SpFiO₂"
                    className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-2 rounded-lg font-black text-center text-emerald-900 font-mono text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 border border-cyan-300 rounded-xl p-3 text-xs font-semibold text-cyan-950">
            <strong>Referencia Disfunción Respiratoria (DOM):</strong> PaFiO₂ &lt; 400 (o &lt; 300 con soporte) o SpFiO₂ &lt; 292 indica compromiso respiratorio agudo en Choque Séptico pediátrico. Al guardar, los resultados se reflejan automáticamente en <strong>Fase 2, Fase 3, Laboratorios y Anexo 2</strong>.
          </div>
        </div>

        {/* Botón Guardar y Sincronizar */}
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-700 font-semibold max-w-xl">
            <strong className="text-emerald-800 block text-sm">
              Sincronización Inmediata con Fase 2, Fase 3 y Anexo 2:
            </strong>
            Al guardar, los cálculos de PaFiO₂ y SpFiO₂ quedan registrados en la historia clínica del paciente y la alerta pendiente de Terapias se marca como atendida.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardarTerapias}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>
                {guardando ? "Guardando..." : "Guardar PaFiO₂ / SpFiO₂ y Sincronizar"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolverAlInicio}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Salir al inicio
        </button>

        <span className="text-xs font-black uppercase bg-cyan-100 text-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-400">
          Módulo TERAPIAS · Solo Categoría 3 (Choque Séptico)
        </span>
      </div>

      {/* Main Banner */}
      <div className="bg-[#083344] border-2 border-cyan-500/60 rounded-3xl p-6 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-cyan-400 text-slate-950 rounded-2xl shadow-lg">
            <Wind className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              TERAPIAS · Sistema Respiratorio (PaFiO₂ / SpFiO₂)
            </h2>
            <p className="text-xs text-cyan-100 mt-1 max-w-xl">
              Módulo exclusivo para pacientes clasificados en la categoría más grave: <strong>ALERTA CHOQUE SÉPTICO / DOM (Categoría 3)</strong>. Calcula automáticamente PaFiO₂ y SpFiO₂ (SaFiO₂) y sincroniza en vivo con Fase 2, Fase 3 y Laboratorios.
            </p>
          </div>
        </div>

        {pendientes.length > 0 && (
          <div className="bg-red-600 border border-red-400 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse self-start sm:self-auto shadow-lg">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{pendientes.length} Caso(s) Cat 3 Pendiente(s)</span>
          </div>
        )}
      </div>

      {/* Pendientes Cat 3 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-700" />
            <span>Pacientes Cat 3 (Alerta Choque Séptico) Pendientes de PaFiO₂ / SpFiO₂</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {pendientes.length} pendiente(s)
          </span>
        </div>

        {pendientes.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 rounded-full bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center border border-cyan-200">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                No hay pacientes en Alerta Choque Séptico (Categoría 3) pendientes en Terapias.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando ingrese o se reclasifique un paciente en Categoría 3 (Alerta Choque Séptico / DOM), aparecerá aquí automáticamente con su alarma.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map((p) => {
              const segsEspera = Math.max(0, Math.floor((ahora - (p.timestampInicio || ahora)) / 1000));
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group p-5 rounded-2xl border-2 border-red-300 hover:border-cyan-600 bg-rose-50/60 hover:bg-cyan-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="animate-pulse inline-flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full tabular-nums">
                        <Clock className="w-3 h-3" />
                        Choque Séptico · {formatearTiempo(segsEspera)}
                      </span>
                      <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded border border-[#e65c5c]">
                        Cat 3: CHOQUE / DOMᵃ ({p.puntajeTamizaje} pts)
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">
                      {p.nombre ? `${p.nombre} · ` : ""}
                      <span className="font-mono text-cyan-900">
                        ID: {p.identificacionPaciente || "Sin identificación"}
                      </span>
                    </h4>
                  </div>

                  <button
                    type="button"
                    className="bg-[#083344] hover:bg-cyan-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors shrink-0 group-hover:scale-105 cursor-pointer"
                  >
                    <span>Registrar PaFiO₂ / SpFiO₂</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Casos Cat 3 activos ya evaluados (por si requieren actualización de gases) */}
      {evaluados.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Casos Cat 3 Activos con Evaluación Respiratoria Guardada ({evaluados.length})</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {evaluados.map((p) => (
              <div
                key={p.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <span className="font-black text-slate-900">
                    {p.codigo} · {p.nombre || "Paciente"} (ID: {p.identificacionPaciente})
                  </span>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    PaFiO₂: <strong>{p.laboratorios?.gasesPaFiO2?.resultado || "—"}</strong> · SpFiO₂:{" "}
                    <strong>{p.laboratorios?.spFiO2?.resultado || "—"}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer"
                >
                  Actualizar Gases / Oximetría
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import {
  UsuarioSesion,
  PacienteRegistro,
  RolUsuario,
} from "./types";
import { Header } from "./components/Header";
import { EcgBackground } from "./components/EcgBackground";
import { PantallaInicialTarjetas } from "./components/PantallaInicialTarjetas";
import { Fase1Triage } from "./components/Fase1Triage";
import { ModuloUrgencias } from "./components/ModuloUrgencias";
import { ModuloDetecto } from "./components/ModuloDetecto";
import { ModuloLaboratorios } from "./components/ModuloLaboratorios";
import { BaseDatosPacientes } from "./components/BaseDatosPacientes";
import { ModalEditarPaciente } from "./components/ModalEditarPaciente";
import { BannerConteoRegresivoCentral } from "./components/BannerConteoRegresivoCentral";
import { audioAlert } from "./utils/audioAlert";
import { CheckCircle2, Volume2, VolumeX } from "lucide-react";

export default function App() {
  // Session & Auth State: starts with NO active session (initial cards page)
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(null);

  // Active view for authenticated user
  const [vistaActiva, setVistaActiva] = useState<"fase1" | "fase2" | "fase3" | "laboratorios" | "base_datos">("fase1");
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string | null>(null);

  // Patients Database & Sync
  const [pacientes, setPacientes] = useState<PacienteRegistro[]>([]);
  const [papelera, setPapelera] = useState<(PacienteRegistro & { diasRestantes?: number })[]>([]);
  const [alertas, setAlertas] = useState<{
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
    laboratorios: { cantidad: number; items: any[] };
  }>({
    urgencias: { cantidad: 0, items: [] },
    detecto: { cantidad: 0, items: [] },
    laboratorios: { cantidad: 0, items: [] },
  });

  // Track previous pending cases count for Fase 3 ringtone trigger
  const prevPendientesDetectoRef = useRef<number>(0);

  // Audio alarm state (continuous sound across ALL profiles until all active cases are closed)
  const [alarmaSilenciada, setAlarmaSilenciada] = useState<boolean>(false);
  const alarmaSilenciadaRef = useRef<boolean>(false);

  // Triage state
  const [triageGuardadoExito, setTriageGuardadoExito] = useState<boolean>(false);

  // Edit Modal State (Super Usuario)
  const [pacienteParaEditar, setPacienteParaEditar] = useState<PacienteRegistro | null>(null);

  // Fetch Database & Alerts from Express backend (Syncs across devices)
  const fetchDatosServidor = async () => {
    try {
      const [resPac, resAlert, resPap] = await Promise.all([
        fetch("/api/pacientes"),
        fetch("/api/alertas"),
        fetch("/api/papelera"),
      ]);

      let hayCasosActivos = false;

      if (resPac.ok) {
        const dataPac: PacienteRegistro[] = await resPac.json();
        setPacientes(dataPac);
        hayCasosActivos = dataPac.some(
          (p) => !p.fase3Completada && p.estado !== "completado" && p.estado !== "descartado"
        );
      }

      if (resAlert.ok) {
        const dataAlert = await resAlert.json();

        // SONIDO CONSTANTE EN TODOS LOS PERFILES MIENTRAS HAYA CASOS SIN CERRAR:
        if (hayCasosActivos || dataAlert.urgencias.cantidad > 0) {
          if (!alarmaSilenciadaRef.current) {
            audioAlert.startLoopSonidoTriage();
          }
        } else {
          audioAlert.stopLoopSonidoTriage();
        }

        // RINGTONE CHECK: Si un nuevo paciente llegó a Fase 3, sonar ringtone
        if (dataAlert.detecto.cantidad > prevPendientesDetectoRef.current) {
          audioAlert.playRingtoneFase3();
        }
        prevPendientesDetectoRef.current = dataAlert.detecto.cantidad;
        setAlertas(dataAlert);
      }

      if (resPap.ok) {
        const dataPap = await resPap.json();
        setPapelera(dataPap);
      }
    } catch (err) {
      console.warn("Syncing from API:", err);
    }
  };

  useEffect(() => {
    fetchDatosServidor();
    const interval = setInterval(fetchDatosServidor, 3000);
    return () => clearInterval(interval);
  }, []);

  // Login handlers
  const handleIngresarTriage = () => {
    setUsuarioActual({
      rol: "triage",
      nombre: "Enfermería / Triage",
      usuario: "triage_user",
    });
    setVistaActiva("fase1");
    setTriageGuardadoExito(false);
  };

  const handleLoginCredenciales = (
    rol: RolUsuario,
    usuario: string,
    nombre: string,
    vistaInicial: "modulo" | "base_datos" = "modulo"
  ) => {
    setUsuarioActual({
      rol,
      nombre,
      usuario,
    });

    if (vistaInicial === "base_datos") {
      setVistaActiva("base_datos");
    } else if (rol === "medico_urgencias") {
      setVistaActiva("fase2");
    } else if (rol === "grupo_detecto") {
      setVistaActiva("fase3");
    } else if (rol === "laboratorio") {
      setVistaActiva("laboratorios");
    } else if (rol === "super_usuario") {
      setVistaActiva("base_datos");
    } else {
      setVistaActiva("fase1");
    }
  };

  const handleCerrarSesion = () => {
    setUsuarioActual(null);
    setVistaActiva("fase1");
    setPacienteSeleccionadoId(null);
    setTriageGuardadoExito(false);
  };

  // Submit Phase 1 (Triage)
  const handlePasoFase1AFase2 = async (datos: {
    identificacionPaciente: string;
    nombre: string;
    criteriosTamizaje: boolean[];
    puntajeTamizaje: number;
    categoriaTriage: 1 | 2 | 3;
    categoriaTriageLabel: string;
    diagnosticoTriage: string;
    tiempoFase1Segundos: number;
  }) => {
    try {
      const nuevoPayload = {
        identificacionPaciente: datos.identificacionPaciente,
        nombre: datos.nombre,
        apellido: "",
        criteriosTamizaje: datos.criteriosTamizaje,
        puntajeTamizaje: datos.puntajeTamizaje,
        categoriaTriage: datos.categoriaTriage,
        categoriaTriageLabel: datos.categoriaTriageLabel,
        diagnosticoTriage: datos.diagnosticoTriage,
        autorTriage: usuarioActual?.nombre || "Enfermería Triage",
        faseActual: 2,
        estado: "pendiente_urgencias",
        fase1Completada: true,
        fase2Completada: false,
        fase3Completada: false,
        reportadoADetecto: false,
        habilitadoCierreAnticipado: false,
        estadosModulos: {
          fase1Validada: false,
          checklist1Completado: false,
          laboratoriosCompletado: false,
          anexoCompletado: false,
        },
        tiempoFase1Segundos: datos.tiempoFase1Segundos,
        tiempoFase2Segundos: 0,
        tiempoFase3Segundos: 0,
        tiempoTotalSegundos: datos.tiempoFase1Segundos,
        timestampInicio: Date.now() - datos.tiempoFase1Segundos * 1000,
        timestampPasoFase2: Date.now(),
      };

      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoPayload),
      });

      if (res.ok) {
        setTriageGuardadoExito(true);
        alarmaSilenciadaRef.current = false;
        setAlarmaSilenciada(false);
        audioAlert.startLoopSonidoTriage();
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error guardando Fase 1:", err);
    }
  };

  // Generic partial save (used live by both Fase 2 and Fase 3 4-button workspaces)
  const handleActualizarPaciente = async (
    id: string,
    patch: Partial<PacienteRegistro>
  ) => {
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        await fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error actualizando paciente:", err);
    }
  };

  // Report to DETECTO from Fase 2 (sends to Fase 3 AND keeps case open in Fase 2)
  const handleReportarADetecto = async (
    paciente: PacienteRegistro,
    diagnosticoUrgencias: string,
    segsFase2: number
  ) => {
    try {
      const ahoraTs = Date.now();
      const tsPaso3 = paciente.timestampPasoFase3 || ahoraTs;
      const segsFase2Calculados =
        paciente.reportadoADetecto && (paciente.tiempoFase2Segundos || 0) > 0
          ? paciente.tiempoFase2Segundos
          : Math.max(
              segsFase2,
              Math.floor((tsPaso3 - (paciente.timestampPasoFase2 || paciente.timestampInicio || ahoraTs)) / 1000)
            );

      const payload: Partial<PacienteRegistro> = {
        diagnosticoUrgencias:
          diagnosticoUrgencias.trim() ||
          paciente.diagnosticoUrgencias ||
          "Reportado a Equipo DETECTO",
        autorUrgencias: usuarioActual?.nombre || "Dr. Médico de Urgencias",
        aplicaSepsis: true,
        faseActual: 3,
        estado: "pendiente_detecto",
        fase2Completada: true,
        reportadoADetecto: true,
        tiempoFase2Segundos: segsFase2Calculados,
        tiempoTotalSegundos: Math.floor((ahoraTs - (paciente.timestampInicio || ahoraTs)) / 1000),
        timestampPasoFase3: tsPaso3,
      };

      const res = await fetch(`/api/pacientes/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        audioAlert.playRingtoneFase3();
        alert("¡Paciente reportado a Equipo DETECTO (Fase 3)! El caso también continúa abierto y sincronizado en Fase 2.");
        await fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error reportando a DETECTO:", err);
    }
  };

  // Close case completely (from Fase 2 if 4 greens, or Fase 3 if 4 greens / enabled)
  const handleCerrarCaso = async (
    paciente: PacienteRegistro,
    datos: {
      diagnosticoUrgencias?: string;
      diagnosticoDetecto?: string;
      segsFaseActual: number;
    }
  ) => {
    try {
      const ahoraTs = Date.now();
      const totalSeg = Math.max(
        paciente.tiempoTotalSegundos || 0,
        Math.floor((ahoraTs - (paciente.timestampInicio || ahoraTs)) / 1000)
      );

      // Fase 2 time: preserve reported duration if already reported to DETECTO, otherwise measure from timestampPasoFase2
      const tiempoFase2Final =
        paciente.reportadoADetecto && (paciente.tiempoFase2Segundos || 0) > 0
          ? paciente.tiempoFase2Segundos
          : Math.max(
              datos.segsFaseActual || 0,
              paciente.tiempoFase2Segundos || 0,
              paciente.timestampPasoFase2
                ? Math.floor((ahoraTs - paciente.timestampPasoFase2) / 1000)
                : 0
            );

      // Fase 3 time: ALWAYS counts from the moment Fase 2 reported it (timestampPasoFase3) until case closure
      const tiempoFase3Final = paciente.timestampPasoFase3
        ? Math.max(1, Math.floor((ahoraTs - paciente.timestampPasoFase3) / 1000))
        : usuarioActual?.rol === "grupo_detecto"
        ? Math.max(1, datos.segsFaseActual || 0)
        : paciente.tiempoFase3Segundos || 0;

      const payload: Partial<PacienteRegistro> = {
        diagnosticoUrgencias:
          datos.diagnosticoUrgencias?.trim() || paciente.diagnosticoUrgencias || "",
        diagnosticoDetecto:
          datos.diagnosticoDetecto?.trim() || paciente.diagnosticoDetecto || "",
        autorDetecto:
          usuarioActual?.rol === "grupo_detecto"
            ? usuarioActual.nombre
            : paciente.autorDetecto || "Equipo Asistencial",
        faseActual: 4,
        estado: "completado",
        fase2Completada: true,
        fase3Completada: true,
        tiempoFase2Segundos: tiempoFase2Final,
        tiempoFase3Segundos: tiempoFase3Final,
        tiempoTotalSegundos: totalSeg,
        timestampFinalizado: ahoraTs,
      };

      const res = await fetch(`/api/pacientes/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("¡Caso cerrado exitosamente y guardado en Centro de Control de Casos (✓✓✓)!");
        await fetchDatosServidor();
        audioAlert.playBeep(1600, 250);
      }
    } catch (err) {
      console.error("Error cerrando caso:", err);
    }
  };

  // Delete to trash (ONLY Super Usuario)
  const handleEliminarPaciente = async (id: string) => {
    if (usuarioActual?.rol !== "super_usuario") {
      alert("Solo el Super Usuario puede eliminar registros.");
      return;
    }
    try {
      const res = await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error al mover a papelera:", err);
    }
  };

  // Restore from trash (Super Usuario)
  const handleRestaurarPaciente = async (id: string) => {
    try {
      const res = await fetch(`/api/papelera/restaurar/${id}`, { method: "POST" });
      if (res.ok) {
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error restaurando:", err);
    }
  };

  // Purge from trash (Super Usuario)
  const handlePurgarPaciente = async (id: string) => {
    try {
      const res = await fetch(`/api/papelera/purgar/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error purgando:", err);
    }
  };

  // Edit patient record (Super Usuario)
  const handleGuardarEdicionPaciente = async (pActualizado: PacienteRegistro) => {
    try {
      const res = await fetch(`/api/pacientes/${pActualizado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pActualizado),
      });

      if (res.ok) {
        setPacienteParaEditar(null);
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error guardando edición:", err);
    }
  };

  // Active patients in progress (visible on Home, ALL profiles, and Urgencias until closed)
  const pacientesActivos = pacientes.filter(
    (p) => !p.fase3Completada && p.estado !== "completado" && p.estado !== "descartado"
  );

  // Cases visible in Phase 3 (reported to DETECTO and not yet closed)
  const pacientesPendientesDetecto = pacientesActivos.filter(
    (p) => p.reportadoADetecto || p.estado === "pendiente_detecto"
  );

  // Cases with modules unlocked in Fase 2 whose Resultados de Laboratorio are still pending
  const pacientesPendientesLaboratorios = pacientesActivos.filter(
    (p) =>
      p.estadosModulos?.fase1Validada === true &&
      !p.estadosModulos?.laboratoriosCompletado
  );

  const pacientesCerrados = pacientes.filter(
    (p) => p.fase3Completada || p.estado === "completado"
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col relative selection:bg-sky-500 selection:text-white">
      {/* Dynamic Metallic Blue ECG Cardiac Pulse & Ambient Glows */}
      <EcgBackground />

      {/* Main Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Header bar */}
        <Header
          onCerrarSesion={usuarioActual ? handleCerrarSesion : undefined}
          usuarioActual={usuarioActual}
        />

        {/* BANNER DE ALARMA SONORA CONTINUA EN TODOS LOS PERFILES MIENTRAS HAYA CASOS ACTIVOS */}
        {pacientesActivos.length > 0 && (
          <div className="bg-red-600 text-white px-4 py-2.5 shadow-xl border-b-2 border-red-700 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-[57px] z-30">
            <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
              <span className="p-1.5 bg-white text-red-600 rounded-lg shadow animate-bounce shrink-0">
                <Volume2 className="w-4 h-4" />
              </span>
              <div>
                <span className="font-black uppercase tracking-wider block">
                  🚨 ALARMA SONORA ACTIVA EN LA APLICACIÓN: {pacientesActivos.length} Caso(s) Abierto(s) Sin Cerrar
                </span>
                <span className="text-[11px] text-red-100 block">
                  El sonido permanecerá activo en todos los perfiles hasta que el caso sea cerrado completamente.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 max-w-5xl mx-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (alarmaSilenciada) {
                    alarmaSilenciadaRef.current = false;
                    setAlarmaSilenciada(false);
                    audioAlert.startLoopSonidoTriage();
                  } else {
                    alarmaSilenciadaRef.current = true;
                    setAlarmaSilenciada(true);
                    audioAlert.stopLoopSonidoTriage();
                  }
                }}
                className="bg-white hover:bg-slate-100 text-red-700 font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                {alarmaSilenciada ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🔊 Reanudar Alarma</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-600" />
                    <span>🔇 Silenciar Alarma</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* 1. PÁGINA INICIAL CON LAS 3 TARJETAS DE ACCESO */}
            {!usuarioActual && (
              <PantallaInicialTarjetas
                onIngresarTriage={handleIngresarTriage}
                onLoginCredenciales={handleLoginCredenciales}
                alertas={alertas}
                pacientes={pacientes}
              />
            )}

            {/* 2. VISTAS POR PERFIL (SIN BARRA SUPERIOR DE CAMBIO ENTRE FASES) */}
            {usuarioActual && (
              <div className="space-y-6">
                {/* BANNER CENTRADO CON TIEMPO DESDE QUE SE REPORTÓ + CONTEO REGRESIVO 45/60 MIN VISIBLE EN TODOS LOS PERFILES */}
                {pacientesActivos.length > 0 && (
                  <BannerConteoRegresivoCentral pacientesActivos={pacientesActivos} />
                )}

                {/* A. VISTA FASE 1: TRIAGE */}
                {vistaActiva === "fase1" && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {triageGuardadoExito ? (
                      <div className="bg-white rounded-3xl p-8 border border-emerald-300 shadow-2xl text-center space-y-5">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900">
                            ¡Paciente transferido exitosamente a Urgencias (Fase 2)!
                          </h3>
                          <p className="text-sm text-slate-600 max-w-lg mx-auto">
                            El caso ya fue guardado en el servidor y notificado con alerta continua al Equipo de Sepsis (Médico de Urgencias).
                          </p>
                        </div>

                        <div className="pt-4 flex flex-wrap justify-center gap-3">
                          <button
                            onClick={() => setTriageGuardadoExito(false)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                          >
                            + Ingresar Otro Paciente con Sospecha
                          </button>
                          <button
                            onClick={handleCerrarSesion}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm cursor-pointer"
                          >
                            Salir al Inicio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Fase1Triage
                        pacienteEnEdicion={{}}
                        onGuardarYPasaAFase2={handlePasoFase1AFase2}
                        onVolverAlMenu={handleCerrarSesion}
                      />
                    )}
                  </div>
                )}

                {/* B. VISTA FASE 2: MÉDICO DE URGENCIAS */}
                {vistaActiva === "fase2" && (
                  <ModuloUrgencias
                    pacientesActivos={pacientesActivos}
                    pacientesCerrados={pacientesCerrados}
                    onActualizarPaciente={handleActualizarPaciente}
                    onReportarADetecto={handleReportarADetecto}
                    onCerrarCaso={handleCerrarCaso}
                    onVolverAlInicio={handleCerrarSesion}
                  />
                )}

                {/* C. VISTA FASE 3: EQUIPO DETECTO */}
                {vistaActiva === "fase3" && (
                  <ModuloDetecto
                    pacientesPendientes={pacientesPendientesDetecto}
                    pacientesRegistrados={pacientesCerrados}
                    pacienteActivoId={pacienteSeleccionadoId}
                    onActualizarPaciente={handleActualizarPaciente}
                    onCerrarCaso={handleCerrarCaso}
                    onVerBaseDatos={() => setVistaActiva("base_datos")}
                    onVolverAlInicio={handleCerrarSesion}
                  />
                )}

                {/* C2. VISTA MÓDULO EXTERNO: LABORATORIOS */}
                {vistaActiva === "laboratorios" && (
                  <ModuloLaboratorios
                    pacientesPendientes={pacientesPendientesLaboratorios}
                    onActualizarPaciente={handleActualizarPaciente}
                    onVolverAlInicio={handleCerrarSesion}
                  />
                )}

                {/* D. VISTA BASE DE DATOS */}
                {vistaActiva === "base_datos" && (
                  <div className="max-w-6xl mx-auto space-y-4">
                    {usuarioActual.rol === "grupo_detecto" && (
                      <div className="bg-purple-100 border border-purple-300 text-purple-900 p-3 rounded-2xl text-xs font-bold flex items-center justify-between">
                        <span>Modo Consulta Equipo DETECTO: Visualización y búsqueda de solo lectura (Edición reservada para Super Usuario).</span>
                        <button
                          onClick={() => setVistaActiva("fase3")}
                          className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-xl text-xs font-black cursor-pointer"
                        >
                          Volver a Fase 3 →
                        </button>
                      </div>
                    )}

                    <BaseDatosPacientes
                      pacientes={pacientes}
                      papelera={papelera}
                      usuarioActual={usuarioActual}
                      onEditarPaciente={(p) => setPacienteParaEditar(p)}
                      onEliminarPaciente={handleEliminarPaciente}
                      onRestaurarPaciente={handleRestaurarPaciente}
                      onPurgarPaciente={handlePurgarPaciente}
                      onContinuarFase={(p) => {
                        setPacienteSeleccionadoId(p.id);
                        if (p.faseActual === 1 || !p.fase1Completada) {
                          setVistaActiva("fase1");
                        } else if (p.reportadoADetecto || p.estado === "pendiente_detecto") {
                          setVistaActiva("fase3");
                        } else {
                          setVistaActiva("fase2");
                        }
                      }}
                      onVolverAlMenu={handleCerrarSesion}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Modal for Super User to Edit Patient Record */}
        {pacienteParaEditar && (
          <ModalEditarPaciente
            paciente={pacienteParaEditar}
            onGuardar={handleGuardarEdicionPaciente}
            onCerrar={() => setPacienteParaEditar(null)}
          />
        )}

        {/* Footer */}
        <footer className="bg-white/80 border-t border-slate-200 text-slate-600 text-xs py-4 px-6 text-center backdrop-blur-sm">
          DETECTO© Soporte a Decisiones Clínicas Pediátricas 2026 · Hospital Infantil Los Ángeles (HILA)
        </footer>
      </div>
    </div>
  );
}

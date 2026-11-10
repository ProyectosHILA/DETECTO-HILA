import React, { useState, useEffect, useRef } from "react";
import {
  UsuarioSesion,
  PacienteRegistro,
  RolUsuario,
  FormularioEquipoSepsis,
} from "./types";
import { Header } from "./components/Header";
import { EcgBackground } from "./components/EcgBackground";
import { PantallaInicialTarjetas } from "./components/PantallaInicialTarjetas";
import { Fase1Triage } from "./components/Fase1Triage";
import { ModuloUrgencias } from "./components/ModuloUrgencias";
import { ModuloDetecto } from "./components/ModuloDetecto";
import { BaseDatosPacientes } from "./components/BaseDatosPacientes";
import { ModalEditarPaciente } from "./components/ModalEditarPaciente";
import { TrazabilidadFase1Triage } from "./components/TrazabilidadFase1Triage";
import { TrazabilidadFase2Urgencias } from "./components/TrazabilidadFase2Urgencias";
import { audioAlert } from "./utils/audioAlert";
import { CheckCircle2, ShieldAlert, ArrowLeft, Database, Bell, Volume2, VolumeX } from "lucide-react";

export default function App() {
  // Session & Auth State: starts with NO active session (initial cards page)
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(null);

  // Active view for authenticated users according to their role permissions:
  // - triage: only "fase1"
  // - medico_urgencias: "fase1" | "fase2"
  // - grupo_detecto: "fase1" | "fase2" | "fase3" | "base_datos"
  // - super_usuario: "fase1" | "fase2" | "fase3" | "base_datos"
  const [vistaActiva, setVistaActiva] = useState<"fase1" | "fase2" | "fase3" | "base_datos">("fase1");

  // Selected patient for clinical traceability across modules
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string | null>(null);
  const [modoNuevoTriage, setModoNuevoTriage] = useState<boolean>(false);

  // Patients Database & Sync
  const [pacientes, setPacientes] = useState<PacienteRegistro[]>([]);
  const [papelera, setPapelera] = useState<(PacienteRegistro & { diasRestantes?: number })[]>([]);
  const [alertas, setAlertas] = useState<{
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
  }>({
    urgencias: { cantidad: 0, items: [] },
    detecto: { cantidad: 0, items: [] },
  });

  // Track previous pending cases count for Fase 3 ringtone trigger
  const prevPendientesDetectoRef = useRef<number>(0);

  // Audio alarm state for triage -> urgencias loop sound
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

      if (resPac.ok) {
        const dataPac = await resPac.json();
        setPacientes(dataPac);
      }
      if (resAlert.ok) {
        const dataAlert = await resAlert.json();
        
        // SONIDO CONSTANTE TRIAGE -> URGENCIAS:
        // Suena constantemente siempre que la app esté activa y haya pacientes pendientes de Urgencias
        if (dataAlert.urgencias.cantidad > 0) {
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

  // Login handler
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
    } else if (rol === "super_usuario") {
      setVistaActiva("base_datos");
    } else {
      setVistaActiva("fase1");
    }
  };

  const handleCerrarSesion = () => {
    setUsuarioActual(null);
    setVistaActiva("fase1");
    setTriageGuardadoExito(false);
  };

  // Submit Phase 1 (Triage)
  const handlePasoFase1AFase2 = async (datos: {
    identificacionPaciente: string;
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
        nombre: `Pcte ${datos.identificacionPaciente}`,
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
        // Iniciar sonido constante en la app al registrar paciente desde Triage
        audioAlert.startLoopSonidoTriage();
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error guardando Fase 1:", err);
    }
  };

  // Submit Phase 2 (Médico de Urgencias) -> RINGTONE CUANDO LLEGA A FASE 3
  const handleReportarADetecto = async (datos: {
    identificacionPaciente: string;
    diagnosticoUrgencias: string;
    aplicaSepsis: boolean;
    aprobadoUrgencias: boolean;
    motivoDescarte?: string;
    formularioEquipoSepsis?: FormularioEquipoSepsis;
    tiempoFase2Segundos: number;
    tiempoTotalSegundos: number;
    pacienteId: string;
  }) => {
    try {
      const estadoNuevo = datos.aplicaSepsis ? "pendiente_detecto" : "descartado";
      const payload = {
        identificacionPaciente: datos.identificacionPaciente,
        diagnosticoUrgencias: datos.diagnosticoUrgencias,
        autorUrgencias: usuarioActual?.nombre || "Dr. Urgencias",
        aplicaSepsis: datos.aplicaSepsis,
        aprobadoUrgencias: datos.aprobadoUrgencias,
        motivoDescarte: datos.motivoDescarte,
        formularioEquipoSepsis: datos.formularioEquipoSepsis,
        faseActual: datos.aplicaSepsis ? 3 : 4,
        estado: estadoNuevo,
        fase2Completada: datos.aplicaSepsis,
        fase3Completada: false,
        tiempoFase2Segundos: datos.tiempoFase2Segundos,
        tiempoTotalSegundos: datos.tiempoTotalSegundos,
        timestampPasoFase3: Date.now(),
      };

      const res = await fetch(`/api/pacientes/${datos.pacienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (datos.aplicaSepsis) {
          // RINGTONE INMEDIATO AL LLEGAR A FASE 3
          audioAlert.playRingtoneFase3();
          alert("¡Paciente reportado exitosamente a Equipo DETECTO (Fase 3)! Notificación sonora activada.");
        } else {
          alert("Caso clasificado como No Aplica / Descartado.");
        }
        fetchDatosServidor();
      }
    } catch (err) {
      console.error("Error actualizando Fase 2:", err);
    }
  };

  // Submit Phase 3 (Equipo DETECTO)
  const handleRegistrarCasoDetecto = async (datos: {
    identificacionPaciente: string;
    diagnosticoDetecto?: string;
    tiempoFase3Segundos: number;
    tiempoTotalSegundos: number;
    pacienteId: string;
  }) => {
    try {
      const payload = {
        identificacionPaciente: datos.identificacionPaciente,
        diagnosticoDetecto: datos.diagnosticoDetecto,
        autorDetecto: usuarioActual?.nombre || "Líder DETECTO",
        faseActual: 4,
        estado: "completado",
        fase3Completada: true,
        tiempoFase3Segundos: datos.tiempoFase3Segundos,
        tiempoTotalSegundos: datos.tiempoTotalSegundos,
        timestampFinalizado: Date.now(),
      };

      const res = await fetch(`/api/pacientes/${datos.pacienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("¡Caso registrado exitosamente en la Base de Datos con las 3 fases completadas (✓✓✓)!");
        fetchDatosServidor();
        audioAlert.playBeep(1600, 250);
      }
    } catch (err) {
      console.error("Error registrando en Fase 3:", err);
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

  // Filter lists for Urgencias and DETECTO
  const pacientesPendientesUrgencias = pacientes.filter(
    (p) => p.fase1Completada && !p.fase2Completada && p.estado === "pendiente_urgencias"
  );
  const pacientesAtendidosUrgencias = pacientes.filter(
    (p) => p.fase2Completada || p.estado === "descartado"
  );

  const pacientesPendientesDetecto = pacientes.filter(
    (p) => p.fase1Completada && p.fase2Completada && !p.fase3Completada && p.estado === "pendiente_detecto"
  );
  const pacientesRegistradosDetecto = pacientes.filter(
    (p) => p.fase3Completada && p.estado === "completado"
  );

  // Active patient in focus for multi-phase clinical traceability
  const pacienteEnRevision =
    pacientes.find((p) => p.id === pacienteSeleccionadoId) ||
    pacientesPendientesDetecto[0] ||
    pacientesPendientesUrgencias[0] ||
    pacientes[0] ||
    null;

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

        {/* BANNER DE ALARMA SONORA EN CURSO (TRIAGE -> URGENCIAS) */}
        {alertas.urgencias.cantidad > 0 && (
          <div className="bg-red-600 text-white px-4 py-2.5 shadow-xl border-b-2 border-red-700 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-[57px] z-30">
            <div className="flex items-center gap-2.5 max-w-4xl mx-auto flex-1">
              <span className="p-1.5 bg-white text-red-600 rounded-lg shadow animate-bounce shrink-0">
                <Volume2 className="w-4 h-4" />
              </span>
              <div>
                <span className="font-black uppercase tracking-wider block">
                  🚨 ALARMA SONORA ACTIVA EN LA APLICACIÓN: {alertas.urgencias.cantidad} Paciente(s) Pendientes de Urgencias
                </span>
                <span className="text-[11px] text-red-100 block">
                  Paciente reportado desde Triage. El sonido oficial permanecerá activo en la app hasta que sea atendido o silenciado.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 max-w-4xl mx-auto shrink-0">
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
          {/* 1. PÁGINA INICIAL CON LAS 3 TARJETAS DE ACCESO */}
          {!usuarioActual && (
            <PantallaInicialTarjetas
              onIngresarTriage={handleIngresarTriage}
              onLoginCredenciales={handleLoginCredenciales}
              alertas={alertas}
              pacientes={pacientes}
            />
          )}

          {/* 2. SISTEMA DE PERMISOS SEGÚN EL ROL DE INGRESO */}
          {usuarioActual && (
            <div className="space-y-6">
              {/* BARRA DE NAVEGACIÓN MODULAR SEGÚN EL PERFIL */}
              {/* SI ENTRA POR TRIAGE: NO TIENE NINGÚN OTRO ACCESO */}
              {usuarioActual.rol === "triage" && (
                <div className="max-w-4xl mx-auto flex items-center justify-between bg-white border-2 border-emerald-300 rounded-2xl p-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-black text-emerald-950 uppercase">
                      Perfil Triage (Acceso Exclusivo a Fase 1)
                    </span>
                  </div>
                  <button
                    onClick={handleCerrarSesion}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cerrar Sesión para cambiar de perfil →
                  </button>
                </div>
              )}

              {/* SI SE LOGEA FASE 2: PUEDE MIRAR LO DE TRIAGE (FASE 1) Y URGENCIAS (FASE 2) */}
              {usuarioActual.rol === "medico_urgencias" && (
                <div className="max-w-4xl mx-auto bg-white border-2 border-amber-400 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-950 uppercase">
                      Perfil Médico de Urgencias
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Acceso a Fase 1 y Fase 2)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVistaActiva("fase1")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        vistaActiva === "fase1"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      🟢 Fase 1: Triage
                    </button>
                    <button
                      onClick={() => setVistaActiva("fase2")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all relative cursor-pointer ${
                        vistaActiva === "fase2"
                          ? "bg-amber-400 text-slate-950 shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      🟡 Fase 2: Urgencias
                      {alertas.urgencias.cantidad > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1.5 animate-pulse">
                          {alertas.urgencias.cantidad}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* SI SE LOGEA FASE 3 O SUPER ADMIN: PUEDE ENTRAR A TODOS LOS MÓDULOS */}
              {(usuarioActual.rol === "grupo_detecto" || usuarioActual.rol === "super_usuario") && (
                <div className="max-w-5xl mx-auto bg-slate-900 border-2 border-purple-400/80 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-600 rounded-xl text-white shadow-sm">
                        {usuarioActual.rol === "super_usuario" ? (
                          <ShieldAlert className="w-5 h-5 text-amber-300" />
                        ) : (
                          <Bell className="w-5 h-5 text-purple-200" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-purple-200 block">
                          {usuarioActual.rol === "super_usuario"
                            ? "Super Administrador (Control Maestro)"
                            : "Equipo DETECTO (Acceso Integral)"}
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Acceso a todos los módulos: Fase 1, Fase 2, Fase 3 y Base de Datos
                        </span>
                      </div>
                    </div>

                    {/* Paciente en atención / selector de trazabilidad activa */}
                    {pacienteEnRevision && (
                      <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-500/50 text-xs">
                        <span className="text-purple-300 font-bold text-[11px]">Paciente en atención:</span>
                        <span className="font-mono font-black text-amber-300">
                          {pacienteEnRevision.identificacionPaciente || pacienteEnRevision.codigo}
                        </span>
                        {pacientes.length > 1 && (
                          <select
                            value={pacienteEnRevision.id}
                            onChange={(e) => setPacienteSeleccionadoId(e.target.value)}
                            className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700 outline-none cursor-pointer"
                          >
                            {pacientes.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} - ID: {p.identificacionPaciente} ({p.faseActual === 1 ? "Triage" : p.faseActual === 2 ? "Urgencias" : p.faseActual === 3 ? "DETECTO" : "Finalizado"})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => {
                        setModoNuevoTriage(false);
                        setVistaActiva("fase1");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        vistaActiva === "fase1"
                          ? "bg-sky-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      🟢 Fase 1: Triage
                    </button>

                    <button
                      onClick={() => setVistaActiva("fase2")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                        vistaActiva === "fase2"
                          ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      🟡 Fase 2: Urgencias
                      {alertas.urgencias.cantidad > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1 animate-pulse">
                          {alertas.urgencias.cantidad}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setVistaActiva("fase3")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                        vistaActiva === "fase3"
                          ? "bg-purple-600 text-white font-black shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      🔴 Fase 3: DETECTO
                      {alertas.detecto.cantidad > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1 animate-pulse">
                          {alertas.detecto.cantidad}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setVistaActiva("base_datos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        vistaActiva === "base_datos"
                          ? "bg-white text-slate-950 font-black shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      📊 Base de Datos ({pacientes.length})
                    </button>
                  </div>
                </div>
              )}

              {/* RENDERIZADO DE LA VISTA SEGÚN VISTAACTIVA */}
              {/* A. VISTA FASE 1: TRIAGE */}
              {vistaActiva === "fase1" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Si el usuario es DETECTO, Super Usuario o Urgencias y ya tiene un paciente, mostrar trazabilidad e historia de Triage con su tabla */}
                  {(usuarioActual.rol === "grupo_detecto" ||
                    usuarioActual.rol === "super_usuario" ||
                    usuarioActual.rol === "medico_urgencias") &&
                  pacienteEnRevision &&
                  !modoNuevoTriage ? (
                    <TrazabilidadFase1Triage
                      paciente={pacienteEnRevision}
                      onIrAFase2={() => setVistaActiva("fase2")}
                      onIrAFase3={
                        usuarioActual.rol !== "medico_urgencias"
                          ? () => setVistaActiva("fase3")
                          : undefined
                      }
                      onNuevoCasoTriage={() => setModoNuevoTriage(true)}
                    />
                  ) : triageGuardadoExito ? (
                    <div className="bg-white rounded-3xl p-8 border border-emerald-300 shadow-2xl text-center space-y-5">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900">
                          ¡Paciente transferido exitosamente a Urgencias (Fase 2)!
                        </h3>
                        <p className="text-sm text-slate-600 max-w-lg mx-auto">
                          El caso ya fue guardado en el servidor y notificado con alerta al Equipo de Sepsis (Médico de Urgencias).
                        </p>
                      </div>

                      <div className="pt-4 flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => {
                            setTriageGuardadoExito(false);
                            setModoNuevoTriage(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                        >
                          + Ingresar Otro Paciente con Sospecha
                        </button>
                        {usuarioActual.rol === "medico_urgencias" && (
                          <button
                            onClick={() => setVistaActiva("fase2")}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                          >
                            Ir a Fase 2 (Urgencias) →
                          </button>
                        )}
                        {usuarioActual.rol !== "triage" && pacienteEnRevision && (
                          <button
                            onClick={() => setModoNuevoTriage(false)}
                            className="bg-sky-700 hover:bg-sky-800 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                          >
                            Ver Trazabilidad de {pacienteEnRevision.codigo}
                          </button>
                        )}
                        <button
                          onClick={handleCerrarSesion}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm cursor-pointer"
                        >
                          Salir al Inicio
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modoNuevoTriage && pacienteEnRevision && usuarioActual.rol !== "triage" && (
                        <div className="flex items-center justify-between bg-sky-50 border border-sky-200 p-3 rounded-2xl">
                          <span className="text-xs font-bold text-sky-900">
                            Modo creación de nuevo caso de Triage
                          </span>
                          <button
                            onClick={() => setModoNuevoTriage(false)}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            ← Volver a Trazabilidad de {pacienteEnRevision.codigo}
                          </button>
                        </div>
                      )}
                      <Fase1Triage
                        pacienteEnEdicion={{}}
                        onGuardarYPasaAFase2={handlePasoFase1AFase2}
                        onVolverAlMenu={handleCerrarSesion}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* B. VISTA FASE 2: MÉDICO DE URGENCIAS */}
              {vistaActiva === "fase2" && (
                <>
                  {(usuarioActual.rol === "grupo_detecto" || usuarioActual.rol === "super_usuario") &&
                  pacienteEnRevision &&
                  pacienteEnRevision.fase2Completada ? (
                    <TrazabilidadFase2Urgencias
                      paciente={pacienteEnRevision}
                      onIrAFase1={() => {
                        setModoNuevoTriage(false);
                        setVistaActiva("fase1");
                      }}
                      onIrAFase3={() => setVistaActiva("fase3")}
                    />
                  ) : (
                    <ModuloUrgencias
                      pacientesPendientes={pacientesPendientesUrgencias}
                      pacientesAtendidos={pacientesAtendidosUrgencias}
                      onReportarADetecto={handleReportarADetecto}
                      onVolverAlInicio={handleCerrarSesion}
                    />
                  )}
                </>
              )}

              {/* C. VISTA FASE 3: EQUIPO DETECTO */}
              {vistaActiva === "fase3" && (
                <ModuloDetecto
                  pacientesPendientes={pacientesPendientesDetecto}
                  pacientesRegistrados={pacientesRegistradosDetecto}
                  pacienteActivo={pacienteEnRevision}
                  onRegistrarCaso={handleRegistrarCasoDetecto}
                  onVerBaseDatos={() => setVistaActiva("base_datos")}
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
                        className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-xl text-xs font-black"
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
                      setModoNuevoTriage(false);
                      if (p.faseActual === 1 || !p.fase1Completada) {
                        setVistaActiva("fase1");
                      } else if (p.faseActual === 2 || p.estado === "pendiente_urgencias") {
                        setVistaActiva("fase2");
                      } else {
                        setVistaActiva("fase3");
                      }
                    }}
                    onVolverAlMenu={handleCerrarSesion}
                  />
                </div>
              )}
            </div>
          )}
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

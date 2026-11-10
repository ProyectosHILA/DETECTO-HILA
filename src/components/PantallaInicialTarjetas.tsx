import React, { useState, useEffect } from "react";
import { RolUsuario, PacienteRegistro } from "../types";
import { DetectoLogo } from "./DetectoLogo";
import {
  Stethoscope,
  HeartPulse,
  Users,
  ShieldAlert,
  Lock,
  ArrowRight,
  Clock,
  AlertTriangle,
  User,
  KeyRound,
  Eye,
  Activity,
  Zap,
} from "lucide-react";

interface PantallaInicialTarjetasProps {
  onIngresarTriage: () => void;
  onLoginCredenciales: (
    rol: RolUsuario,
    usuario: string,
    nombre: string,
    vistaInicial?: "modulo" | "base_datos"
  ) => void;
  alertas: {
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
  };
  pacientes: PacienteRegistro[];
}

export const PantallaInicialTarjetas: React.FC<PantallaInicialTarjetasProps> = ({
  onIngresarTriage,
  onLoginCredenciales,
  alertas,
  pacientes,
}) => {
  const [modalRol, setModalRol] = useState<RolUsuario | null>(null);
  const [destinoBaseDatos, setDestinoBaseDatos] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // Live timer for active patient alerts (ticks every second)
  const [ahora, setAhora] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatEspera = (timestamp: number) => {
    const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    return `${mins} min`;
  };

  const formatearTiempoSegundos = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  // Pacientes en curso (activamente transitando por las fases 1, 2 o 3)
  const pacientesActivos = pacientes.filter(
    (p) => !p.fase3Completada && p.estado !== "completado" && p.estado !== "descartado"
  );

  const handleAbrirLogin = (rol: RolUsuario, paraBaseDatos: boolean = false) => {
    setErrorAuth(null);
    setPasswordInput("");
    setDestinoBaseDatos(paraBaseDatos);

    if (rol === "triage" && !paraBaseDatos) {
      onIngresarTriage();
    } else {
      setModalRol(rol);
      if (paraBaseDatos) {
        setUserInput("LDetecto1"); // default to LDetecto1 or AdminDet1
      } else if (rol === "medico_urgencias") {
        setUserInput("Medurg1");
      } else if (rol === "grupo_detecto") {
        setUserInput("LDetecto1");
      } else if (rol === "super_usuario") {
        setUserInput("AdminDet1");
      }
    }
  };

  const handleValidarCredenciales = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAuth(null);

    const u = userInput.trim();
    const p = passwordInput.trim();

    // Check Base de Datos login (accepts AdminDet1 or LDetecto1)
    if (destinoBaseDatos) {
      if (u === "AdminDet1" && p === "Detecto159*") {
        onLoginCredenciales("super_usuario", "AdminDet1", "Super Administrador DETECTO", "base_datos");
        setModalRol(null);
        return;
      } else if (u === "LDetecto1" && p === "Salva+vidas") {
        onLoginCredenciales("grupo_detecto", "LDetecto1", "Líder DETECTO (Solo Lectura)", "base_datos");
        setModalRol(null);
        return;
      } else {
        setErrorAuth(
          "Credenciales no válidas para la Base de Datos. Use Super Usuario (AdminDet1 | Detecto159*) o Equipo DETECTO (LDetecto1 | Salva+vidas)."
        );
        return;
      }
    }

    if (modalRol === "medico_urgencias") {
      if (u === "Medurg1" && p === "Salvavidas2") {
        onLoginCredenciales("medico_urgencias", "Medurg1", "Dr. Médico de Urgencias", "modulo");
        setModalRol(null);
      } else {
        setErrorAuth("Usuario o clave incorrecta. (Usuario: Medurg1 | Clave: Salvavidas2)");
      }
    } else if (modalRol === "grupo_detecto") {
      if (u === "LDetecto1" && p === "Salva+vidas") {
        onLoginCredenciales("grupo_detecto", "LDetecto1", "Líder Equipo DETECTO", "modulo");
        setModalRol(null);
      } else {
        setErrorAuth("Usuario o clave incorrecta. (Usuario: LDetecto1 | Clave: Salva+vidas)");
      }
    } else if (modalRol === "super_usuario") {
      if (u === "AdminDet1" && p === "Detecto159*") {
        onLoginCredenciales("super_usuario", "AdminDet1", "Super Administrador DETECTO", "base_datos");
        setModalRol(null);
      } else {
        setErrorAuth("Usuario o clave incorrecta. (Usuario: AdminDet1 | Clave: Detecto159*)");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 sm:py-6">
      {/* Brand Hero Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <DetectoLogo size="lg" showText={true} />
        </div>
        <h2 className="text-sm sm:text-base md:text-lg text-slate-800 font-extrabold max-w-3xl mx-auto tracking-tight leading-snug">
          DEtección Temprana de sEpsis en Cáncer y Tratamiento dirigidO
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Hospital Infantil Los Ángeles (HILA) · Protocolo Institucional de Alerta Temprana
        </p>
      </div>

      {/* ALERTA GENERAL DE PACIENTES ACTIVOS EN CURSO (CON CRONÓMETRO ACUMULADO EN VIVO) */}
      {pacientesActivos.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 shadow-2xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-600 text-white rounded-xl shadow-md">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </span>
              <span className="text-xs sm:text-sm font-black text-red-900 uppercase tracking-wider">
                🚨 ALERTA GENERAL: PACIENTE(S) EN ATENCIÓN ACTIVA
              </span>
            </div>
            <span className="text-xs font-black text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-300">
              {pacientesActivos.length} caso(s) en curso
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pacientesActivos.map((pac) => {
              const segsAcumulados = Math.max(
                0,
                Math.floor((ahora - pac.timestampInicio) / 1000)
              );

              let faseTexto = "Fase 1: Triage (Tamizaje de sepsis)";
              let colorFase = "bg-sky-100 text-sky-900 border-sky-300";

              if (pac.faseActual === 2 || pac.estado === "pendiente_urgencias") {
                faseTexto = "Fase 2: Equipo de Sepsis (Médico de Urgencias)";
                colorFase = "bg-amber-100 text-amber-950 border-amber-300";
              } else if (pac.faseActual === 3 || pac.estado === "pendiente_detecto") {
                faseTexto = "Fase 3: Equipo DETECTO (Tratamiento temprano y dirigido)";
                colorFase = "bg-purple-100 text-purple-950 border-purple-300";
              }

              return (
                <div
                  key={pac.id}
                  className="bg-white border-2 border-red-300 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">
                        Identificación Paciente
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {pac.identificacionPaciente || pac.codigo}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Cronómetro en vivo
                      </span>
                      <span className="font-mono text-lg font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        ⏱ {formatearTiempoSegundos(segsAcumulados)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border block ${colorFase}`}>
                      📍 {faseTexto}
                    </span>

                    {pac.categoriaTriageLabel && (
                      <span className="text-[11px] font-bold text-slate-700 block mt-1">
                        Clasificación Triage: <strong>{pac.categoriaTriageLabel}</strong> ({pac.puntajeTamizaje ?? 0} pts)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3 TARJETAS CON LAS FASES: FASE 1 (AZUL OSCURO), FASE 2 (AMARILLO), FASE 3 (DETECTO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* TARJETA 1: FASE 1 - FONDO AZUL OSCURO */}
        <div
          onClick={() => handleAbrirLogin("triage")}
          className="group bg-[#0c2340] border-2 border-sky-500/50 hover:border-sky-300 rounded-3xl p-6 sm:p-7 text-white shadow-2xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-sky-600 text-white rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                <Stethoscope className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/40">
                1 Clic · Sin Clave
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider block">
                Fase 1
              </span>
              <h3 className="text-2xl font-black text-white mt-0.5 leading-tight">
                Tamizaje de sepsis
              </h3>
              <span className="text-xs font-bold text-sky-200 block mt-0.5">
                Triage
              </span>
            </div>

            <p className="text-xs text-sky-100/90 leading-relaxed">
              Acceso inmediato sin usuario ni contraseña. Diligencie Identificación, lista de los 8 criterios clínicos de tamizaje y categorización con dictado por voz.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-sky-500/30">
            <button
              type="button"
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-colors group-hover:brightness-110"
            >
              <span>INGRESAR A TRIAGE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="block text-center text-[10px] text-sky-300 font-semibold mt-2">
              Ingreso directo para enfermería
            </span>
          </div>
        </div>

        {/* TARJETA 2: FASE 2 - FONDO AMARILLO */}
        <div
          onClick={() => handleAbrirLogin("medico_urgencias")}
          className="group bg-amber-400 border-2 border-amber-500 hover:border-amber-600 rounded-3xl p-6 sm:p-7 text-slate-950 shadow-2xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-slate-950 text-amber-400 rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                <HeartPulse className="w-8 h-8" />
              </div>

              {/* ALERTA ROJA PULSANTE SI HAY PACIENTES PENDIENTES */}
              {alertas.urgencias.cantidad > 0 ? (
                <span className="animate-pulse text-[11px] font-black uppercase px-3 py-1 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1.5 border border-red-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>{alertas.urgencias.cantidad} Pendiente(s)</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-950/15 text-slate-900 border border-slate-950/25">
                  Requiere Clave
                </span>
              )}
            </div>

            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Fase 2
              </span>
              <h3 className="text-2xl font-black text-slate-950 mt-0.5 leading-tight">
                Equipo de Sepsis
              </h3>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                Médico de Urgencias
              </span>
            </div>

            <p className="text-xs text-slate-900 font-medium leading-relaxed">
              Valida el reporte de Triage con los 8 criterios, define si el paciente sospechoso aplica a sepsis, emite diagnóstico y reporta a DETECTO.
            </p>

            {/* CONTADOR DE TIEMPO DESDE QUE LLEGÓ EL REPORTE */}
            {alertas.urgencias.cantidad > 0 && alertas.urgencias.items[0] && (
              <div className="bg-red-950 text-white border border-red-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-inner">
                <span className="flex items-center gap-1.5 text-red-200">
                  <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  Esperando reporte hace:
                </span>
                <span className="text-red-300 font-mono text-sm">
                  {formatEspera(alertas.urgencias.items[0].esperandoDesde)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-950/20">
            <button
              type="button"
              className="w-full bg-slate-950 hover:bg-slate-900 text-amber-300 font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-colors group-hover:brightness-110"
            >
              <span>INGRESAR COMO MÉDICO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="block text-center text-[10px] text-slate-900 font-bold mt-2">
              Usuario: Medurg1 · Clave: Salvavidas2
            </span>
          </div>
        </div>

        {/* TARJETA 3: FASE 3 - EQUIPO DETECTO / TRATAMIENTO TEMPRANO Y DIRIGIDO */}
        <div
          onClick={() => handleAbrirLogin("grupo_detecto")}
          className="group bg-[#2e1065] border-2 border-purple-400/50 hover:border-purple-300 rounded-3xl p-6 sm:p-7 text-white shadow-2xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                <Users className="w-8 h-8" />
              </div>

              {/* ALERTA ROJA PULSANTE SI HAY CASOS PENDIENTES */}
              {alertas.detecto.cantidad > 0 ? (
                <span className="animate-pulse text-[11px] font-black uppercase px-3 py-1 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1.5 border border-red-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>{alertas.detecto.cantidad} Pendiente(s)</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/40">
                  Requiere Clave
                </span>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                Fase 3
              </span>
              <h3 className="text-2xl font-black text-white mt-0.5 leading-tight">
                Equipo DETECTO
              </h3>
              <span className="text-xs font-bold text-purple-200 block mt-0.5">
                Tratamiento temprano y dirigido
              </span>
            </div>

            <p className="text-xs text-purple-100/90 leading-relaxed">
              Auditoría integral de la historia (Triage + Urgencias), diagnóstico del líder, prescripción, registro formal del caso en base de datos.
            </p>

            {/* CONTADOR DE TIEMPO DESDE QUE URGENCIAS EMITIÓ REPORTE */}
            {alertas.detecto.cantidad > 0 && alertas.detecto.items[0] && (
              <div className="bg-red-950 text-white border border-red-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-inner">
                <span className="flex items-center gap-1.5 text-red-200">
                  <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  Esperando validación hace:
                </span>
                <span className="text-red-300 font-mono text-sm">
                  {formatEspera(alertas.detecto.items[0].esperandoDesde)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-purple-500/30">
            <button
              type="button"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-colors group-hover:brightness-110"
            >
              <span>INGRESAR A EQUIPO DETECTO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="block text-center text-[10px] text-purple-300 font-semibold mt-2">
              Usuario: LDetecto1 · Clave: Salva+vidas
            </span>
          </div>
        </div>
      </div>

      {/* ACCESO A BASE DE DATOS GENERAL (DISPONIBLE PARA SUPER USUARIO Y EQUIPO DETECTO) */}
      <div className="bg-white border-2 border-slate-300 hover:border-slate-400 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#0f2b5c] text-white rounded-2xl shadow-md">
            <KeyRound className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="font-black text-slate-900 block text-base">
              Base de Datos y Registro Central de Casos
            </span>
            <p className="text-xs text-slate-600 max-w-xl">
              Habilitado para <strong>Super Usuario</strong> (con permisos completos de edición y eliminación) y para el <strong>Equipo DETECTO</strong> (acceso de consulta y visualización de solo lectura).
            </p>
          </div>
        </div>

        <button
          onClick={() => handleAbrirLogin("super_usuario", true)}
          className="bg-[#0f2b5c] hover:bg-sky-900 text-white px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Eye className="w-4 h-4 text-sky-300" />
          <span>Ingresar a la Base de Datos</span>
        </button>
      </div>

      {/* MODAL DE CREDENCIALES PARA FASE 2, FASE 3 O BASE DE DATOS */}
      {modalRol && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0f2b5c] text-white rounded-xl">
                  <Lock className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {destinoBaseDatos && "Acceso a Base de Datos Central"}
                    {!destinoBaseDatos && modalRol === "medico_urgencias" && "Fase 2: Equipo de Sepsis"}
                    {!destinoBaseDatos && modalRol === "grupo_detecto" && "Fase 3: Equipo DETECTO"}
                    {!destinoBaseDatos && modalRol === "super_usuario" && "Super Usuario / Administrador"}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {destinoBaseDatos
                      ? "Ingrese como Super Usuario o Equipo DETECTO"
                      : "Ingrese credenciales oficiales"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalRol(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorAuth && (
              <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorAuth}</span>
              </div>
            )}

            <form onSubmit={handleValidarCredenciales} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-600"
                    placeholder="Usuario"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-600"
                    placeholder="Contraseña"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0f2b5c] hover:bg-sky-900 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Verificar y Abrir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border space-y-1">
              <span className="font-bold text-slate-800 block">Credenciales habilitadas:</span>
              {destinoBaseDatos ? (
                <>
                  <div>
                    • <strong>Super Usuario:</strong> Usuario: <code className="bg-slate-200 px-1 rounded">AdminDet1</code> · Clave: <code className="bg-slate-200 px-1 rounded">Detecto159*</code> (Control total)
                  </div>
                  <div>
                    • <strong>Equipo DETECTO:</strong> Usuario: <code className="bg-slate-200 px-1 rounded">LDetecto1</code> · Clave: <code className="bg-slate-200 px-1 rounded">Salva+vidas</code> (Solo lectura)
                  </div>
                </>
              ) : (
                <>
                  {modalRol === "medico_urgencias" && (
                    <span>Usuario: <strong>Medurg1</strong> · Clave: <strong>Salvavidas2</strong></span>
                  )}
                  {modalRol === "grupo_detecto" && (
                    <span>Usuario: <strong>LDetecto1</strong> · Clave: <strong>Salva+vidas</strong></span>
                  )}
                  {modalRol === "super_usuario" && (
                    <span>Usuario: <strong>AdminDet1</strong> · Clave: <strong>Detecto159*</strong></span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

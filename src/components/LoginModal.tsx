import React, { useState } from "react";
import { UsuarioSesion, RolUsuario } from "../types";
import { DetectoLogo } from "./DetectoLogo";
import {
  Stethoscope,
  HeartPulse,
  Users,
  ShieldAlert,
  Lock,
  User,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface LoginModalProps {
  onLogin: (usuario: UsuarioSesion) => void;
  alertas: {
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
  };
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, alertas }) => {
  const [faseSeleccionada, setFaseSeleccionada] = useState<RolUsuario | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  // Formatter for elapsed time in minutes
  const formatEspera = (timestamp: number) => {
    const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    return `${mins} min`;
  };

  const handleSeleccionarRol = (rol: RolUsuario) => {
    setErrorLogin(null);
    setUserInput("");
    setPasswordInput("");

    if (rol === "triage") {
      // Fase 1 Triage does not require credentials - enters directly!
      onLogin({
        rol: "triage",
        nombre: "Enfermería / Triage",
        usuario: "triage_user",
      });
    } else {
      setFaseSeleccionada(rol);
      // Pre-fill suggested username for clinical ease of use
      if (rol === "medico_urgencias") setUserInput("Medurg1");
      if (rol === "grupo_detecto") setUserInput("LDetecto1");
      if (rol === "super_usuario") setUserInput("AdminDet1");
    }
  };

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin(null);

    const u = userInput.trim();
    const p = passwordInput.trim();

    if (faseSeleccionada === "medico_urgencias") {
      if (u === "Medurg1" && p === "Salvavidas2") {
        onLogin({
          rol: "medico_urgencias",
          nombre: "Dr. Médico de Urgencias",
          usuario: "Medurg1",
        });
      } else {
        setErrorLogin("Credenciales incorrectas para Médico de Urgencias (Usuario: Medurg1 / Clave: Salvavidas2)");
      }
    } else if (faseSeleccionada === "grupo_detecto") {
      if (u === "LDetecto1" && p === "Salva+vidas") {
        onLogin({
          rol: "grupo_detecto",
          nombre: "Líder Equipo DETECTO",
          usuario: "LDetecto1",
        });
      } else {
        setErrorLogin("Credenciales incorrectas para Equipo DETECTO (Usuario: LDetecto1 / Clave: Salva+vidas)");
      }
    } else if (faseSeleccionada === "super_usuario") {
      if (u === "AdminDet1" && p === "Detecto159*") {
        onLogin({
          rol: "super_usuario",
          nombre: "Super Administrador DETECTO",
          usuario: "AdminDet1",
        });
      } else {
        setErrorLogin("Credenciales incorrectas para Super Usuario (Usuario: AdminDet1 / Clave: Detecto159*)");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071328]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-sky-900/30 overflow-hidden my-6">
        {/* Header with Hospital Branding & Logo */}
        <div className="bg-gradient-to-r from-[#0f2b5c] via-[#0b1f42] to-[#081836] p-6 text-white text-center relative border-b border-sky-800/50">
          <div className="flex justify-center mb-3">
            <DetectoLogo size="lg" showText={true} />
          </div>
          <p className="text-sky-200 text-xs sm:text-sm font-medium max-w-xl mx-auto">
            Plataforma Institucional para la Detección y Manejo de la Sepsis en Oncología Pediátrica · Hospital Infantil Los Ángeles (HILA)
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-sky-900/60 text-sky-200 text-xs px-4 py-1 rounded-full border border-sky-700/50">
            <span>Seleccione su rol asistencial para ingresar a la plataforma</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {!faseSeleccionada ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                  Acceso por Fases y Perfiles Clínicos
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  El sistema sincroniza pacientes en tiempo real entre Triage, Urgencias y DETECTO
                </p>
              </div>

              {/* Grid of the 4 Access Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Fase 1: Triage */}
                <div
                  onClick={() => handleSeleccionarRol("triage")}
                  className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Sin Clave · Ingreso Inmediato
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mt-4 flex items-center justify-between">
                    <span>Fase 1: Triage</span>
                    <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Recepción del paciente oncopediátrico con sospecha, registro de datos y dictado por voz de tamizaje inicial.
                  </p>
                  <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Ingresar directamente</span>
                    <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                      Acceso libre
                    </span>
                  </div>
                </div>

                {/* 2. Fase 2: Médico de Urgencias */}
                <div
                  onClick={() => handleSeleccionarRol("medico_urgencias")}
                  className="group relative bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 hover:border-sky-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-sky-700 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                      <HeartPulse className="w-7 h-7" />
                    </div>

                    {/* RED ALERT FOR PENDING TRIAGE CASES */}
                    {alertas.urgencias.cantidad > 0 ? (
                      <span className="animate-pulse text-[11px] font-black uppercase px-3 py-1 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1 border border-red-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>{alertas.urgencias.cantidad} Pendiente(s)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                        Requiere Clave
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mt-4 flex items-center justify-between">
                    <span>Fase 2: Médico de Urgencias</span>
                    <ArrowRight className="w-5 h-5 text-sky-700 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Valida reporte de Triage, define si el caso sospechoso aplica, emite diagnóstico y reporta al Grupo DETECTO.
                  </p>

                  {/* Red timer alert when waiting */}
                  {alertas.urgencias.cantidad > 0 && alertas.urgencias.items[0] && (
                    <div className="mt-3 bg-red-100/90 border border-red-300 text-red-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        Esperando reporte hace:
                      </span>
                      <span className="text-red-700 font-mono">
                        {formatEspera(alertas.urgencias.items[0].esperandoDesde)}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-sky-200/60 flex items-center justify-between text-xs font-bold text-sky-800">
                    <span>Usuario: Medurg1</span>
                    <span className="text-[10px] text-slate-500">Clave requerida</span>
                  </div>
                </div>

                {/* 3. Fase 3: Equipo DETECTO */}
                <div
                  onClick={() => handleSeleccionarRol("grupo_detecto")}
                  className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:border-indigo-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-700 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                      <Users className="w-7 h-7" />
                    </div>

                    {/* RED ALERT FOR PENDING DETECTO CASES */}
                    {alertas.detecto.cantidad > 0 ? (
                      <span className="animate-pulse text-[11px] font-black uppercase px-3 py-1 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1 border border-red-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>{alertas.detecto.cantidad} Pendiente(s)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                        Requiere Clave
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mt-4 flex items-center justify-between">
                    <span>Fase 3: Grupo DETECTO</span>
                    <ArrowRight className="w-5 h-5 text-indigo-700 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Revisión integral de toda la historia (Triage + Urgencias), diagnóstico del líder y registro formal del caso.
                  </p>

                  {/* Red timer alert when waiting */}
                  {alertas.detecto.cantidad > 0 && alertas.detecto.items[0] && (
                    <div className="mt-3 bg-red-100/90 border border-red-300 text-red-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        Esperando validación hace:
                      </span>
                      <span className="text-red-700 font-mono">
                        {formatEspera(alertas.detecto.items[0].esperandoDesde)}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs font-bold text-indigo-800">
                    <span>Usuario: LDetecto1</span>
                    <span className="text-[10px] text-slate-500">Clave requerida</span>
                  </div>
                </div>

                {/* 4. Super Usuario / Administrador */}
                <div
                  onClick={() => handleSeleccionarRol("super_usuario")}
                  className="group relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Control Total
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mt-4 flex items-center justify-between">
                    <span>Super Usuario / Admin</span>
                    <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Exportación a Excel, modificación de registros, papelera de reciclaje y gestión de casos.
                  </p>
                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>Usuario: AdminDet1</span>
                    <span className="text-[10px] text-slate-500">Clave requerida</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Auth Modal for protected roles */
            <div className="max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setFaseSeleccionada(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
              >
                ← Volver a selección de perfiles
              </button>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-[#0f2b5c] text-white rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {faseSeleccionada === "medico_urgencias" && "Fase 2: Médico de Urgencias"}
                      {faseSeleccionada === "grupo_detecto" && "Fase 3: Equipo DETECTO"}
                      {faseSeleccionada === "super_usuario" && "Super Usuario / Administrador"}
                    </h3>
                    <p className="text-xs text-slate-500">Ingrese sus credenciales de seguridad</p>
                  </div>
                </div>

                {errorLogin && (
                  <div className="mb-4 bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorLogin}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitAuth} className="space-y-4">
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
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 outline-none"
                        placeholder="Ingrese usuario"
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
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 outline-none"
                        placeholder="Ingrese contraseña"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0f2b5c] hover:bg-sky-900 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Iniciar Sesión en el Perfil</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border">
                  <span className="font-bold text-slate-700 block mb-0.5">Credenciales oficiales:</span>
                  {faseSeleccionada === "medico_urgencias" && (
                    <span>Usuario: <strong>Medurg1</strong> · Clave: <strong>Salvavidas2</strong></span>
                  )}
                  {faseSeleccionada === "grupo_detecto" && (
                    <span>Usuario: <strong>LDetecto1</strong> · Clave: <strong>Salva+vidas</strong></span>
                  )}
                  {faseSeleccionada === "super_usuario" && (
                    <span>Usuario: <strong>AdminDet1</strong> · Clave: <strong>Detecto159*</strong></span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

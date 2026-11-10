import React from "react";
import { UsuarioSesion, PacienteRegistro } from "../types";
import { DetectoLogo } from "./DetectoLogo";
import {
  AlertCircle,
  Database,
  Stethoscope,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  Sparkles,
  Shield,
  FileSpreadsheet,
} from "lucide-react";

interface MainMenuProps {
  usuarioActual: UsuarioSesion;
  onCerrarSesion: () => void;
  onIrAPacienteSospecha: () => void;
  onIrABaseDatos: () => void;
  onIrADiagnosticoDetecto: () => void;
  alertas: {
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
  };
  totalPacientes: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  usuarioActual,
  onCerrarSesion,
  onIrAPacienteSospecha,
  onIrABaseDatos,
  onIrADiagnosticoDetecto,
  alertas,
  totalPacientes,
}) => {
  const formatEspera = (timestamp: number) => {
    const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    return `${mins} min`;
  };

  const rolLabel = {
    triage: "Enfermería / Triage",
    medico_urgencias: "Médico de Urgencias",
    grupo_detecto: "Líder Grupo DETECTO",
    super_usuario: "Super Usuario / Administrador",
  }[usuarioActual.rol];

  const tieneAlertaUrgencias =
    (usuarioActual.rol === "medico_urgencias" || usuarioActual.rol === "super_usuario") &&
    alertas.urgencias.cantidad > 0;

  const tieneAlertaDetecto =
    (usuarioActual.rol === "grupo_detecto" || usuarioActual.rol === "super_usuario") &&
    alertas.detecto.cantidad > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* User Session Bar */}
      <div className="bg-[#0f2b5c] border border-sky-800/60 rounded-2xl p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DetectoLogo size="md" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-sky-900/90 text-sky-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-sky-700/50">
                {rolLabel}
              </span>
              <span className="text-xs text-sky-300 font-mono">
                {usuarioActual.usuario}
              </span>
            </div>
            <p className="text-sm font-black text-white mt-0.5">
              {usuarioActual.nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCerrarSesion}
            className="flex items-center gap-1.5 text-xs bg-sky-950/80 hover:bg-red-950/80 hover:text-red-200 text-sky-200 px-3 py-2 rounded-xl border border-sky-700/50 transition-colors font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar Perfil / Salir</span>
          </button>
        </div>
      </div>

      {/* Critical Red Alerts Banner (if any pending patients for Urgencias or DETECTO) */}
      {(tieneAlertaUrgencias || tieneAlertaDetecto) && (
        <div className="space-y-3">
          {tieneAlertaUrgencias && (
            <div
              onClick={onIrABaseDatos}
              className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 border-2 border-red-400 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer animate-pulse hover:brightness-105 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-red-600 rounded-xl shadow-md">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-red-200 border border-red-400/40">
                      Alerta Roja Urgencias
                    </span>
                    <span className="text-xs text-red-100 font-bold">
                      {alertas.urgencias.cantidad} paciente(s) esperando validación
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    Paciente: {alertas.urgencias.items[0]?.nombre} — Esperando hace:{" "}
                    {formatEspera(alertas.urgencias.items[0]?.esperandoDesde)}
                  </p>
                </div>
              </div>
              <button className="bg-white text-red-700 font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1 shrink-0">
                <span>Atender caso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {tieneAlertaDetecto && (
            <div
              onClick={onIrABaseDatos}
              className="bg-gradient-to-r from-rose-700 via-red-800 to-purple-900 border-2 border-rose-400 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer animate-pulse hover:brightness-105 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-rose-700 rounded-xl shadow-md">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-950 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-rose-200 border border-rose-400/40">
                      Alerta Roja Grupo DETECTO
                    </span>
                    <span className="text-xs text-rose-100 font-bold">
                      {alertas.detecto.cantidad} caso(s) esperando registro y validación
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    Paciente: {alertas.detecto.items[0]?.nombre} — Esperando hace:{" "}
                    {formatEspera(alertas.detecto.items[0]?.esperandoDesde)}
                  </p>
                </div>
              </div>
              <button className="bg-white text-rose-800 font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1 shrink-0">
                <span>Revisar caso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main 3 Menu Options Requested by User */}
      <div className="space-y-5">
        {/* BOTÓN 1: PACIENTE CON SOSPECHA (GRANDE Y DESTACADO) */}
        <div
          onClick={onIrAPacienteSospecha}
          className="group relative bg-gradient-to-r from-[#c23326] via-[#d93829] to-[#ea580c] rounded-3xl p-6 sm:p-8 text-white shadow-2xl cursor-pointer border-2 border-red-400/50 hover:border-white transition-all hover:scale-[1.01] hover:shadow-red-900/50"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-black/25 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-white/20">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping"></span>
                <span>Ruta Prioritaria Fija · 3 Fases Clínicas</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">
                PACIENTE CON SOSPECHA
              </h2>

              <p className="text-sm sm:text-base text-red-100 leading-relaxed font-medium">
                Inicio inmediato del flujo asistencial obligatorio: <strong>Fase 1 (Triage)</strong> ➔{" "}
                <strong>Fase 2 (Médico Urgencias)</strong> ➔ <strong>Fase 3 (Grupo DETECTO)</strong>. Control estricto de cronómetro continuo y dictado por voz.
              </p>

              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold">
                  ⏱ Cronómetro activo en cada fase
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold">
                  🎙 Dictado por voz habilitado
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-bold">
                  ⚡ Notificación inmediata al médico
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end justify-center shrink-0">
              <div className="bg-white text-red-700 hover:bg-red-50 p-5 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-lg transition-transform group-hover:translate-x-2">
                <span>INICIAR AHORA</span>
                <ArrowRight className="w-6 h-6" />
              </div>
              <span className="text-xs text-red-200 mt-2 font-bold italic">
                ¡Rápido que el tiempo es vida!
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid for Button 2 and Button 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BOTÓN 2: BASE DE DATOS DE PACIENTES */}
          <div
            onClick={onIrABaseDatos}
            className="group bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-sky-500 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-sky-700 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                <Database className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                {totalPacientes} Paciente(s) Registrado(s)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-5 flex items-center justify-between">
              <span>BASE DE DATOS DE PACIENTES</span>
              <ArrowRight className="w-5 h-5 text-sky-700 group-hover:translate-x-1 transition-transform" />
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Historial completo de pacientes con trazabilidad de fases (Fase 1, 2 y 3 con check list verde o marca roja).
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auditoría de tiempos de cada fase</span>
              </div>
              {usuarioActual.rol === "super_usuario" ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Super Usuario: Exportar Excel, Modificar y Papelera (10 días)</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Acceso de consulta y visualización clínica activa.
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN 3: DIAGNÓSTICO DETECTO (MÓDULO DE 8 PASOS INTACTO) */}
          <div
            onClick={onIrADiagnosticoDetecto}
            className="group bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-500 rounded-3xl p-6 shadow-xl cursor-pointer transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 bg-[#0f2b5c] text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
                <Stethoscope className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                Protocolo 8 Pasos
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-5 flex items-center justify-between">
              <span>DIAGNÓSTICO DETECTO</span>
              <ArrowRight className="w-5 h-5 text-indigo-700 group-hover:translate-x-1 transition-transform" />
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Módulo clínico completo: Sospecha, Tamizaje EVAT/PSSC, Paraclínicos, Choque/Sepsis, Antibióticos según peso y escenario, Vasopresores e informe PDF.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Calculadora de dosis exacta por peso (mg & ml/hr)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Soporte a decisiones y exportación de historia clínica en PDF.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

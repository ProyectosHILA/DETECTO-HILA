import React, { useState } from "react";
import { PacienteRegistro, UsuarioSesion, CRITERIOS_TAMIZAJE_SEPSIS } from "../types";
import { FormularioEquipoSepsisPdf } from "./FormularioEquipoSepsisPdf";
import { FormularioLaboratorios } from "./FormularioLaboratorios";
import { FormularioAnexo2Rojo } from "./FormularioAnexo2Rojo";
import { FormularioAnexo3Amarillo } from "./FormularioAnexo3Amarillo";
import { FormularioAnexo4Verde } from "./FormularioAnexo4Verde";
import { FormularioVasopresores } from "./FormularioVasopresores";
import { TableroControlDashboard } from "./TableroControlDashboard";
import * as XLSX from "xlsx";
import {
  Database,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Trash2,
  Edit,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Stethoscope,
  Activity,
  HeartPulse,
  Users,
  BarChart3,
  Table2,
  FlaskConical,
  FileCheck2,
  ShieldCheck,
  Unlock,
  Syringe,
  Wind,
} from "lucide-react";

interface BaseDatosPacientesProps {
  pacientes: PacienteRegistro[];
  papelera: (PacienteRegistro & { diasRestantes?: number })[];
  usuarioActual: UsuarioSesion;
  onEditarPaciente: (paciente: PacienteRegistro) => void;
  onEliminarPaciente: (id: string) => Promise<void> | void;
  onRestaurarPaciente: (id: string) => Promise<void> | void;
  onPurgarPaciente: (id: string) => Promise<void> | void;
  onContinuarFase: (paciente: PacienteRegistro) => void;
  onVolverAlMenu: () => void;
}

export const BaseDatosPacientes: React.FC<BaseDatosPacientesProps> = ({
  pacientes,
  papelera,
  usuarioActual,
  onEditarPaciente,
  onEliminarPaciente,
  onRestaurarPaciente,
  onPurgarPaciente,
  onContinuarFase,
  onVolverAlMenu,
}) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [mostrarPapelera, setMostrarPapelera] = useState<boolean>(false);
  const [subVista, setSubVista] = useState<"casos" | "tablero">("casos");
  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteRegistro | null>(null);
  const [ahora, setAhora] = useState<number>(Date.now());
  const [confirmacionBorrar, setConfirmacionBorrar] = useState<{
    tipo: "papelera" | "purgar";
    paciente: PacienteRegistro;
  } | null>(null);
  const [procesandoBorrado, setProcesandoBorrado] = useState<boolean>(false);
  const [avisoAccion, setAvisoAccion] = useState<{
    tipo: "ok" | "error";
    mensaje: string;
  } | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ejecutarBorradoConfirmado = async () => {
    if (!confirmacionBorrar || procesandoBorrado) return;
    setProcesandoBorrado(true);
    setAvisoAccion(null);
    try {
      const { tipo, paciente } = confirmacionBorrar;
      if (tipo === "papelera") {
        await onEliminarPaciente(paciente.id);
        if (pacienteDetalle?.id === paciente.id) setPacienteDetalle(null);
        setAvisoAccion({
          tipo: "ok",
          mensaje: `Registro ${paciente.codigo} movido a la papelera. Puede restaurarlo dentro de los próximos 10 días.`,
        });
      } else {
        await onPurgarPaciente(paciente.id);
        setAvisoAccion({
          tipo: "ok",
          mensaje: `Registro ${paciente.codigo} eliminado definitivamente de la base de datos.`,
        });
      }
      setConfirmacionBorrar(null);
    } catch (err: any) {
      setAvisoAccion({
        tipo: "error",
        mensaje:
          err?.message ||
          "No se pudo completar la eliminación del registro en el servidor.",
      });
      setConfirmacionBorrar(null);
    } finally {
      setProcesandoBorrado(false);
    }
  };

  const esSuperUsuario = usuarioActual.rol === "super_usuario";

  const formatearTiempo = (totalSeg?: number) => {
    if (!totalSeg || totalSeg <= 0) return "—";
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const formatearFecha = (ts: number) => {
    return new Date(ts).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  // Filter patients
  const pacientesFiltrados = pacientes.filter((p) => {
    const term = terminoBusqueda.toLowerCase();
    const textoMatch =
      (p.identificacionPaciente && p.identificacionPaciente.toLowerCase().includes(term)) ||
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.apellido && p.apellido.toLowerCase().includes(term)) ||
      p.codigo.toLowerCase().includes(term) ||
      (p.diagnosticoTriage && p.diagnosticoTriage.toLowerCase().includes(term));

    if (!textoMatch) return false;

    if (filtroEstado === "completados") return p.fase1Completada && p.fase2Completada && p.fase3Completada;
    if (filtroEstado === "pendientes") return !p.fase3Completada && p.estado !== "descartado";
    if (filtroEstado === "descartados") return p.estado === "descartado";

    return true;
  });

  // Export to Genuine Excel (.xlsx) using xlsx package
  const handleExportarExcel = () => {
    if (!esSuperUsuario) {
      setAvisoAccion({
        tipo: "error",
        mensaje: "Solo el Super Usuario (AdminDet1) tiene permisos para descargar reportes en Excel.",
      });
      return;
    }

    const dataParaExcel = pacientes.map((p) => {
      const catVal = p.categoriaTriageValidada || p.categoriaTriage || 1;
      const edadTexto = [
        p.edadAnos ? `${p.edadAnos} años` : "",
        p.edadMeses ? `${p.edadMeses} meses` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        "Código Caso": p.codigo,
        "Nombre Paciente": p.nombre || "",
        "Identificación Paciente": p.identificacionPaciente || "Sin ID",
        "Edad": edadTexto || "Sin registro",
        "Peso Ingreso (kg)": p.vitalesIngreso?.pesoKg || "",
        "IMC": p.vitalesIngreso?.imc || "",
        "Hora Ingreso Bogotá": p.vitalesIngreso?.horaIngreso || "",
        "Fecha Ingreso": formatearFecha(p.fechaCreacion),
        "Categoría Triage": p.categoriaTriageValidadaLabel || p.categoriaTriageLabel || `Categoría ${p.categoriaTriage || 1}`,
        "Motivo Cambio Categoría": p.motivoCambioCategoria || "",
        "Puntos Tamizaje (0-8)": p.puntajeTamizaje ?? 0,
        "Estado General": p.estado,
        "Fase 1 (Triage)": p.fase1Completada ? "COMPLETADA (✓)" : "NO COMPLETADA (✗)",
        "Tiempo Fase 1": formatearTiempo(p.tiempoFase1Segundos),
        "Tamizaje / Diagnóstico Triage": p.diagnosticoTriage || "",
        "Fase 2 (Urgencias)": p.fase2Completada ? "COMPLETADA (✓)" : "NO TRASCENDIÓ (✗)",
        "Tiempo Fase 2": formatearTiempo(p.tiempoFase2Segundos),
        "Aprobación Urgencias": p.aplicaSepsis !== false ? "APROBADO PARA FASE 3" : "NO APROBADO (DESCARTADO)",
        "Diagnóstico Urgencias": p.diagnosticoUrgencias || "",
        "Motivo Descarte": p.motivoDescarte || "",
        "Fase 3 (DETECTO)": p.fase3Completada ? "COMPLETADA (✓)" : "NO TRASCENDIÓ (✗)",
        "Tiempo Fase 3": formatearTiempo(p.tiempoFase3Segundos),
        "Diagnóstico / Obs DETECTO": p.diagnosticoDetecto || "",
        "Submódulo Validación Triage": formatearTiempo(p.tiemposSubmodulos?.validacionTriageSegundos),
        "Submódulo Checklist 1": formatearTiempo(p.tiemposSubmodulos?.checklist1Segundos),
        "Submódulo Laboratorios": formatearTiempo(p.tiemposSubmodulos?.laboratoriosSegundos),
        "Origen Laboratorios": p.tiemposSubmodulos?.laboratoriosCompletadoPor || "",
        "Submódulo Anexo Clínico": formatearTiempo(p.tiemposSubmodulos?.anexoSegundos),
        "Submódulo Vasopresores (Cat 3)":
          catVal === 3
            ? p.estadosModulos?.vasopresoresCompletado
              ? formatearTiempo(p.tiemposSubmodulos?.vasopresoresSegundos)
              : "Pendiente"
            : "N/A",
        "Módulo TERAPIAS (Cat 3)":
          catVal === 3
            ? p.estadosModulos?.terapiasCompletado ||
              p.laboratorios?.gasesPaFiO2?.checked ||
              p.laboratorios?.spFiO2?.checked
              ? `Completado (${formatearTiempo(p.tiemposSubmodulos?.terapiasSegundos)})`
              : "Pendiente"
            : "N/A",
        "Cierre Anticipado": p.habilitadoCierreAnticipado ? `SÍ (${p.motivoCierreAnticipado || ""})` : "NO",
        "Tiempo Total Acumulado": formatearTiempo(p.tiempoTotalSegundos),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes_DETECTO_HILA");

    const nowStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Reporte_Sepsis_DETECTO_HILA_${nowStr}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onVolverAlMenu}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          ← Volver al menú principal
        </button>

        <div className="flex items-center gap-3">
          {/* Super User Excel Button */}
          {esSuperUsuario && (
            <button
              onClick={handleExportarExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-colors"
              title="Descargar reporte completo en formato Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Descargar Historial Excel (.xlsx)</span>
            </button>
          )}

          {/* Super User Trash Toggle */}
          {esSuperUsuario && (
            <button
              onClick={() => setMostrarPapelera(!mostrarPapelera)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                mostrarPapelera
                  ? "bg-amber-600 text-white border-amber-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Papelera ({papelera.length})</span>
            </button>
          )}
        </div>
      </div>

      {avisoAccion && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center justify-between gap-3 border shadow-sm ${
            avisoAccion.tipo === "ok"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <span>{avisoAccion.mensaje}</span>
          <button
            type="button"
            onClick={() => setAvisoAccion(null)}
            className="text-xs font-black px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-700 text-white rounded-2xl shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {mostrarPapelera
                  ? "Papelera de Reciclaje (Super Usuario)"
                  : "Centro de Control de Casos"}
              </h2>
              <p className="text-xs text-slate-500">
                {mostrarPapelera
                  ? "Los registros eliminados se almacenan aquí y desaparecen automáticamente a los 10 días."
                  : "Historial completo de trazabilidad por fases y Tablero de Control analítico."}
              </p>
            </div>
          </div>

          {/* Sub-tabs & Filters Bar */}
          {!mostrarPapelera && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Ventana Tab Selector: Registro de Casos | Tablero de Control */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSubVista("casos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    subVista === "casos"
                      ? "bg-[#0f2b5c] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Registro de Casos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubVista("tablero")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    subVista === "tablero"
                      ? "bg-[#0f2b5c] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Tablero de Control</span>
                </button>
              </div>

              {subVista === "casos" && (
                <>
                  <div className="relative min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar paciente o HC..."
                      value={terminoBusqueda}
                      onChange={(e) => setTerminoBusqueda(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="completados">3 Fases Completadas (Verdes)</option>
                    <option value="pendientes">Pendientes en Curso</option>
                    <option value="descartados">Descartados en Urgencias</option>
                  </select>
                </>
              )}
            </div>
          )}
        </div>

        {/* VIEW 1: PAPELERA DE RECICLAJE (SOLO SUPER USUARIO) */}
        {mostrarPapelera ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
              <span className="flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Esta papelera es visible únicamente para el Super Usuario. Los registros aquí contenidos se purgan de forma definitiva a los 10 días.
              </span>
            </div>

            {papelera.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No hay pacientes en la papelera de reciclaje.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3">Código</th>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">Diagnóstico Triage</th>
                      <th className="p-3">Días Restantes</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {papelera.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">{p.codigo}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {p.nombre} {p.apellido}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-600">
                          {p.diagnosticoTriage}
                        </td>
                        <td className="p-3">
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                            Expira en {p.diasRestantes ?? 10} días
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => onRestaurarPaciente(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                            title="Restaurar a base de datos activa"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmacionBorrar({ tipo: "purgar", paciente: p })
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Eliminar de forma permanente"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Purgar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : subVista === "tablero" ? (
          /* VIEW 2B: TABLERO DE CONTROL ANALÍTICO */
          <TableroControlDashboard
            pacientes={pacientes}
            onSeleccionarPacienteParaDetalle={(p) => setPacienteDetalle(p)}
          />
        ) : (
          /* VIEW 2A: TABLA PRINCIPAL DE PACIENTES CON 3 COLUMNAS DE FASES */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f2b5c] text-white font-black uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 rounded-tl-xl">Código / Paciente</th>
                  <th className="p-3.5 text-center">
                    <div className="flex flex-col items-center">
                      <span>Fase 1</span>
                      <span className="text-[9px] text-sky-200 font-normal">Triage</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-center">
                    <div className="flex flex-col items-center">
                      <span>Fase 2</span>
                      <span className="text-[9px] text-sky-200 font-normal">Urgencias</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-center">
                    <div className="flex flex-col items-center">
                      <span>Fase 3</span>
                      <span className="text-[9px] text-sky-200 font-normal">DETECTO</span>
                    </div>
                  </th>
                  <th className="p-3.5">Tiempos</th>
                  <th className="p-3.5">Diagnósticos Resumen</th>
                  <th className="p-3.5 text-right rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pacientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No se encontraron pacientes registrados con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  pacientesFiltrados.map((p) => {
                    const esCompletado = p.fase1Completada && p.fase2Completada && p.fase3Completada;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Paciente y Código */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border">
                              {p.codigo}
                            </span>
                            {p.categoriaTriage === 3 && (
                              <span className="text-[9px] font-black bg-[#ff9999] text-black px-1.5 py-0.2 rounded border border-[#e65c5c]">
                                Cat 3 ({p.puntajeTamizaje} pts)
                              </span>
                            )}
                            {p.categoriaTriage === 2 && (
                              <span className="text-[9px] font-black bg-[#f4b400] text-black px-1.5 py-0.2 rounded border border-[#d99b00]">
                                Cat 2 ({p.puntajeTamizaje} pts)
                              </span>
                            )}
                            {p.categoriaTriage === 1 && (
                              <span className="text-[9px] font-black bg-[#7ecc61] text-black px-1.5 py-0.2 rounded border border-[#5ba83e]">
                                Cat 1 ({p.puntajeTamizaje} pts)
                              </span>
                            )}
                          </div>
                          {p.nombre && (
                            <div className="font-black text-slate-900 text-sm mt-1 leading-tight">
                              {p.nombre}
                            </div>
                          )}
                          <div className="font-mono font-bold text-sky-900 text-xs mt-0.5">
                            ID: {p.identificacionPaciente || "Sin identificación"}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatearFecha(p.fechaCreacion)}
                          </span>
                        </td>

                        {/* COLUMNA FASE 1: Check List Verde */}
                        <td className="p-3.5 text-center">
                          {p.fase1Completada ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                                {formatearTiempo(p.tiempoFase1Segundos)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* COLUMNA FASE 2: Check List Verde o Marca Roja si no trascendió */}
                        <td className="p-3.5 text-center">
                          {p.fase2Completada ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                                {formatearTiempo(p.tiempoFase2Segundos)}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-red-100 text-red-700 p-1 rounded-full border border-red-300">
                                <XCircle className="w-5 h-5 text-red-600" />
                              </span>
                              <span className="text-[10px] font-bold text-red-700 mt-0.5">
                                {p.estado === "descartado" ? "Descartado" : "Pendiente"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* COLUMNA FASE 3: Check List Verde o Tiempo en Curso si reportado a DETECTO */}
                        <td className="p-3.5 text-center">
                          {p.fase3Completada ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 mt-0.5 font-mono tabular-nums">
                                {p.tiempoFase3Segundos > 0
                                  ? formatearTiempo(p.tiempoFase3Segundos)
                                  : p.timestampPasoFase3 && p.timestampFinalizado
                                  ? formatearTiempo(Math.max(1, Math.floor((p.timestampFinalizado - p.timestampPasoFase3) / 1000)))
                                  : "Directo F2"}
                              </span>
                            </div>
                          ) : (p.reportadoADetecto || p.estado === "pendiente_detecto") && p.timestampPasoFase3 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-purple-100 text-purple-700 p-1 rounded-full border border-purple-300 animate-pulse">
                                <Clock className="w-5 h-5 text-purple-700" />
                              </span>
                              <span className="text-[10px] font-black text-purple-800 mt-0.5 font-mono tabular-nums">
                                {formatearTiempo(Math.max(0, Math.floor((ahora - p.timestampPasoFase3) / 1000)))}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-red-100 text-red-700 p-1 rounded-full border border-red-300">
                                <XCircle className="w-5 h-5 text-red-600" />
                              </span>
                              <span className="text-[10px] font-bold text-red-700 mt-0.5">
                                {p.estado === "descartado" ? "No aplicó" : "Pendiente"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Tiempos */}
                        <td className="p-3.5">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex justify-between text-slate-500">
                              <span>Total:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {formatearTiempo(p.tiempoTotalSegundos)}
                              </span>
                            </div>
                            {p.fase1Completada && !p.fase3Completada && (
                              <span className="inline-block text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                En proceso
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Diagnósticos Resumen */}
                        <td className="p-3.5 max-w-xs">
                          <div className="space-y-1">
                            {p.diagnosticoTriage && (
                              <div className="truncate text-slate-700">
                                <span className="font-bold text-emerald-700">Triage:</span>{" "}
                                {p.diagnosticoTriage}
                              </div>
                            )}
                            {p.diagnosticoUrgencias && (
                              <div className="truncate text-slate-700">
                                <span className="font-bold text-sky-700">Urg:</span>{" "}
                                {p.diagnosticoUrgencias}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="p-3.5 text-right space-x-1.5">
                          {/* Ver Detalle para todos */}
                          <button
                            onClick={() => setPacienteDetalle(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Ver detalle completo de la historia"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Continuar fase si está pendiente */}
                          {!esCompletado && p.estado !== "descartado" && (
                            <button
                              onClick={() => onContinuarFase(p)}
                              className="bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                              title="Continuar siguiente fase de atención"
                            >
                              <span>Atender</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* ACCIONES EXCLUSIVAS DE SUPER USUARIO */}
                          {esSuperUsuario && (
                            <>
                              <button
                                onClick={() => onEditarPaciente(p)}
                                className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                                title="Modificar datos del registro (Super Usuario)"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmacionBorrar({ tipo: "papelera", paciente: p })
                                }
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors cursor-pointer"
                                title="Borrar registro a papelera (Super Usuario)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL HISTORIA CLÍNICA COMPLETA DE PACIENTE */}
      {pacienteDetalle && (() => {
        const detalleActual =
          pacientes.find((x) => x.id === pacienteDetalle.id) ||
          papelera.find((x) => x.id === pacienteDetalle.id) ||
          pacienteDetalle;
        const catOriginalDetalle: 1 | 2 | 3 = detalleActual.categoriaTriage || 1;
        const catValidadaDetalle: 1 | 2 | 3 =
          detalleActual.categoriaTriageValidada || catOriginalDetalle;
        const huboCambioCat = catValidadaDetalle !== catOriginalDetalle;
        const estadosDetalle = {
          fase1Validada:
            detalleActual.estadosModulos?.fase1Validada ??
            Boolean(detalleActual.aprobadoUrgencias || detalleActual.fase2Completada),
          checklist1Completado:
            detalleActual.estadosModulos?.checklist1Completado ??
            Boolean(
              detalleActual.formularioEquipoSepsis &&
                Object.keys(detalleActual.formularioEquipoSepsis).length > 0
            ),
          laboratoriosCompletado:
            detalleActual.estadosModulos?.laboratoriosCompletado ??
            Boolean(
              detalleActual.laboratorios && Object.keys(detalleActual.laboratorios).length > 0
            ),
          anexoCompletado:
            detalleActual.estadosModulos?.anexoCompletado ??
            Boolean(
              (catValidadaDetalle === 3 &&
                detalleActual.anexo2Data &&
                Object.keys(detalleActual.anexo2Data).length > 0) ||
                (catValidadaDetalle === 2 &&
                  detalleActual.anexo3Data &&
                  Object.keys(detalleActual.anexo3Data).length > 0) ||
                (catValidadaDetalle === 1 &&
                  detalleActual.anexo4Data &&
                  Object.keys(detalleActual.anexo4Data).length > 0)
            ),
          vasopresoresCompletado:
            detalleActual.estadosModulos?.vasopresoresCompletado ??
            Boolean(
              detalleActual.vasopresoresData &&
                Object.keys(detalleActual.vasopresoresData).length > 0
            ),
          terapiasCompletado:
            detalleActual.estadosModulos?.terapiasCompletado ??
            Boolean(
              detalleActual.laboratorios?.gasesPaFiO2?.checked ||
                detalleActual.laboratorios?.spFiO2?.checked
            ),
        };
        const vitalesDetalle = detalleActual.vitalesIngreso;
        const tieneEdadOVitales = Boolean(
          detalleActual.edadAnos ||
            detalleActual.edadMeses ||
            (vitalesDetalle &&
              Object.values(vitalesDetalle).some((v) => typeof v === "string" && v.trim() !== ""))
        );
        const tsSubDetalle = detalleActual.tiemposSubmodulos || {};
        const tiempoFase3Detalle =
          detalleActual.tiempoFase3Segundos > 0
            ? detalleActual.tiempoFase3Segundos
            : detalleActual.timestampPasoFase3 && detalleActual.timestampFinalizado
            ? Math.max(
                1,
                Math.floor(
                  (detalleActual.timestampFinalizado - detalleActual.timestampPasoFase3) / 1000
                )
              )
            : 0;
        const nombreDefaultDetalle = detalleActual.nombre
          ? `${detalleActual.nombre} (ID: ${detalleActual.identificacionPaciente})`
          : detalleActual.identificacionPaciente || detalleActual.codigo;

        const labOrigenTexto =
          tsSubDetalle.laboratoriosCompletadoPor === "laboratorios"
            ? "Módulo Externo de Laboratorios"
            : tsSubDetalle.laboratoriosCompletadoPor === "fase3"
            ? "Equipo DETECTO (Fase 3)"
            : tsSubDetalle.laboratoriosCompletadoPor === "fase2"
            ? "Médico de Urgencias (Fase 2)"
            : null;

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-black bg-slate-900 text-sky-300 px-2.5 py-1 rounded-lg">
                      {detalleActual.codigo}
                    </span>
                    <span className="text-xs font-black bg-sky-100 text-sky-900 px-3 py-1 rounded-lg border border-sky-300">
                      ID: {detalleActual.identificacionPaciente || "Sin identificación"}
                    </span>

                    {catValidadaDetalle === 3 && (
                      <span className="text-[11px] font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded border border-[#e65c5c]">
                        Cat 3: CHOQUE / DOMᵃ ({detalleActual.puntajeTamizaje ?? 0} pts)
                      </span>
                    )}
                    {catValidadaDetalle === 2 && (
                      <span className="text-[11px] font-black bg-[#f4b400] text-black px-2.5 py-0.5 rounded border border-[#d99b00]">
                        Cat 2: ALERTA SEPSIS ({detalleActual.puntajeTamizaje ?? 0} pts)
                      </span>
                    )}
                    {catValidadaDetalle === 1 && (
                      <span className="text-[11px] font-black bg-[#7ecc61] text-black px-2.5 py-0.5 rounded border border-[#5ba83e]">
                        Cat 1: BAJA POSIBILIDAD ({detalleActual.puntajeTamizaje ?? 0} pts)
                      </span>
                    )}

                    {huboCambioCat && (
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        Reclasificado desde Triage Cat {catOriginalDetalle}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Historia Clínica Digital de Sepsis{" "}
                    {detalleActual.nombre ? `· ${detalleActual.nombre}` : ""}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>Fecha de ingreso: {formatearFecha(detalleActual.fechaCreacion)}</span>
                    {detalleActual.timestampFinalizado && (
                      <span>Cierre: {formatearFecha(detalleActual.timestampFinalizado)}</span>
                    )}
                    <span>Estado: <strong className="text-slate-700 uppercase">{detalleActual.estado}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPacienteDetalle(null)}
                  className="text-slate-500 hover:text-slate-800 font-black text-sm bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* 3 Time Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-2xl shadow-sm">
                  <span className="text-[11px] font-bold text-sky-800 uppercase block">
                    Fase 1 (Triage)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-sky-950 mt-0.5 block">
                    {formatearTiempo(detalleActual.tiempoFase1Segundos)}
                  </span>
                </div>
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl shadow-sm">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">
                    Fase 2 (Urgencias)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-950 mt-0.5 block">
                    {formatearTiempo(detalleActual.tiempoFase2Segundos)}
                  </span>
                </div>
                <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-2xl shadow-sm">
                  <span className="text-[11px] font-bold text-purple-800 uppercase block">
                    Fase 3 (DETECTO)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-purple-950 mt-0.5 block">
                    {formatearTiempo(tiempoFase3Detalle)}
                  </span>
                </div>
              </div>

              {/* Total time banner */}
              <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md">
                <span className="flex items-center gap-2 text-sky-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Tiempo Total de Respuesta Asistencial:</span>
                </span>
                <span className="font-mono text-sm text-emerald-300 font-black">
                  {formatearTiempo(detalleActual.tiempoTotalSegundos)}
                </span>
              </div>

              {/* TARJETAS CLÍNICAS EXPANDIDAS DE CADA FASE */}
              <div className="space-y-5">
                {/* TARJETA 1: FASE 1 - TRIAGE / TAMIZAJE DE SEPSIS */}
                <div className="bg-white border-2 border-sky-400 rounded-2xl p-5 shadow-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-600 text-white rounded-xl shadow-sm">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          1. Diagnóstico y Tamizaje en Fase 1 (Triage)
                        </h4>
                        <span className="text-xs text-sky-700 font-bold">
                          Evaluador: {detalleActual.autorTriage || "Enfermería Triage"} · Tiempo:{" "}
                          {formatearTiempo(detalleActual.tiempoFase1Segundos)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-sky-100 text-sky-900 px-3 py-1 rounded-full border border-sky-300">
                      {detalleActual.puntajeTamizaje ?? 0} / 8 Puntos
                    </span>
                  </div>

                  {/* TABLA COMPLETA CON LOS 8 CRITERIOS EVALUADOS */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                      Tabla de Criterios de Tamizaje Evaluados:
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                      {CRITERIOS_TAMIZAJE_SEPSIS.map((criterio, idx) => {
                        const cumplido =
                          detalleActual.criteriosTamizaje &&
                          detalleActual.criteriosTamizaje[idx] === true;

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                              cumplido ? "bg-emerald-50/80 font-bold text-slate-900" : "text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-slate-400 text-[11px] w-4">
                                {idx + 1}.
                              </span>
                              <span>{criterio}</span>
                            </div>

                            {cumplido ? (
                              <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg text-[11px] shrink-0">
                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                <span>Presente (1 pt)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] px-2 py-0.5 shrink-0">
                                No marcado (0 pt)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EDAD INGRESO Y EXAMEN FÍSICO / SIGNOS VITALES DE INGRESO */}
                  {tieneEdadOVitales && (
                    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-sky-900 tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-sky-600" />
                          <span>Edad Ingreso &amp; Examen Físico — Signos Vitales (Triage)</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          {(detalleActual.edadAnos || detalleActual.edadMeses) && (
                            <span className="bg-white border border-sky-300 text-sky-900 px-2.5 py-0.5 rounded-lg">
                              Edad: {detalleActual.edadAnos ? `${detalleActual.edadAnos} años` : ""}{" "}
                              {detalleActual.edadMeses ? `${detalleActual.edadMeses} meses` : ""}
                            </span>
                          )}
                          {vitalesDetalle?.horaIngreso && (
                            <span className="bg-sky-900 text-sky-100 px-2.5 py-0.5 rounded-lg font-mono">
                              Hora Bogotá: {vitalesDetalle.horaIngreso}
                            </span>
                          )}
                        </div>
                      </div>

                      {vitalesDetalle && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                          {[
                            { label: "TA Sistólica", val: vitalesDetalle.pas, unit: "mmHg" },
                            { label: "TA Diastólica", val: vitalesDetalle.pad, unit: "mmHg" },
                            { label: "TA Media (PAM)", val: vitalesDetalle.pam, unit: "mmHg" },
                            { label: "Temperatura", val: vitalesDetalle.temperatura, unit: "°C" },
                            { label: "Frec. Cardíaca", val: vitalesDetalle.fc, unit: "lpm" },
                            { label: "Frec. Respiratoria", val: vitalesDetalle.fr, unit: "rpm" },
                            { label: "SatO₂", val: vitalesDetalle.satO2, unit: "%" },
                            { label: "Peso Actual", val: vitalesDetalle.pesoKg, unit: "kg" },
                            { label: "IMC", val: vitalesDetalle.imc, unit: "kg/m²" },
                            { label: "Escala de Dolor", val: vitalesDetalle.escalaDolor, unit: "" },
                            { label: "Neurológico", val: vitalesDetalle.neurologico, unit: "" },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="bg-white border border-sky-200/80 rounded-lg px-2.5 py-1.5"
                            >
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                {item.label}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {item.val && item.val.trim() !== ""
                                  ? `${item.val}${item.unit ? ` ${item.unit}` : ""}`
                                  : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Banner de Clasificación Triage */}
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1">
                      Clasificación Inicial Registrada en Triage:
                    </span>
                    {catOriginalDetalle === 3 && (
                      <div className="bg-[#ff9999] border-2 border-[#e65c5c] text-black font-black text-center py-2.5 px-4 rounded-xl text-sm shadow-sm">
                        ALERTA CHOQUE SEPTICOᵇ O DOMᵃ (Categoría 3)
                      </div>
                    )}
                    {catOriginalDetalle === 2 && (
                      <div className="bg-[#f4b400] border-2 border-[#d99b00] text-black font-black text-center py-2.5 px-4 rounded-xl text-sm shadow-sm">
                        ALERTA DE SEPSIS (SIN DOMᵃ) (Categoría 2)
                      </div>
                    )}
                    {catOriginalDetalle === 1 && (
                      <div className="bg-[#7ecc61] border-2 border-[#5ba83e] text-black font-black text-center py-2.5 px-4 rounded-xl text-sm shadow-sm">
                        BAJA POSIBILIDAD DE SEPSIS (Categoría 1)
                      </div>
                    )}
                  </div>

                  {/* Resumen redactado en Triage */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Notas / Diagnóstico en Triage:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                      {detalleActual.diagnosticoTriage || "Sin notas adicionales registradas en Triage"}
                    </p>
                  </div>
                </div>

                {/* TARJETA 2: FASE 2 - URGENCIAS Y TODOS SUS SUBMÓDULOS + LABORATORIO */}
                <div className="bg-white border-2 border-amber-400 rounded-2xl p-5 shadow-md space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-sm">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          2. Fase 2 (Urgencias), Submódulos y Laboratorios
                        </h4>
                        <span className="text-xs text-amber-800 font-bold">
                          Evaluador: {detalleActual.autorUrgencias || "Médico de Urgencias"} · Tiempo:{" "}
                          {formatearTiempo(detalleActual.tiempoFase2Segundos)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full border ${
                        detalleActual.aplicaSepsis !== false
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {detalleActual.aplicaSepsis !== false ? "SÍ APLICA SEPSIS" : "DESCARTADO"}
                    </span>
                  </div>

                  {/* Resumen Estado de Submódulos (4 estándar + Vasopresores/TERAPIAS en Cat 3) */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      catValidadaDetalle === 3 ? "lg:grid-cols-5" : "lg:grid-cols-4"
                    } gap-2.5`}
                  >
                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        estadosDetalle.fase1Validada
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-amber-50 border-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-800">Submódulo 1</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            estadosDetalle.fase1Validada
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-200 text-amber-950"
                          }`}
                        >
                          {estadosDetalle.fase1Validada ? "✓ Validado" : "Pendiente"}
                        </span>
                      </div>
                      <span className="block font-bold text-slate-700 mt-1">
                        Validación Triage
                      </span>
                      <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                        Tiempo: {formatearTiempo(tsSubDetalle.validacionTriageSegundos)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        estadosDetalle.checklist1Completado
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-rose-50 border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-800">Submódulo 2</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            estadosDetalle.checklist1Completado
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-200 text-rose-900"
                          }`}
                        >
                          {estadosDetalle.checklist1Completado ? "✓ Diligenciado" : "Pendiente"}
                        </span>
                      </div>
                      <span className="block font-bold text-slate-700 mt-1">
                        Lista de Chequeo 1
                      </span>
                      <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                        Tiempo: {formatearTiempo(tsSubDetalle.checklist1Segundos)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        estadosDetalle.laboratoriosCompletado
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-rose-50 border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-800">Submódulo 3 / Lab</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            estadosDetalle.laboratoriosCompletado
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-200 text-rose-900"
                          }`}
                        >
                          {estadosDetalle.laboratoriosCompletado ? "✓ Completado" : "Pendiente"}
                        </span>
                      </div>
                      <span className="block font-bold text-slate-700 mt-1">
                        Resultados Laboratorio
                      </span>
                      <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                        Tiempo: {formatearTiempo(tsSubDetalle.laboratoriosSegundos)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        estadosDetalle.anexoCompletado
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-rose-50 border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-800">Submódulo 4</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            estadosDetalle.anexoCompletado
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-200 text-rose-900"
                          }`}
                        >
                          {estadosDetalle.anexoCompletado ? "✓ Completado" : "Pendiente"}
                        </span>
                      </div>
                      <span className="block font-bold text-slate-700 mt-1">
                        Anexo {catValidadaDetalle === 3 ? "2 Rojo" : catValidadaDetalle === 2 ? "3 Amarillo" : "4 Verde"}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                        Tiempo: {formatearTiempo(tsSubDetalle.anexoSegundos)}
                      </span>
                    </div>

                    {catValidadaDetalle === 3 && (
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          estadosDetalle.vasopresoresCompletado
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-rose-50 border-rose-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-800">Submódulo 5</span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              estadosDetalle.vasopresoresCompletado
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-200 text-rose-900"
                            }`}
                          >
                            {estadosDetalle.vasopresoresCompletado ? "✓ Completado" : "Pendiente"}
                          </span>
                        </div>
                        <span className="block font-bold text-slate-700 mt-1">
                          Vasopresores Periféricos
                        </span>
                        <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                          Tiempo: {formatearTiempo(tsSubDetalle.vasopresoresSegundos)}
                        </span>
                      </div>
                    )}
                  </div>

                  {catValidadaDetalle === 3 && (
                    <div
                      className={`rounded-xl border px-3.5 py-2.5 space-y-1.5 text-xs ${
                        estadosDetalle.terapiasCompletado
                          ? "bg-cyan-50 border-cyan-300 text-cyan-950"
                          : "bg-amber-50 border-amber-300 text-amber-950"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-black flex items-center gap-2">
                          <Wind className="w-4 h-4 text-cyan-700" />
                          <span>
                            Módulo TERAPIAS (Categoría 3 Choque Séptico — Gases Venosos, PaFiO₂ y SpFiO₂):
                          </span>
                        </span>
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            estadosDetalle.terapiasCompletado
                              ? "bg-cyan-700 text-white"
                              : "bg-amber-200 text-amber-950"
                          }`}
                        >
                          {estadosDetalle.terapiasCompletado
                            ? `✓ Diligenciado por Terapias (${formatearTiempo(tsSubDetalle.terapiasSegundos)})`
                            : "Pendiente en Módulo TERAPIAS"}
                        </span>
                      </div>
                      {(detalleActual.laboratorios?.lactatoSerico?.valor ||
                        detalleActual.laboratorios?.gasesPaFiO2?.resultado ||
                        detalleActual.laboratorios?.spFiO2?.resultado ||
                        (detalleActual.laboratorios?.fotosGases?.length || 0) > 0) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-800 pt-1 border-t border-cyan-200/70">
                          <span>
                            Lactato (cLac):{" "}
                            <strong>{detalleActual.laboratorios?.lactatoSerico?.valor || "—"}</strong>
                          </span>
                          <span>
                            PaFiO₂:{" "}
                            <strong>{detalleActual.laboratorios?.gasesPaFiO2?.resultado || "—"}</strong>
                          </span>
                          <span>
                            SpFiO₂ (SaFiO₂):{" "}
                            <strong>{detalleActual.laboratorios?.spFiO2?.resultado || "—"}</strong>
                          </span>
                          {(detalleActual.laboratorios?.fotosGases?.length || 0) > 0 && (
                            <span className="bg-cyan-700 text-white px-2 py-0.5 rounded-full text-[10px] font-sans font-black">
                              {detalleActual.laboratorios?.fotosGases?.length} foto(s) guardada(s) abajo
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBMÓDULO 1: VALIDACIÓN MÉDICA DE TRIAGE Y CONCEPTO */}
                  <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                        Submódulo 1 · Validación Médica de Triage y Concepto Clínico
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        Categoría Validada:{" "}
                        <strong className="text-slate-900">
                          {detalleActual.categoriaTriageValidadaLabel ||
                            detalleActual.categoriaTriageLabel ||
                            `Categoría ${catValidadaDetalle}`}
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-amber-200 p-3 rounded-xl">
                        <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                          Decisión sobre Categoría de Triage:
                        </span>
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {detalleActual.aprobadoUrgencias !== false && !detalleActual.motivoCambioCategoria ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Categoría de Triage Confirmada (Cat {catValidadaDetalle})</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                Reclasificada: Cat {catOriginalDetalle} → Cat {catValidadaDetalle}
                              </span>
                            </>
                          )}
                        </span>
                        {detalleActual.motivoCambioCategoria && (
                          <p className="text-xs text-slate-700 mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <strong>Motivo del cambio:</strong> {detalleActual.motivoCambioCategoria}
                          </p>
                        )}
                      </div>

                      <div className="bg-white border border-amber-200 p-3 rounded-xl">
                        <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                          Resolución Asistencial:
                        </span>
                        <span className="text-xs font-black text-slate-900 block">
                          {detalleActual.aplicaSepsis === false
                            ? `Descartado en Urgencias (${detalleActual.motivoDescarte || "Sin motivo"})`
                            : detalleActual.reportadoADetecto
                            ? "✓ Reportado a Equipo DETECTO para seguimiento y cierre"
                            : "En atención por Médico de Urgencias"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                        Concepto / Nota Clínica Médico de Urgencias:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                        {detalleActual.diagnosticoUrgencias || "Sin diagnóstico médico registrado"}
                      </p>
                    </div>
                  </div>

                  {/* SUBMÓDULO 2: LISTA DE CHEQUEO 1 (SIEMPRE VISIBLE TAL CUAL SE DILIGENCIÓ) */}
                  <div className="border-2 border-[#007b8f]/30 rounded-2xl p-4 bg-[#f4fbfc] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-[#074c5d] tracking-wider flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-[#007b8f]" />
                        <span>Submódulo 2 · Lista de Chequeo 1 — Evaluación por Equipo de Sepsis</span>
                      </span>
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          estadosDetalle.checklist1Completado
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        {estadosDetalle.checklist1Completado
                          ? `✓ Diligenciado (${formatearTiempo(tsSubDetalle.checklist1Segundos)})`
                          : "Pendiente / Sin guardar"}
                      </span>
                    </div>
                    <FormularioEquipoSepsisPdf
                      data={detalleActual.formularioEquipoSepsis || {}}
                      soloLectura={true}
                    />
                  </div>

                  {/* SUBMÓDULO 3: RESULTADOS DE LABORATORIO (FASE 2 / MÓDULO EXTERNO DE LABORATORIOS) */}
                  <div className="border-2 border-teal-500/35 rounded-2xl p-4 bg-teal-50/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-teal-700" />
                        <span>Submódulo 3 / Laboratorio · Paraclínicos, PaFiO₂/SpFiO₂ y Hemocultivos</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {labOrigenTexto && (
                          <span className="text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300 px-2.5 py-0.5 rounded-full">
                            Origen: {labOrigenTexto}
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                            estadosDetalle.laboratoriosCompletado
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {estadosDetalle.laboratoriosCompletado
                            ? `✓ Diligenciado (${formatearTiempo(tsSubDetalle.laboratoriosSegundos)})`
                            : "Pendiente / Sin guardar"}
                        </span>
                      </div>
                    </div>

                    <FormularioLaboratorios
                      data={detalleActual.laboratorios || {}}
                      categoriaValidada={catValidadaDetalle}
                      soloLectura={true}
                    />

                    {detalleActual.laboratorios?.observaciones && (
                      <div className="bg-white border border-teal-200 rounded-xl p-3">
                        <span className="text-[11px] font-black uppercase text-teal-900 block mb-1">
                          Observaciones / Notas de Laboratorio:
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap">
                          {detalleActual.laboratorios.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SUBMÓDULO 4: ANEXO CLÍNICO ESPECÍFICO (2 ROJO / 3 AMARILLO / 4 VERDE) */}
                  <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#0c2340]" />
                        <span>
                          Submódulo 4 ·{" "}
                          {catValidadaDetalle === 3
                            ? "Anexo 2 — Alerta de Choque Séptico / DOM (Rojo)"
                            : catValidadaDetalle === 2
                            ? "Anexo 3 — Alerta de Sepsis Sin DOM (Amarillo)"
                            : "Anexo 4 — Baja Probabilidad de Sepsis (Verde)"}
                        </span>
                      </span>
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          estadosDetalle.anexoCompletado
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        {estadosDetalle.anexoCompletado
                          ? `✓ Completado (${formatearTiempo(tsSubDetalle.anexoSegundos)})`
                          : "Pendiente / Sin guardar"}
                      </span>
                    </div>

                    {catValidadaDetalle === 3 && (
                      <FormularioAnexo2Rojo
                        data={{
                          pacienteNombre: nombreDefaultDetalle,
                          ...(detalleActual.anexo2Data || {}),
                        }}
                        laboratorios={detalleActual.laboratorios}
                        soloLectura={true}
                      />
                    )}
                    {catValidadaDetalle === 2 && (
                      <FormularioAnexo3Amarillo
                        data={{
                          pacienteNombre: nombreDefaultDetalle,
                          ...(detalleActual.anexo3Data || {}),
                        }}
                        soloLectura={true}
                      />
                    )}
                    {catValidadaDetalle === 1 && (
                      <FormularioAnexo4Verde
                        data={{
                          pacienteNombre: nombreDefaultDetalle,
                          ...(detalleActual.anexo4Data || {}),
                        }}
                        soloLectura={true}
                      />
                    )}
                  </div>

                  {/* SUBMÓDULO 5 (SOLO CATEGORÍA 3): VASOPRESORES POR VENA PERIFÉRICA */}
                  {catValidadaDetalle === 3 && (
                    <div className="border-2 border-red-300 rounded-2xl p-4 bg-red-50/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-red-900 tracking-wider flex items-center gap-1.5">
                          <Syringe className="w-4 h-4 text-red-700" />
                          <span>Submódulo 5 · Vasopresores por Vena Periférica (Cat 3)</span>
                        </span>
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                            estadosDetalle.vasopresoresCompletado
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {estadosDetalle.vasopresoresCompletado
                            ? `✓ Completado (${formatearTiempo(tsSubDetalle.vasopresoresSegundos)})`
                            : "Pendiente / Sin guardar"}
                        </span>
                      </div>
                      <FormularioVasopresores
                        data={detalleActual.vasopresoresData || {}}
                        pesoIngresoDefault={vitalesDetalle?.pesoKg || ""}
                        horaIngresoDefault={vitalesDetalle?.horaIngreso || ""}
                        soloLectura={true}
                      />
                    </div>
                  )}
                </div>

                {/* TARJETA 3: FASE 3 - EQUIPO DETECTO Y COMENTARIOS */}
                <div className="bg-white border-2 border-purple-400 rounded-2xl p-5 shadow-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-700 text-white rounded-xl shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          3. Fase 3 — Dictamen, Comentarios y Cierre Equipo DETECTO
                        </h4>
                        <span className="text-xs text-purple-700 font-bold">
                          Evaluador: {detalleActual.autorDetecto || "Líder DETECTO"} · Tiempo Fase 3:{" "}
                          {formatearTiempo(tiempoFase3Detalle)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full border ${
                        detalleActual.fase3Completada
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : detalleActual.reportadoADetecto || detalleActual.estado === "pendiente_detecto"
                          ? "bg-purple-100 text-purple-900 border-purple-300"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      {detalleActual.fase3Completada
                        ? "✓✓✓ Caso Cerrado y Registrado"
                        : detalleActual.reportadoADetecto || detalleActual.estado === "pendiente_detecto"
                        ? "En seguimiento DETECTO"
                        : "Aún no reportado a DETECTO"}
                    </span>
                  </div>

                  {/* Comentarios / Dictamen de Fase 3 */}
                  <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-1.5">
                    <span className="text-xs font-black text-purple-900 uppercase block">
                      Comentarios / Dictamen y Conducta de Fase 3 (Equipo DETECTO):
                    </span>
                    <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                      {detalleActual.diagnosticoDetecto && detalleActual.diagnosticoDetecto.trim()
                        ? detalleActual.diagnosticoDetecto
                        : "Sin comentarios registrados en Fase 3."}
                    </p>
                  </div>

                  {/* Justificación de cierre anticipado si existió */}
                  {detalleActual.habilitadoCierreAnticipado && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                      <span className="font-black flex items-center gap-1.5">
                        <Unlock className="w-4 h-4 text-amber-700" />
                        <span>Cierre Anticipado Habilitado desde Fase 3:</span>
                      </span>
                      <p className="font-medium whitespace-pre-wrap">
                        {detalleActual.motivoCierreAnticipado || "Sin motivo registrado."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">
                  Hospital Infantil Los Ángeles · DETECTO© 2026
                </span>
                <button
                  type="button"
                  onClick={() => setPacienteDetalle(null)}
                  className="bg-[#0c2340] hover:bg-sky-950 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CONFIRMACIÓN PARA BORRAR / PURGAR (SUPER USUARIO) */}
      {confirmacionBorrar && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-300 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  {confirmacionBorrar.tipo === "papelera"
                    ? "¿Mover registro a la papelera?"
                    : "¿Eliminar registro definitivamente?"}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {confirmacionBorrar.tipo === "papelera" ? (
                    <>
                      El caso{" "}
                      <strong className="text-slate-900">
                        {confirmacionBorrar.paciente.codigo}
                      </strong>{" "}
                      ({confirmacionBorrar.paciente.nombre || "Paciente"} · ID:{" "}
                      {confirmacionBorrar.paciente.identificacionPaciente || "Sin ID"})
                      se moverá a la papelera de reciclaje y podrá restaurarlo durante los próximos 10 días.
                    </>
                  ) : (
                    <>
                      Esta acción eliminará permanentemente el caso{" "}
                      <strong className="text-red-700">
                        {confirmacionBorrar.paciente.codigo}
                      </strong>{" "}
                      ({confirmacionBorrar.paciente.nombre || "Paciente"} · ID:{" "}
                      {confirmacionBorrar.paciente.identificacionPaciente || "Sin ID"})
                      de la base de datos y no se podrá deshacer.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={procesandoBorrado}
                onClick={() => setConfirmacionBorrar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesandoBorrado}
                onClick={ejecutarBorradoConfirmado}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {procesandoBorrado
                    ? "Eliminando..."
                    : confirmacionBorrar.tipo === "papelera"
                    ? "Sí, Mover a Papelera"
                    : "Sí, Eliminar Definitivamente"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { PacienteRegistro, UsuarioSesion, CRITERIOS_TAMIZAJE_SEPSIS } from "../types";
import { FormularioEquipoSepsisPdf } from "./FormularioEquipoSepsisPdf";
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
} from "lucide-react";

interface BaseDatosPacientesProps {
  pacientes: PacienteRegistro[];
  papelera: (PacienteRegistro & { diasRestantes?: number })[];
  usuarioActual: UsuarioSesion;
  onEditarPaciente: (paciente: PacienteRegistro) => void;
  onEliminarPaciente: (id: string) => void;
  onRestaurarPaciente: (id: string) => void;
  onPurgarPaciente: (id: string) => void;
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
  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteRegistro | null>(null);

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
      alert("Solo el Super Usuario (AdminDet1) tiene permisos para descargar reportes en Excel.");
      return;
    }

    const dataParaExcel = pacientes.map((p) => ({
      "Código Caso": p.codigo,
      "Identificación Paciente": p.identificacionPaciente || "Sin ID",
      "Fecha Ingreso": formatearFecha(p.fechaCreacion),
      "Categoría Triage": p.categoriaTriageLabel || `Categoría ${p.categoriaTriage || 1}`,
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
      "Tiempo Total Acumulado": formatearTiempo(p.tiempoTotalSegundos),
    }));

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
                  : "Base de Datos de Pacientes"}
              </h2>
              <p className="text-xs text-slate-500">
                {mostrarPapelera
                  ? "Los registros eliminados se almacenan aquí y desaparecen automáticamente a los 10 días."
                  : "Historial completo de trazabilidad por fases (Fase 1, 2 y 3)."}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          {!mostrarPapelera && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
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
                            onClick={() => {
                              if (confirm(`¿Eliminar definitivamente a ${p.nombre} ${p.apellido}?`)) {
                                onPurgarPaciente(p.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
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
        ) : (
          /* VIEW 2: TABLA PRINCIPAL DE PACIENTES CON 3 COLUMNAS DE FASES */
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
                          <div className="font-mono font-black text-slate-900 text-sm mt-1">
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

                        {/* COLUMNA FASE 3: Check List Verde o Marca Roja si no trascendió */}
                        <td className="p-3.5 text-center">
                          {p.fase3Completada ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="bg-emerald-100 text-emerald-700 p-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                                {formatearTiempo(p.tiempoFase3Segundos)}
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
                                onClick={() => {
                                  if (
                                    confirm(
                                      `¿Mover a ${p.nombre} ${p.apellido} a la papelera? Podrá restaurarlo o desaparecerá a los 10 días.`
                                    )
                                  ) {
                                    onEliminarPaciente(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
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
      {pacienteDetalle && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-black bg-slate-900 text-sky-300 px-2.5 py-1 rounded-lg">
                    {pacienteDetalle.codigo}
                  </span>
                  <span className="text-xs font-black bg-sky-100 text-sky-900 px-3 py-1 rounded-lg border border-sky-300">
                    ID: {pacienteDetalle.identificacionPaciente || "Sin identificación"}
                  </span>

                  {pacienteDetalle.categoriaTriage === 3 && (
                    <span className="text-[11px] font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded border border-[#e65c5c]">
                      Cat 3: CHOQUE / DOMᵃ ({pacienteDetalle.puntajeTamizaje ?? 0} pts)
                    </span>
                  )}
                  {pacienteDetalle.categoriaTriage === 2 && (
                    <span className="text-[11px] font-black bg-[#f4b400] text-black px-2.5 py-0.5 rounded border border-[#d99b00]">
                      Cat 2: ALERTA SEPSIS ({pacienteDetalle.puntajeTamizaje ?? 0} pts)
                    </span>
                  )}
                  {pacienteDetalle.categoriaTriage === 1 && (
                    <span className="text-[11px] font-black bg-[#7ecc61] text-black px-2.5 py-0.5 rounded border border-[#5ba83e]">
                      Cat 1: BAJA POSIBILIDAD ({pacienteDetalle.puntajeTamizaje ?? 0} pts)
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Historia Clínica Digital de Sepsis
                </h3>
                <span className="text-xs text-slate-500 font-medium block">
                  Fecha de ingreso: {formatearFecha(pacienteDetalle.fechaCreacion)}
                </span>
              </div>

              <button
                onClick={() => setPacienteDetalle(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* 3 Time Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[11px] font-bold text-sky-800 uppercase block">Fase 1 (Triage)</span>
                <span className="text-base sm:text-lg font-mono font-black text-sky-950 mt-0.5 block">
                  {formatearTiempo(pacienteDetalle.tiempoFase1Segundos)}
                </span>
              </div>
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">Fase 2 (Urgencias)</span>
                <span className="text-base sm:text-lg font-mono font-black text-amber-950 mt-0.5 block">
                  {formatearTiempo(pacienteDetalle.tiempoFase2Segundos)}
                </span>
              </div>
              <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Fase 3 (DETECTO)</span>
                <span className="text-base sm:text-lg font-mono font-black text-purple-950 mt-0.5 block">
                  {formatearTiempo(pacienteDetalle.tiempoFase3Segundos)}
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
                {formatearTiempo(pacienteDetalle.tiempoTotalSegundos)}
              </span>
            </div>

            {/* TARJETAS CLÍNICAS EXPANDIDAS DE CADA FASE */}
            <div className="space-y-4">
              {/* TARJETA 1: FASE 1 - TRIAGE / TAMIZAJE DE SEPSIS */}
              <div className="bg-white border-2 border-sky-400 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-600 text-white rounded-xl shadow-sm">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        1. Diagnóstico y Tamizaje en Triage
                      </h4>
                      <span className="text-xs text-sky-700 font-bold">
                        Evaluador: {pacienteDetalle.autorTriage || "Enfermería Triage"} · Tiempo: {formatearTiempo(pacienteDetalle.tiempoFase1Segundos)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-sky-100 text-sky-900 px-3 py-1 rounded-full border border-sky-300">
                    {pacienteDetalle.puntajeTamizaje ?? 0} / 8 Puntos
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
                        pacienteDetalle.criteriosTamizaje &&
                        pacienteDetalle.criteriosTamizaje[idx] === true;

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
                            <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg text-[11px]">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              <span>Presente (1 pt)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] px-2 py-0.5">
                              No marcado (0 pt)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Banner de Clasificación Triage */}
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1">
                    Clasificación Resultante en Triage:
                  </span>
                  {pacienteDetalle.categoriaTriage === 3 && (
                    <div className="bg-[#ff9999] border-2 border-[#e65c5c] text-black font-black text-center py-2.5 px-4 rounded-xl text-sm shadow-sm">
                      ALERTA CHOQUE SEPTICOᵇ O DOMᵃ (Categoría 3)
                    </div>
                  )}
                  {pacienteDetalle.categoriaTriage === 2 && (
                    <div className="bg-[#f4b400] border-2 border-[#d99b00] text-black font-black text-center py-2.5 px-4 rounded-xl text-sm shadow-sm">
                      ALERTA DE SEPSIS (SIN DOMᵃ) (Categoría 2)
                    </div>
                  )}
                  {(!pacienteDetalle.categoriaTriage || pacienteDetalle.categoriaTriage === 1) && (
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
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    "{pacienteDetalle.diagnosticoTriage || "Sin notas adicionales"}"
                  </p>
                </div>
              </div>

              {/* TARJETA 2: FASE 2 - URGENCIAS / EQUIPO DE SEPSIS */}
              <div className="bg-white border-2 border-amber-400 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-sm">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        2. Validación Médica de Urgencias (Equipo de Sepsis)
                      </h4>
                      <span className="text-xs text-amber-800 font-bold">
                        Evaluador: {pacienteDetalle.autorUrgencias || "Médico de Urgencias"} · Tiempo: {formatearTiempo(pacienteDetalle.tiempoFase2Segundos)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      pacienteDetalle.aplicaSepsis !== false
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {pacienteDetalle.aplicaSepsis !== false ? "SÍ APLICA SEPSIS" : "DESCARTADO"}
                  </span>
                </div>

                {/* Cápsula de Decisión Médica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                      Validación de Categoría Triage:
                    </span>
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      {pacienteDetalle.aprobadoUrgencias !== false ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Categoría de Triage Aprobada</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Categoría No Aprobada / Rectificada</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                      Resolución Asistencial:
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {pacienteDetalle.aplicaSepsis !== false
                        ? "Reportado a Equipo DETECTO para tratamiento"
                        : `No aplica sepsis (${pacienteDetalle.motivoDescarte || "Sin motivo"})`}
                    </span>
                  </div>
                </div>

                {/* Concepto del Médico de Urgencias */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Concepto y Diagnóstico del Médico de Urgencias:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    "{pacienteDetalle.diagnosticoUrgencias || "Sin diagnóstico médico registrado"}"
                  </p>
                </div>

                {/* Lista de Chequeo 1 (PDF) digitalizada */}
                {pacienteDetalle.formularioEquipoSepsis && (
                  <div className="pt-2">
                    <span className="text-xs font-black uppercase text-[#074c5d] tracking-wider block mb-2">
                      Lista de Chequeo Oficial (PDF) — Evaluación por Equipo de Sepsis:
                    </span>
                    <FormularioEquipoSepsisPdf
                      data={pacienteDetalle.formularioEquipoSepsis}
                      soloLectura={true}
                    />
                  </div>
                )}
              </div>

              {/* TARJETA 3: FASE 3 - EQUIPO DETECTO */}
              <div className="bg-white border-2 border-purple-400 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-700 text-white rounded-xl shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        3. Dictamen y Registro Equipo DETECTO
                      </h4>
                      <span className="text-xs text-purple-700 font-bold">
                        Evaluador: {pacienteDetalle.autorDetecto || "Líder DETECTO"} · Tiempo: {formatearTiempo(pacienteDetalle.tiempoFase3Segundos)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      pacienteDetalle.fase3Completada
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-purple-100 text-purple-900 border-purple-300"
                    }`}
                  >
                    {pacienteDetalle.fase3Completada ? "✓✓✓ Caso Cerrado y Registrado" : "En proceso DETECTO"}
                  </span>
                </div>

                {/* Observaciones de DETECTO */}
                <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
                  <span className="text-xs font-bold text-purple-900 uppercase block mb-1">
                    Observaciones y Conducta del Equipo DETECTO:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    "{pacienteDetalle.diagnosticoDetecto || "Caso registrado formalmente en base de datos sin observaciones adicionales."}"
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                Hospital Infantil Los Ángeles · DETECTO© 2026
              </span>
              <button
                onClick={() => setPacienteDetalle(null)}
                className="bg-[#0c2340] hover:bg-sky-950 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { PacienteRegistro } from "../types";
import {
  construirListaLaboratoriosPorCaso,
  copiarListaLaboratoriosTabla,
  exportarListaLaboratoriosExcelPlano,
} from "../utils/laboratoriosOrdenExport";
import {
  FlaskConical,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  X,
  Table2,
} from "lucide-react";

interface ModalListaLaboratoriosCupsProps {
  pacientes: PacienteRegistro[];
  pacienteInicialId?: string | null;
  onCerrar: () => void;
}

export const ModalListaLaboratoriosCups: React.FC<ModalListaLaboratoriosCupsProps> = ({
  pacientes,
  pacienteInicialId,
  onCerrar,
}) => {
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(() => {
    if (pacienteInicialId && pacientes.some((p) => p.id === pacienteInicialId)) {
      return pacienteInicialId;
    }
    const activo = pacientes.find(
      (p) => !p.fase3Completada && p.estado !== "completado" && p.estado !== "descartado"
    );
    return activo?.id || pacientes[0]?.id || "manual";
  });

  const [categoriaManual, setCategoriaManual] = useState<1 | 2 | 3>(3);
  const [busqueda, setBusqueda] = useState<string>("");
  const [soloMarcados, setSoloMarcados] = useState<boolean>(false);
  const [copiadoOk, setCopiadoOk] = useState<boolean>(false);
  const [errorCopia, setErrorCopia] = useState<string | null>(null);

  const pacienteActual = useMemo(
    () => pacientes.find((p) => p.id === selectedPacienteId) || null,
    [pacientes, selectedPacienteId]
  );

  const categoriaActiva: 1 | 2 | 3 = pacienteActual
    ? pacienteActual.categoriaTriageValidada || pacienteActual.categoriaTriage || 1
    : categoriaManual;

  const filasBase = useMemo(
    () => construirListaLaboratoriosPorCaso(categoriaActiva, pacienteActual?.laboratorios),
    [categoriaActiva, pacienteActual]
  );

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filasBase.filter((f) => {
      if (soloMarcados && !f.solicitadoOValorado) return false;
      if (!q) return true;
      return (
        f.sistema.toLowerCase().includes(q) ||
        f.examen.toLowerCase().includes(q) ||
        f.detalle.toLowerCase().includes(q) ||
        f.resultadoEstado.toLowerCase().includes(q)
      );
    });
  }, [filasBase, busqueda, soloMarcados]);

  const metaExport = {
    codigo: pacienteActual?.codigo || `CAT-${categoriaActiva}`,
    paciente: pacienteActual?.nombre || "Paciente sin nombre",
    identificacion: pacienteActual?.identificacionPaciente || "Sin ID",
    categoria: categoriaActiva,
  };

  const handleCopiarTabla = async () => {
    setErrorCopia(null);
    try {
      await copiarListaLaboratoriosTabla(filasFiltradas, metaExport);
      setCopiadoOk(true);
      setTimeout(() => setCopiadoOk(false), 3500);
    } catch {
      setErrorCopia("No se pudo copiar automáticamente al portapapeles. Intente exportar en Excel.");
    }
  };

  const handleExportarExcel = () => {
    exportarListaLaboratoriosExcelPlano(filasFiltradas, metaExport, pacienteActual);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white border-2 border-[#0b4d6c] rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0b4d6c] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-400 text-slate-950 rounded-xl shadow">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">
                Lista de Laboratorios y Exámenes Solicitados · Columna CUPS
              </h3>
              <p className="text-xs text-teal-100">
                Lista según clasificación clínica del caso · Lista para copiar en tabla o exportar en Excel plano (.xlsx) desde cualquier perfil.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                Seleccionar Caso / Paciente:
              </label>
              <select
                value={selectedPacienteId}
                onChange={(e) => setSelectedPacienteId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
              >
                {pacientes.map((p) => {
                  const cat = p.categoriaTriageValidada || p.categoriaTriage || 1;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.codigo} · {p.nombre || "Sin nombre"} (ID: {p.identificacionPaciente || "N/A"}) — Cat {cat}
                    </option>
                  );
                })}
                <option value="manual">Plantilla por clasificación (sin caso específico)</option>
              </select>
            </div>

            {!pacienteActual ? (
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Clasificación del protocolo:
                </label>
                <select
                  value={categoriaManual}
                  onChange={(e) => setCategoriaManual(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value={3}>Categoría 3 — Alerta Choque Séptico / DOM</option>
                  <option value={2}>Categoría 2 — Alerta de Sepsis (Sin DOM)</option>
                  <option value={1}>Categoría 1 — Baja Posibilidad (MAMUTTS)</option>
                </select>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    Clasificación del Caso
                  </span>
                  <span className="font-black text-slate-900">
                    {categoriaActiva === 3
                      ? "Cat 3: Choque Séptico / DOM (Rojo)"
                      : categoriaActiva === 2
                      ? "Cat 2: Alerta de Sepsis (Amarillo)"
                      : "Cat 1: Baja Posibilidad / MAMUTTS (Verde)"}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    categoriaActiva === 3
                      ? "bg-[#ff9999] text-black"
                      : categoriaActiva === 2
                      ? "bg-[#f4b400] text-black"
                      : "bg-[#7ecc61] text-black"
                  }`}
                >
                  {filasFiltradas.length} exámenes
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleCopiarTabla}
                className="bg-[#0c2340] hover:bg-sky-900 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
              >
                <Copy className="w-4 h-4 text-sky-300" />
                <span>Copiar en Tabla</span>
              </button>
              <button
                type="button"
                onClick={handleExportarExcel}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Excel Plano (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Filtrar examen, sistema o parámetro..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloMarcados}
                  onChange={(e) => setSoloMarcados(e.target.checked)}
                  className="accent-teal-700"
                />
                <span>Mostrar solo los ya marcados/diligenciados en el caso</span>
              </label>

              {copiadoOk && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Tabla copiada (lista para pegar en Excel o Word)</span>
                </span>
              )}
              {errorCopia && (
                <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full">
                  {errorCopia}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0b4d6c] text-white font-black uppercase text-[11px] divide-x divide-white/20">
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">Sistema / Grupo</th>
                  <th className="p-2.5">Examen / Laboratorio Solicitado</th>
                  <th className="p-2.5">Parámetros / Detalle</th>
                  <th className="p-2.5 w-24 text-center bg-sky-950">CUPS</th>
                  <th className="p-2.5">Prioridad / Meta</th>
                  <th className="p-2.5">Fecha/Hora</th>
                  <th className="p-2.5">Estado / Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                      No hay exámenes que coincidan con el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((f, idx) => (
                    <tr
                      key={f.id}
                      className={`hover:bg-teal-50/40 divide-x divide-slate-200 ${
                        f.solicitadoOValorado ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-black text-[#074c5d]">{f.sistema}</td>
                      <td className="p-2.5 font-bold text-slate-900">{f.examen}</td>
                      <td className="p-2.5 text-slate-600">{f.detalle}</td>
                      <td className="p-2.5 text-center font-mono text-slate-400 bg-slate-50">
                        {f.cups || ""}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{f.prioridadMeta}</td>
                      <td className="p-2.5 font-mono text-slate-700">{f.fechaHora || "—"}</td>
                      <td className="p-2.5 font-bold text-slate-900">{f.resultadoEstado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-3 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
            <span>
              La columna <strong>CUPS</strong> se incluye intencionalmente en blanco para diligenciamiento o carga futura de códigos institucionales.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

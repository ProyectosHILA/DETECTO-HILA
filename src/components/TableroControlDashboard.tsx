import React, { useState, useEffect, useMemo } from "react";
import { PacienteRegistro } from "../types";
import {
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Layers,
  Eye,
  Filter,
  PieChart,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { exportTableroControlPdf } from "../utils/tableroPdfExport";

interface TableroControlDashboardProps {
  pacientes: PacienteRegistro[];
  onSeleccionarPacienteParaDetalle?: (paciente: PacienteRegistro) => void;
}

interface CasoMetrica {
  paciente: PacienteRegistro;
  cat: 1 | 2 | 3;
  metaSegs: number;
  cerrado: boolean;
  descartado: boolean;
  fase1Segs: number;
  fase2Segs: number;
  fase3Segs: number;
  totalSegs: number;
  cumpleMeta: boolean;
  subValidacionSegs: number;
  subValidacionEstado: "completado" | "pendiente" | "no_iniciado";
  subChecklist1Segs: number;
  subChecklist1Estado: "completado" | "pendiente" | "no_iniciado";
  subLabSegs: number;
  subLabEstado: "completado" | "pendiente" | "no_iniciado";
  labOrigen?: "fase2" | "fase3" | "laboratorios";
  subAnexoSegs: number;
  subAnexoEstado: "completado" | "pendiente" | "no_iniciado";
  moduloMasLento: string;
  submoduloMasLento: string;
  submoduloMasLentoSegs: number;
}

interface PieSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  formattedValue: string;
}

// Clean SVG Pie / Donut Chart helper
const DonutChartSvg: React.FC<{
  slices: PieSlice[];
  centerLabel: string;
  centerValue: string;
}> = ({ slices, centerLabel, centerValue }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        Sin datos suficientes para graficar
      </div>
    );
  }

  let accumulatedOffset = 0;
  const activeSlice = slices.find((s) => s.id === hoveredId) || null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {slices.map((slice) => {
            if (slice.value <= 0) return null;
            const fraction = slice.value / total;
            const dashLength = fraction * circumference;
            const dashOffset = -accumulatedOffset;
            accumulatedOffset += dashLength;
            const isHovered = hoveredId === slice.id;

            return (
              <circle
                key={slice.id}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? 26 : 22}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 leading-tight truncate max-w-[90px]">
            {activeSlice ? activeSlice.label : centerLabel}
          </span>
          <span className="text-base font-black font-mono text-slate-900 tabular-nums mt-0.5">
            {activeSlice
              ? `${Math.round((activeSlice.value / total) * 100)}%`
              : centerValue}
          </span>
          {activeSlice && (
            <span className="text-[10px] font-mono font-bold text-slate-600 tabular-nums">
              {activeSlice.formattedValue}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div
              key={slice.id}
              onMouseEnter={() => setHoveredId(slice.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                hoveredId === slice.id
                  ? "bg-slate-100 border-slate-300"
                  : "bg-slate-50/70 border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-bold text-slate-800 truncate">{slice.label}</span>
              </div>
              <div className="font-mono font-black text-slate-900 tabular-nums shrink-0">
                {pct}%{" "}
                <span className="text-[11px] font-semibold text-slate-500">
                  ({slice.formattedValue})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TableroControlDashboard: React.FC<TableroControlDashboardProps> = ({
  pacientes,
  onSeleccionarPacienteParaDetalle,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | "3" | "2" | "1">("todas");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "completados">("todos");
  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState<string>("todos");
  const [modoPastelCasos, setModoPastelCasos] = useState<"categoria" | "meta">("categoria");
  const [hoverLineIdx, setHoverLineIdx] = useState<number | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState<boolean>(false);
  const [ahora, setAhora] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmtMinSeg = (totalSeg: number) => {
    const segs = Math.max(0, Math.round(totalSeg));
    const m = Math.floor(segs / 60);
    const s = segs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fmtMinDecimal = (totalSeg: number) => {
    const mins = Math.max(0, totalSeg) / 60;
    return `${mins.toFixed(1)} min`;
  };

  // Compute exact timing breakdown per patient
  const metricasBase: CasoMetrica[] = useMemo(() => {
    return pacientes.map((p) => {
      const cat: 1 | 2 | 3 = p.categoriaTriageValidada || p.categoriaTriage || 1;
      const metaSegs = cat === 3 ? 2700 : 3600;
      const cerrado = Boolean(p.fase3Completada || p.estado === "completado");
      const descartado = p.estado === "descartado";

      const fase1Segs = p.tiempoFase1Segundos || 0;
      const tsPaso2 = p.timestampPasoFase2 || p.timestampInicio || ahora;

      let fase2Segs = p.tiempoFase2Segundos || 0;
      if (!cerrado && !descartado) {
        if (p.reportadoADetecto && p.timestampPasoFase3) {
          fase2Segs = Math.max(
            fase2Segs,
            Math.floor((p.timestampPasoFase3 - tsPaso2) / 1000)
          );
        } else {
          fase2Segs = Math.max(fase2Segs, Math.floor((ahora - tsPaso2) / 1000));
        }
      }

      // Fase 3 starts counting from the moment Fase 2 reports it (timestampPasoFase3)
      let fase3Segs = p.tiempoFase3Segundos || 0;
      if (cerrado) {
        if (fase3Segs === 0 && p.timestampPasoFase3 && p.timestampFinalizado) {
          fase3Segs = Math.max(
            1,
            Math.floor((p.timestampFinalizado - p.timestampPasoFase3) / 1000)
          );
        }
      } else if (!descartado && (p.reportadoADetecto || p.estado === "pendiente_detecto" || p.timestampPasoFase3)) {
        const tsPaso3 = p.timestampPasoFase3 || ahora;
        fase3Segs = Math.max(fase3Segs, Math.floor((ahora - tsPaso3) / 1000));
      }

      const totalSegs = cerrado
        ? p.tiempoTotalSegundos || fase1Segs + fase2Segs + fase3Segs
        : descartado
        ? p.tiempoTotalSegundos || fase1Segs + fase2Segs
        : Math.max(0, Math.floor((ahora - (p.timestampInicio || ahora)) / 1000));

      const cumpleMeta = totalSegs <= metaSegs;

      const estados = p.estadosModulos || {
        fase1Validada: false,
        checklist1Completado: false,
        laboratoriosCompletado: false,
        anexoCompletado: false,
      };
      const tsSub = p.tiemposSubmodulos || {};
      const tsValidacion = tsSub.timestampValidacionTriage || tsPaso2;

      // Submodule 1: Validación Triage
      let subValidacionSegs = 0;
      let subValidacionEstado: "completado" | "pendiente" | "no_iniciado" = "no_iniciado";
      if (estados.fase1Validada) {
        subValidacionEstado = "completado";
        subValidacionSegs =
          tsSub.validacionTriageSegundos ||
          Math.max(1, Math.floor((tsValidacion - tsPaso2) / 1000));
      } else if (!cerrado && !descartado) {
        subValidacionEstado = "pendiente";
        subValidacionSegs = Math.max(0, Math.floor((ahora - tsPaso2) / 1000));
      }

      // Submodule 2: Lista de Chequeo 1
      let subChecklist1Segs = 0;
      let subChecklist1Estado: "completado" | "pendiente" | "no_iniciado" = "no_iniciado";
      if (estados.checklist1Completado) {
        subChecklist1Estado = "completado";
        subChecklist1Segs = tsSub.checklist1Segundos || Math.max(1, fase2Segs);
      } else if (estados.fase1Validada && !cerrado && !descartado) {
        subChecklist1Estado = "pendiente";
        subChecklist1Segs = Math.max(0, Math.floor((ahora - tsValidacion) / 1000));
      }

      // Submodule 3: Resultados de Laboratorio
      let subLabSegs = 0;
      let subLabEstado: "completado" | "pendiente" | "no_iniciado" = "no_iniciado";
      if (estados.laboratoriosCompletado) {
        subLabEstado = "completado";
        subLabSegs = tsSub.laboratoriosSegundos || Math.max(1, fase2Segs);
      } else if (estados.fase1Validada && !cerrado && !descartado) {
        subLabEstado = "pendiente";
        subLabSegs = Math.max(0, Math.floor((ahora - tsValidacion) / 1000));
      }

      // Submodule 4: Anexo Clínico 2/3/4
      let subAnexoSegs = 0;
      let subAnexoEstado: "completado" | "pendiente" | "no_iniciado" = "no_iniciado";
      if (estados.anexoCompletado) {
        subAnexoEstado = "completado";
        subAnexoSegs = tsSub.anexoSegundos || Math.max(1, fase2Segs);
      } else if (estados.fase1Validada && !cerrado && !descartado) {
        subAnexoEstado = "pendiente";
        subAnexoSegs = Math.max(0, Math.floor((ahora - tsValidacion) / 1000));
      }

      const etapas = [
        { name: "Fase 1: Triage", val: fase1Segs },
        { name: "Fase 2: Urgencias", val: fase2Segs },
        { name: "Fase 3: DETECTO", val: fase3Segs },
      ];
      etapas.sort((a, b) => b.val - a.val);

      const subs = [
        { name: "Validación Triage", val: subValidacionSegs },
        { name: "Lista de Chequeo 1", val: subChecklist1Segs },
        { name: "Resultados de Laboratorio", val: subLabSegs },
        { name: "Anexo Clínico", val: subAnexoSegs },
      ];
      subs.sort((a, b) => b.val - a.val);

      return {
        paciente: p,
        cat,
        metaSegs,
        cerrado,
        descartado,
        fase1Segs,
        fase2Segs,
        fase3Segs,
        totalSegs,
        cumpleMeta,
        subValidacionSegs,
        subValidacionEstado,
        subChecklist1Segs,
        subChecklist1Estado,
        subLabSegs,
        subLabEstado,
        labOrigen: tsSub.laboratoriosCompletadoPor,
        subAnexoSegs,
        subAnexoEstado,
        moduloMasLento: etapas[0].name,
        submoduloMasLento: subs[0].val > 0 ? subs[0].name : "Sin datos",
        submoduloMasLentoSegs: subs[0].val,
      };
    });
  }, [pacientes, ahora]);

  const metricasFiltradas = useMemo(() => {
    return metricasBase.filter((m) => {
      if (filtroCategoria !== "todas" && String(m.cat) !== filtroCategoria) return false;
      if (filtroEstado === "activos" && (m.cerrado || m.descartado)) return false;
      if (filtroEstado === "completados" && !m.cerrado) return false;
      return true;
    });
  }, [metricasBase, filtroCategoria, filtroEstado]);

  const casosAnalisis = useMemo(() => {
    if (casoSeleccionadoId !== "todos") {
      const match = metricasFiltradas.find((m) => m.paciente.id === casoSeleccionadoId);
      if (match) return [match];
    }
    return metricasFiltradas;
  }, [metricasFiltradas, casoSeleccionadoId]);

  useEffect(() => {
    if (
      casoSeleccionadoId !== "todos" &&
      !metricasFiltradas.some((m) => m.paciente.id === casoSeleccionadoId)
    ) {
      setCasoSeleccionadoId("todos");
    }
  }, [metricasFiltradas, casoSeleccionadoId]);

  const stats = useMemo(() => {
    const n = casosAnalisis.length || 1;
    const avg = (arr: number[]) => arr.reduce((acc, v) => acc + v, 0) / n;
    const avgNonZero = (arr: number[]) => {
      const valid = arr.filter((v) => v > 0);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    const avgFase1 = avg(casosAnalisis.map((c) => c.fase1Segs));
    const avgFase2 = avg(casosAnalisis.map((c) => c.fase2Segs));
    const avgFase3 = avgNonZero(casosAnalisis.map((c) => c.fase3Segs));
    const avgTotal = avg(casosAnalisis.map((c) => c.totalSegs));
    const tasaCumplimiento =
      casosAnalisis.length > 0
        ? Math.round(
            (casosAnalisis.filter((c) => c.cumpleMeta).length / casosAnalisis.length) * 100
          )
        : 0;

    const avgSubVal = avgNonZero(casosAnalisis.map((c) => c.subValidacionSegs));
    const avgSubChk1 = avgNonZero(casosAnalisis.map((c) => c.subChecklist1Segs));
    const avgSubLab = avgNonZero(casosAnalisis.map((c) => c.subLabSegs));
    const avgSubAnexo = avgNonZero(casosAnalisis.map((c) => c.subAnexoSegs));

    const modulosBars = [
      {
        id: "f1",
        label: "Fase 1 · Triage",
        shortLabel: "F1 Triage",
        sub: "Tamizaje inicial",
        segs: avgFase1,
        color: "#0284c7",
        bgClass: "bg-sky-600",
        track: "bg-sky-100",
      },
      {
        id: "f2",
        label: "Fase 2 · Urgencias",
        shortLabel: "F2 Urgencias",
        sub: "Equipo de Sepsis",
        segs: avgFase2,
        color: "#f59e0b",
        bgClass: "bg-amber-500",
        track: "bg-amber-100",
      },
      {
        id: "f3",
        label: "Fase 3 · DETECTO",
        shortLabel: "F3 DETECTO",
        sub: "Desde reporte F2",
        segs: avgFase3,
        color: "#7e22ce",
        bgClass: "bg-purple-700",
        track: "bg-purple-100",
      },
    ];
    const maxModuloSegs = Math.max(...modulosBars.map((b) => b.segs), 1);
    const slowestModulo = [...modulosBars].sort((a, b) => b.segs - a.segs)[0];

    const submodulosBars = [
      {
        id: "s1",
        label: "1. Validación Triage",
        segs: avgSubVal,
        pendientes: casosAnalisis.filter((c) => c.subValidacionEstado === "pendiente").length,
        color: "bg-sky-600",
      },
      {
        id: "s2",
        label: "2. Lista de Chequeo 1",
        segs: avgSubChk1,
        pendientes: casosAnalisis.filter((c) => c.subChecklist1Estado === "pendiente").length,
        color: "bg-indigo-600",
      },
      {
        id: "s3",
        label: "3. Resultados de Laboratorio",
        segs: avgSubLab,
        pendientes: casosAnalisis.filter((c) => c.subLabEstado === "pendiente").length,
        completadoLabExt: casosAnalisis.filter((c) => c.labOrigen === "laboratorios").length,
        color: "bg-teal-600",
      },
      {
        id: "s4",
        label: "4. Anexo Clínico (2/3/4)",
        segs: avgSubAnexo,
        pendientes: casosAnalisis.filter((c) => c.subAnexoEstado === "pendiente").length,
        color: "bg-amber-600",
      },
    ];
    const maxSubSegs = Math.max(...submodulosBars.map((s) => s.segs), 1);
    const slowestSubmodulo = [...submodulosBars].sort((a, b) => b.segs - a.segs)[0];

    // Pie slices: time share per stage
    const pieEtapas: PieSlice[] = modulosBars.map((m) => ({
      id: m.id,
      label: m.label,
      value: Math.max(0, Math.round(m.segs)),
      color: m.color,
      formattedValue: fmtMinSeg(m.segs),
    }));

    // Pie slices: case mix by category or golden-hour compliance
    const cat3Count = metricasFiltradas.filter((m) => m.cat === 3).length;
    const cat2Count = metricasFiltradas.filter((m) => m.cat === 2).length;
    const cat1Count = metricasFiltradas.filter((m) => m.cat === 1).length;
    const pieCategorias: PieSlice[] = [
      {
        id: "c3",
        label: "Cat 3 · Choque / DOM",
        value: cat3Count,
        color: "#ef4444",
        formattedValue: `${cat3Count} caso(s)`,
      },
      {
        id: "c2",
        label: "Cat 2 · Alerta Sepsis",
        value: cat2Count,
        color: "#f59e0b",
        formattedValue: `${cat2Count} caso(s)`,
      },
      {
        id: "c1",
        label: "Cat 1 · Baja Posibilidad",
        value: cat1Count,
        color: "#22c55e",
        formattedValue: `${cat1Count} caso(s)`,
      },
    ];

    const enMetaCount = metricasFiltradas.filter((m) => m.cumpleMeta).length;
    const excedeMetaCount = metricasFiltradas.length - enMetaCount;
    const pieMeta: PieSlice[] = [
      {
        id: "ok",
        label: "Dentro de Meta (≤45/60m)",
        value: enMetaCount,
        color: "#10b981",
        formattedValue: `${enMetaCount} caso(s)`,
      },
      {
        id: "late",
        label: "Excede Meta Dorada",
        value: excedeMetaCount,
        color: "#e11d48",
        formattedValue: `${excedeMetaCount} caso(s)`,
      },
    ];

    return {
      avgTotal,
      tasaCumplimiento,
      modulosBars,
      maxModuloSegs,
      slowestModulo,
      submodulosBars,
      maxSubSegs,
      slowestSubmodulo,
      pieEtapas,
      pieCategorias,
      pieMeta,
    };
  }, [casosAnalisis, metricasFiltradas]);

  // Chronological dataset for Line Chart
  const serieCronologica = useMemo(() => {
    return [...metricasFiltradas].sort(
      (a, b) => a.paciente.fechaCreacion - b.paciente.fechaCreacion
    );
  }, [metricasFiltradas]);

  const escalaMaxTimelineSegs = useMemo(() => {
    const maxCaso = Math.max(...metricasFiltradas.map((m) => m.totalSegs), 3600);
    return Math.ceil(maxCaso / 900) * 900;
  }, [metricasFiltradas]);

  if (pacientes.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
        <BarChart3 className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-black text-slate-800">
          Sin casos registrados para analizar
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          En cuanto se registre el primer paciente en Fase 1 (Triage), el Tablero de Control mostrará los gráficos de barras, pastel, líneas y cuellos de botella en tiempo real.
        </p>
      </div>
    );
  }

  // Line Chart SVG coordinate helpers
  const lineSvgW = 680;
  const lineSvgH = 230;
  const padL = 46;
  const padR = 24;
  const padT = 18;
  const padB = 34;
  const plotW = lineSvgW - padL - padR;
  const plotH = lineSvgH - padT - padB;
  const maxLineMins = Math.max(
    65,
    Math.ceil(Math.max(...serieCronologica.map((c) => c.totalSegs / 60), 0) / 10) * 10
  );
  const getX = (idx: number) =>
    serieCronologica.length <= 1
      ? padL + plotW / 2
      : padL + (idx / (serieCronologica.length - 1)) * plotW;
  const getY = (mins: number) => padT + plotH - (Math.min(mins, maxLineMins) / maxLineMins) * plotH;

  const buildPolyline = (getter: (c: CasoMetrica) => number) =>
    serieCronologica
      .map((c, i) => `${getX(i).toFixed(1)},${getY(getter(c) / 60).toFixed(1)}`)
      .join(" ");

  const activeLineCaso =
    hoverLineIdx !== null && serieCronologica[hoverLineIdx]
      ? serieCronologica[hoverLineIdx]
      : serieCronologica[serieCronologica.length - 1] || null;

  return (
    <div className="space-y-6">
      {/* FILTER & DRILLDOWN TOOLBAR */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-sky-700" />
          <span>Filtros del Tablero de Control</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={casoSeleccionadoId}
            onChange={(e) => setCasoSeleccionadoId(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 max-w-[260px]"
          >
            <option value="todos">
              Todos los casos filtrados ({metricasFiltradas.length})
            </option>
            {metricasFiltradas.map((m) => (
              <option key={m.paciente.id} value={m.paciente.id}>
                {m.paciente.codigo} · {m.paciente.nombre || m.paciente.identificacionPaciente}
              </option>
            ))}
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="todas">Todas las categorías</option>
            <option value="3">Cat 3 · Choque Séptico / DOM</option>
            <option value="2">Cat 2 · Alerta Sepsis</option>
            <option value="1">Cat 1 · Baja Posibilidad</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">En atención activa</option>
            <option value="completados">Casos cerrados</option>
          </select>

          <button
            type="button"
            disabled={metricasFiltradas.length === 0 || exportandoPdf}
            onClick={() => {
              if (metricasFiltradas.length === 0) return;
              setExportandoPdf(true);
              try {
                exportTableroControlPdf({
                  metricasFiltradas,
                  serieCronologica,
                  filtroCategoria,
                  filtroEstado,
                  casoSeleccionadoId,
                  modoPastelCasos,
                  stats,
                });
              } finally {
                setTimeout(() => setExportandoPdf(false), 400);
              }
            }}
            className="bg-[#0f2b5c] hover:bg-sky-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Descargar Tablero de Control completo en PDF (KPIs, gráficos y comparativa por caso)"
          >
            <FileDown className="w-4 h-4" />
            <span>{exportandoPdf ? "Generando PDF..." : "Descargar PDF"}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            {casoSeleccionadoId === "todos" ? "Casos Analizados" : "Caso Seleccionado"}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {casoSeleccionadoId === "todos"
                ? metricasFiltradas.length
                : casosAnalisis[0]?.paciente.codigo || "—"}
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {metricasFiltradas.filter((m) => !m.cerrado && !m.descartado).length} activos
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {metricasFiltradas.filter((m) => m.cerrado).length} cerrados ·{" "}
            {metricasFiltradas.filter((m) => m.descartado).length} descartados
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            {casoSeleccionadoId === "todos" ? "Tiempo Promedio Total" : "Tiempo Total del Caso"}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              {fmtMinSeg(stats.avgTotal)}
            </span>
            <span className="text-xs font-bold text-slate-600 tabular-nums">
              ({fmtMinDecimal(stats.avgTotal)})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Desde tamizaje inicial hasta cierre/actual
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">
            Cumplimiento Hora Dorada (45/60m)
          </span>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-black font-mono tabular-nums ${
                stats.tasaCumplimiento >= 80
                  ? "text-emerald-700"
                  : stats.tasaCumplimiento >= 50
                  ? "text-amber-600"
                  : "text-rose-700"
              }`}
            >
              {stats.tasaCumplimiento}%
            </span>
            {stats.tasaCumplimiento >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Cat 3: ≤ 45 min · Cat 1 y 2: ≤ 60 min
          </span>
        </div>

        <div className="bg-rose-50/70 border border-rose-300 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-black uppercase text-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Cuello de Botella Principal
          </span>
          <div className="text-sm font-black text-slate-900 truncate">
            {stats.slowestSubmodulo.segs > 0
              ? stats.slowestSubmodulo.label
              : stats.slowestModulo.label}
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 block tabular-nums">
            Mayor demora: {fmtMinSeg(stats.slowestSubmodulo.segs > 0 ? stats.slowestSubmodulo.segs : stats.slowestModulo.segs)} (
            {fmtMinDecimal(stats.slowestSubmodulo.segs > 0 ? stats.slowestSubmodulo.segs : stats.slowestModulo.segs)})
          </span>
        </div>
      </div>

      {/* ROW 1: GRÁFICO DE BARRAS VERTICALES (ETAPAS) + BARRAS HORIZONTALES (SUBMÓDULOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BARRAS VERTICALES: TIEMPO POR MÓDULO PRINCIPAL (FASE 1, 2, 3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0c2340]" />
                <span>Gráfico de Barras · Tiempo por Fase</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Fase 3 contabiliza desde que Fase 2 reporta el caso a DETECTO
              </p>
            </div>
            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
              Barras (mm:ss)
            </span>
          </div>

          {/* Vertical SVG-style Column Bars */}
          <div className="h-52 pt-4 pb-2 px-3 bg-slate-50/60 border border-slate-200/80 rounded-xl flex items-end justify-around gap-4">
            {stats.modulosBars.map((bar) => {
              const pct = Math.min(100, Math.round((bar.segs / stats.maxModuloSegs) * 100));
              const isSlowest = bar.id === stats.slowestModulo.id && bar.segs > 0;
              return (
                <div
                  key={bar.id}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 max-w-[130px]"
                >
                  <div className="text-center">
                    <span className="text-xs font-mono font-black text-slate-900 tabular-nums block">
                      {fmtMinSeg(bar.segs)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums block">
                      {fmtMinDecimal(bar.segs)}
                    </span>
                  </div>

                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className={`w-14 sm:w-16 rounded-t-xl transition-all duration-500 shadow-sm relative ${
                        isSlowest ? "ring-2 ring-rose-500" : ""
                      }`}
                      style={{
                        height: `${Math.max(bar.segs > 0 ? 12 : 4, pct)}%`,
                        backgroundColor: isSlowest ? "#e11d48" : bar.color,
                      }}
                    >
                      {isSlowest && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded whitespace-nowrap">
                          Mayor
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center pt-1 border-t border-slate-200 w-full">
                    <span className="text-[11px] font-black text-slate-800 block leading-tight">
                      {bar.shortLabel}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {bar.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BARRAS HORIZONTALES: TIEMPO POR SUBMÓDULO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Barras por Submódulo (Fase 2 / Lab)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Comparativa de demora por submódulo desde su activación
              </p>
            </div>
            <span className="text-[10px] font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200">
              4 Submódulos
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {stats.submodulosBars.map((sub) => {
              const pct = Math.min(100, Math.round((sub.segs / stats.maxSubSegs) * 100));
              const isSlowest = sub.id === stats.slowestSubmodulo.id && sub.segs > 0;

              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-black text-slate-800">{sub.label}</span>
                      {isSlowest && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded">
                          Cuello de botella
                        </span>
                      )}
                      {sub.pendientes > 0 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                          {sub.pendientes} pendiente(s)
                        </span>
                      )}
                      {"completadoLabExt" in sub && (sub.completadoLabExt ?? 0) > 0 && (
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          <FlaskConical className="w-3 h-3" />
                          {sub.completadoLabExt} desde Lab
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-black text-slate-900 tabular-nums shrink-0">
                      {sub.segs > 0 ? fmtMinSeg(sub.segs) : "—"}
                    </div>
                  </div>

                  <div className="w-full h-5 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${
                        isSlowest ? "bg-rose-600" : sub.color
                      }`}
                      style={{ width: `${Math.max(sub.segs > 0 ? 4 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: GRÁFICOS DE PASTEL (DISTRIBUCIÓN DE TIEMPOS Y CATEGORÍAS/METAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-700" />
                <span>Gráfico de Pastel · Peso de cada Etapa</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proporción porcentual del tiempo consumido en Fase 1, 2 y 3
              </p>
            </div>
          </div>

          <DonutChartSvg
            slices={stats.pieEtapas}
            centerLabel="Total Prom."
            centerValue={fmtMinSeg(
              stats.pieEtapas.reduce((a, b) => a + b.value, 0)
            )}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-700" />
                <span>Gráfico de Pastel · Casos y Metas</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribución por clasificación Triage o cumplimiento de hora dorada
              </p>
            </div>

            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setModoPastelCasos("categoria")}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  modoPastelCasos === "categoria"
                    ? "bg-[#0f2b5c] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setModoPastelCasos("meta")}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  modoPastelCasos === "meta"
                    ? "bg-[#0f2b5c] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cumplimiento
              </button>
            </div>
          </div>

          <DonutChartSvg
            slices={
              modoPastelCasos === "categoria" ? stats.pieCategorias : stats.pieMeta
            }
            centerLabel="Casos"
            centerValue={`${metricasFiltradas.length}`}
          />
        </div>
      </div>

      {/* ROW 3: GRÁFICO DE LÍNEAS (TENDENCIA TEMPORAL POR CASO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-700" />
              <span>Gráfico de Líneas · Evolución de Tiempos por Caso</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tendencia cronológica en minutos de Tiempo Total, Fase 2 y Fase 3 frente a la meta de 60 min
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0f2b5c] inline-block" />
              Total
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" />
              Fase 2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-700 inline-block" />
              Fase 3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-600 inline-block" />
              Meta 60m
            </span>
          </div>
        </div>

        {/* Readout bar for hovered/latest point */}
        {activeLineCaso && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black bg-[#0f2b5c] text-white px-2 py-0.5 rounded">
                {activeLineCaso.paciente.codigo}
              </span>
              <span className="font-bold text-slate-800">
                {activeLineCaso.paciente.nombre ||
                  `ID: ${activeLineCaso.paciente.identificacionPaciente}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-mono font-bold tabular-nums">
              <span className="text-sky-700">
                F1: {fmtMinSeg(activeLineCaso.fase1Segs)}
              </span>
              <span className="text-amber-700">
                F2: {fmtMinSeg(activeLineCaso.fase2Segs)}
              </span>
              <span className="text-purple-700">
                F3: {fmtMinSeg(activeLineCaso.fase3Segs)}
              </span>
              <span className="text-slate-950 font-black">
                Total: {fmtMinSeg(activeLineCaso.totalSegs)}
              </span>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${lineSvgW} ${lineSvgH}`}
            className="w-full min-w-[520px] h-56 select-none"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const val = Math.round(maxLineMins * frac);
              const y = getY(val);
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={lineSvgW - padR}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono font-bold"
                  >
                    {val}m
                  </text>
                </g>
              );
            })}

            {/* Meta 60 min dashed line */}
            <line
              x1={padL}
              y1={getY(60)}
              x2={lineSvgW - padR}
              y2={getY(60)}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text
              x={lineSvgW - padR}
              y={getY(60) - 5}
              textAnchor="end"
              className="fill-rose-600 text-[9px] font-black"
            >
              Meta 60 min
            </text>

            {/* Polylines when >= 2 points */}
            {serieCronologica.length >= 2 && (
              <>
                <polyline
                  fill="none"
                  stroke="#0f2b5c"
                  strokeWidth="2.75"
                  strokeLinejoin="round"
                  points={buildPolyline((c) => c.totalSegs)}
                />
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={buildPolyline((c) => c.fase2Segs)}
                />
                <polyline
                  fill="none"
                  stroke="#7e22ce"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={buildPolyline((c) => c.fase3Segs)}
                />
              </>
            )}

            {/* Data Points & X labels */}
            {serieCronologica.map((c, idx) => {
              const x = getX(idx);
              const yTotal = getY(c.totalSegs / 60);
              const yF2 = getY(c.fase2Segs / 60);
              const yF3 = getY(c.fase3Segs / 60);
              const isHov = hoverLineIdx === idx;
              const shortCode = c.paciente.codigo.replace("HILA-2026-", "#");

              return (
                <g
                  key={c.paciente.id}
                  onMouseEnter={() => setHoverLineIdx(idx)}
                  onMouseLeave={() => setHoverLineIdx(null)}
                  className="cursor-pointer"
                >
                  {isHov && (
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={yF2}
                    r={isHov ? 5 : 3.5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={x}
                    cy={yF3}
                    r={isHov ? 5 : 3.5}
                    fill="#7e22ce"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={x}
                    cy={yTotal}
                    r={isHov ? 6 : 4.5}
                    fill="#0f2b5c"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={lineSvgH - 10}
                    textAnchor="middle"
                    className="fill-slate-600 text-[10px] font-mono font-bold"
                  >
                    {shortCode}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ROW 4: DESGLOSE COMPARATIVO DE CADA CASO (BARRA APILADA + SUBMÓDULOS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0c2340]" />
              <span>Comparativa por Caso · Tiempos por Etapa y Submódulo</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Haga clic en un caso o en el icono de ojo para abrir su historia clínica completa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-600 inline-block" />
              Fase 1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              Fase 2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-700 inline-block" />
              Fase 3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3.5 bg-rose-600 inline-block" />
              Meta Dorada
            </span>
          </div>
        </div>

        {metricasFiltradas.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            No hay casos que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div className="space-y-3">
            {metricasFiltradas.map((m) => {
              const p = m.paciente;
              const f1Pct = (m.fase1Segs / escalaMaxTimelineSegs) * 100;
              const f2Pct = (m.fase2Segs / escalaMaxTimelineSegs) * 100;
              const f3Pct = (m.fase3Segs / escalaMaxTimelineSegs) * 100;
              const metaPct = Math.min(98, (m.metaSegs / escalaMaxTimelineSegs) * 100);
              const isSelected = casoSeleccionadoId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() =>
                    setCasoSeleccionadoId(isSelected ? "todos" : p.id)
                  }
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? "bg-sky-50/70 border-sky-500 ring-2 ring-sky-200"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-black bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {p.codigo}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {p.nombre || `ID: ${p.identificacionPaciente}`}
                      </span>
                      {m.cat === 3 && (
                        <span className="text-[10px] font-black bg-[#ff9999] text-black px-2 py-0.5 rounded">
                          Cat 3 (45m)
                        </span>
                      )}
                      {m.cat === 2 && (
                        <span className="text-[10px] font-black bg-[#f4b400] text-black px-2 py-0.5 rounded">
                          Cat 2 (60m)
                        </span>
                      )}
                      {m.cat === 1 && (
                        <span className="text-[10px] font-black bg-[#7ecc61] text-black px-2 py-0.5 rounded">
                          Cat 1 (60m)
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          m.cumpleMeta
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {m.cumpleMeta ? "Dentro de meta" : "Excede meta"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Total ({m.cerrado ? "Cerrado" : m.descartado ? "Descartado" : "En curso"})
                        </span>
                        <span className="text-sm font-black font-mono text-slate-900 tabular-nums">
                          {fmtMinSeg(m.totalSegs)}
                        </span>
                      </div>

                      {onSeleccionarPacienteParaDetalle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSeleccionarPacienteParaDetalle(p);
                          }}
                          className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs cursor-pointer"
                          title="Ver historia clínica del caso"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stacked Horizontal Bar with Golden Hour Marker */}
                  <div className="relative h-6 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center">
                    <div
                      className="h-full bg-sky-600 transition-all"
                      style={{ width: `${f1Pct}%` }}
                      title={`Fase 1 Triage: ${fmtMinSeg(m.fase1Segs)}`}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${f2Pct}%` }}
                      title={`Fase 2 Urgencias: ${fmtMinSeg(m.fase2Segs)}`}
                    />
                    <div
                      className="h-full bg-purple-700 transition-all"
                      style={{ width: `${f3Pct}%` }}
                      title={`Fase 3 DETECTO: ${fmtMinSeg(m.fase3Segs)}`}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
                      style={{ left: `${metaPct}%` }}
                      title={`Meta dorada: ${fmtMinSeg(m.metaSegs)}`}
                    />
                  </div>

                  {/* Submodule granular breakdown row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        1. Validación Triage
                      </span>
                      <span className="font-mono font-black text-slate-900 tabular-nums">
                        {m.subValidacionEstado === "no_iniciado"
                          ? "—"
                          : fmtMinSeg(m.subValidacionSegs)}
                      </span>
                      {m.subValidacionEstado === "pendiente" && (
                        <span className="text-[9px] font-bold text-amber-700 ml-1">(pend)</span>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        2. Checklist 1
                      </span>
                      <span className="font-mono font-black text-slate-900 tabular-nums">
                        {m.subChecklist1Estado === "no_iniciado"
                          ? "—"
                          : fmtMinSeg(m.subChecklist1Segs)}
                      </span>
                      {m.subChecklist1Estado === "pendiente" && (
                        <span className="text-[9px] font-bold text-amber-700 ml-1">(pend)</span>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        3. Laboratorios
                      </span>
                      <span className="font-mono font-black text-slate-900 tabular-nums">
                        {m.subLabEstado === "no_iniciado" ? "—" : fmtMinSeg(m.subLabSegs)}
                      </span>
                      {m.subLabEstado === "pendiente" && (
                        <span className="text-[9px] font-bold text-amber-700 ml-1">(pend)</span>
                      )}
                      {m.labOrigen === "laboratorios" && (
                        <span className="text-[9px] font-bold text-teal-700 ml-1">(Lab)</span>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-500 block text-[10px] font-bold">
                        4. Anexo Clínico
                      </span>
                      <span className="font-mono font-black text-slate-900 tabular-nums">
                        {m.subAnexoEstado === "no_iniciado" ? "—" : fmtMinSeg(m.subAnexoSegs)}
                      </span>
                      {m.subAnexoEstado === "pendiente" && (
                        <span className="text-[9px] font-bold text-amber-700 ml-1">(pend)</span>
                      )}
                    </div>

                    <div className="bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 col-span-2 sm:col-span-1">
                      <span className="text-rose-700 block text-[10px] font-black">
                        Mayor Demora
                      </span>
                      <span className="font-bold text-rose-950 truncate block">
                        {m.submoduloMasLentoSegs > 0 ? m.submoduloMasLento : m.moduloMasLento}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import { jsPDF } from "jspdf";
import { PacienteRegistro } from "../types";

export interface PdfCasoMetrica {
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

export interface PdfPieSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  formattedValue: string;
}

export interface ExportTableroPdfInput {
  metricasFiltradas: PdfCasoMetrica[];
  serieCronologica: PdfCasoMetrica[];
  filtroCategoria: string;
  filtroEstado: string;
  casoSeleccionadoId: string;
  modoPastelCasos: "categoria" | "meta";
  stats: {
    avgTotal: number;
    tasaCumplimiento: number;
    modulosBars: Array<{
      id: string;
      label: string;
      shortLabel: string;
      segs: number;
      color: string;
    }>;
    maxModuloSegs: number;
    slowestModulo: { id: string; label: string; segs: number };
    submodulosBars: Array<{
      id: string;
      label: string;
      segs: number;
      pendientes: number;
      completadoLabExt?: number;
    }>;
    maxSubSegs: number;
    slowestSubmodulo: { id: string; label: string; segs: number };
    pieEtapas: PdfPieSlice[];
    pieCategorias: PdfPieSlice[];
    pieMeta: PdfPieSlice[];
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [15, 43, 92];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function fmtMinSeg(totalSeg: number): string {
  const segs = Math.max(0, Math.round(totalSeg));
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function fmtMinDecimal(totalSeg: number): string {
  return `${(Math.max(0, totalSeg) / 60).toFixed(1)} min`;
}

function truncText(txt: string, max: number): string {
  if (!txt) return "";
  return txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

function drawHeaderBanner(
  doc: jsPDF,
  pageNum: number,
  subtitle: string
) {
  doc.setFillColor(15, 43, 92);
  doc.rect(0, 0, 297, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DETECTO - TABLERO DE CONTROL ANALÍTICO", 12, 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(
    `Hospital Infantil Los Ángeles (HILA) · ${subtitle}`,
    12,
    16
  );

  const fechaGen = new Date().toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(`Generado: ${fechaGen}  |  Pág. ${pageNum}`, 285, 13, {
    align: "right",
  });
}

function drawDonutChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  slices: PdfPieSlice[],
  centerLabel: string,
  centerValue: string
) {
  const total = slices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  if (total <= 0) {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.circle(cx, cy, outerR, "FD");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("Sin datos", cx, cy + 1, { align: "center" });
    return;
  }

  let currentAngle = -Math.PI / 2;
  for (const slice of slices) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * Math.PI * 2;
    const [r, g, b] = hexToRgb(slice.color);
    doc.setFillColor(r, g, b);
    doc.setDrawColor(r, g, b);

    const steps = Math.max(12, Math.ceil((sweep / (Math.PI * 2)) * 120));
    const stepAngle = sweep / steps;
    const overlap = 0.008;
    for (let i = 0; i < steps; i++) {
      const a1 = currentAngle + i * stepAngle;
      const a2 = Math.min(currentAngle + sweep, currentAngle + (i + 1) * stepAngle + overlap);
      const x1 = cx + outerR * Math.cos(a1);
      const y1 = cy + outerR * Math.sin(a1);
      const x2 = cx + outerR * Math.cos(a2);
      const y2 = cy + outerR * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, "F");
    }
    currentAngle += sweep;
  }

  // White inner circle for donut center
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR, "F");

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(centerLabel.toUpperCase(), cx, cy - 2, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(centerValue, cx, cy + 4, { align: "center" });
}

export function exportTableroControlPdf(input: ExportTableroPdfInput): void {
  const {
    metricasFiltradas,
    serieCronologica,
    filtroCategoria,
    filtroEstado,
    casoSeleccionadoId,
    modoPastelCasos,
    stats,
  } = input;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const catLabel =
    filtroCategoria === "todas"
      ? "Todas las categorías"
      : `Categoría ${filtroCategoria}`;
  const estLabel =
    filtroEstado === "todos"
      ? "Todos los estados"
      : filtroEstado === "activos"
      ? "En atención activa"
      : "Casos cerrados";
  const casoLabel =
    casoSeleccionadoId === "todos"
      ? `Todos (${metricasFiltradas.length} casos)`
      : metricasFiltradas.find((m) => m.paciente.id === casoSeleccionadoId)?.paciente
          .codigo || "Caso específico";

  // =========================================================================
  // PÁGINA 1: RESUMEN KPI + GRÁFICOS DE BARRAS (FASES Y SUBMÓDULOS)
  // =========================================================================
  drawHeaderBanner(
    doc,
    1,
    `Filtros: ${catLabel} · ${estLabel} · Selección: ${casoLabel}`
  );

  // 4 KPI Cards
  const kpiY = 27;
  const kpiW = 65.5;
  const kpiH = 24;
  const kpiGap = 3.5;

  const activosCount = metricasFiltradas.filter(
    (m) => !m.cerrado && !m.descartado
  ).length;
  const cerradosCount = metricasFiltradas.filter((m) => m.cerrado).length;
  const descartadosCount = metricasFiltradas.filter((m) => m.descartado).length;

  const cuelloLabel =
    stats.slowestSubmodulo.segs > 0
      ? stats.slowestSubmodulo.label
      : stats.slowestModulo.label;
  const cuelloSegs =
    stats.slowestSubmodulo.segs > 0
      ? stats.slowestSubmodulo.segs
      : stats.slowestModulo.segs;

  const kpis = [
    {
      title: casoSeleccionadoId === "todos" ? "CASOS ANALIZADOS" : "CASO SELECCIONADO",
      value:
        casoSeleccionadoId === "todos"
          ? `${metricasFiltradas.length}`
          : casoLabel,
      sub: `${activosCount} activos · ${cerradosCount} cerrados · ${descartadosCount} desc.`,
      bg: [255, 255, 255] as [number, number, number],
      border: [203, 213, 225] as [number, number, number],
      valColor: [15, 23, 42] as [number, number, number],
    },
    {
      title: "TIEMPO PROMEDIO TOTAL",
      value: fmtMinSeg(stats.avgTotal),
      sub: `Equivalente a ${fmtMinDecimal(stats.avgTotal)}`,
      bg: [255, 255, 255] as [number, number, number],
      border: [203, 213, 225] as [number, number, number],
      valColor: [15, 43, 92] as [number, number, number],
    },
    {
      title: "CUMPLIMIENTO HORA DORADA",
      value: `${stats.tasaCumplimiento}%`,
      sub: "Cat 3: <= 45 min · Cat 1 y 2: <= 60 min",
      bg: [255, 255, 255] as [number, number, number],
      border: [203, 213, 225] as [number, number, number],
      valColor:
        stats.tasaCumplimiento >= 80
          ? ([4, 120, 87] as [number, number, number])
          : ([190, 18, 60] as [number, number, number]),
    },
    {
      title: "CUELLO DE BOTELLA PRINCIPAL",
      value: truncText(cuelloLabel, 24),
      sub: `Mayor demora: ${fmtMinSeg(cuelloSegs)} (${fmtMinDecimal(cuelloSegs)})`,
      bg: [255, 241, 242] as [number, number, number],
      border: [253, 164, 175] as [number, number, number],
      valColor: [159, 18, 57] as [number, number, number],
    },
  ];

  kpis.forEach((k, idx) => {
    const x = 12 + idx * (kpiW + kpiGap);
    doc.setFillColor(...k.bg);
    doc.setDrawColor(...k.border);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, x + 4, kpiY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(idx === 3 ? 11 : 15);
    doc.setTextColor(...k.valColor);
    doc.text(k.value, x + 4, kpiY + 14.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(k.sub, x + 4, kpiY + 20.5);
  });

  // Bar Chart Left: Vertical Bars by Phase
  const cardY = 56;
  const cardH = 140;
  const leftW = 132;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, cardY, leftW, cardH, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("GRÁFICO DE BARRAS · TIEMPO POR FASE", 17, cardY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Fase 3 contabiliza desde que Fase 2 reporta el caso a DETECTO",
    17,
    cardY + 13
  );

  // Plot area
  const chartBaseY = cardY + 115;
  const chartTopY = cardY + 28;
  const chartMaxH = chartBaseY - chartTopY;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, chartBaseY, 136, chartBaseY);
  doc.line(20, chartTopY + chartMaxH * 0.5, 136, chartTopY + chartMaxH * 0.5);
  doc.line(20, chartTopY, 136, chartTopY);

  stats.modulosBars.forEach((bar, i) => {
    const barW = 24;
    const cx = 39 + i * 38;
    const bx = cx - barW / 2;
    const frac = Math.min(1, bar.segs / Math.max(stats.maxModuloSegs, 1));
    const bh = Math.max(bar.segs > 0 ? 4 : 1.5, frac * chartMaxH);
    const by = chartBaseY - bh;
    const isSlowest = bar.id === stats.slowestModulo.id && bar.segs > 0;
    const [r, g, b] = isSlowest ? [225, 29, 72] : hexToRgb(bar.color);

    doc.setFillColor(r, g, b);
    doc.roundedRect(bx, by, barW, bh, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(fmtMinSeg(bar.segs), cx, by - 5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(fmtMinDecimal(bar.segs), cx, by - 1.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(bar.shortLabel, cx, chartBaseY + 6, { align: "center" });
    if (isSlowest) {
      doc.setFontSize(7);
      doc.setTextColor(190, 18, 60);
      doc.text("(Mayor demora)", cx, chartBaseY + 11, { align: "center" });
    }
  });

  // Bar Chart Right: Horizontal Bars by Submodule
  const rightX = 149;
  const rightW = 136;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightX, cardY, rightW, cardH, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BARRAS POR SUBMÓDULO (FASE 2 / LAB)", rightX + 5, cardY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Comparativa de demora por submódulo desde su activación",
    rightX + 5,
    cardY + 13
  );

  const subColors: Record<string, [number, number, number]> = {
    s1: [2, 132, 199],
    s2: [79, 70, 229],
    s3: [13, 148, 136],
    s4: [217, 119, 6],
  };

  stats.submodulosBars.forEach((sub, idx) => {
    const sy = cardY + 26 + idx * 27;
    const isSlowest = sub.id === stats.slowestSubmodulo.id && sub.segs > 0;
    const frac = Math.min(1, sub.segs / Math.max(stats.maxSubSegs, 1));
    const maxTrackW = rightW - 14;
    const fillW = sub.segs > 0 ? Math.max(3, frac * maxTrackW) : 0;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(sub.label, rightX + 6, sy);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      sub.segs > 0 ? `${fmtMinSeg(sub.segs)} (${fmtMinDecimal(sub.segs)})` : "—",
      rightX + rightW - 6,
      sy,
      { align: "right" }
    );

    // Track
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightX + 6, sy + 3, maxTrackW, 8, 2, 2, "FD");

    if (fillW > 0) {
      const col = isSlowest ? ([225, 29, 72] as [number, number, number]) : subColors[sub.id] || [15, 43, 92];
      doc.setFillColor(...col);
      doc.roundedRect(rightX + 6, sy + 3, fillW, 8, 2, 2, "F");
    }

    const tags: string[] = [];
    if (isSlowest) tags.push("Cuello de botella");
    if (sub.pendientes > 0) tags.push(`${sub.pendientes} pendiente(s)`);
    if (sub.completadoLabExt && sub.completadoLabExt > 0) {
      tags.push(`${sub.completadoLabExt} desde módulo Lab`);
    }
    if (tags.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(isSlowest ? 190 : 71, isSlowest ? 18 : 85, isSlowest ? 60 : 105);
      doc.text(tags.join(" · "), rightX + 6, sy + 16);
    }
  });

  // =========================================================================
  // PÁGINA 2: GRÁFICOS DE PASTEL + GRÁFICO DE LÍNEAS
  // =========================================================================
  doc.addPage();
  drawHeaderBanner(
    doc,
    2,
    "Distribución Porcentual (Pastel) y Evolución Temporal por Caso (Líneas)"
  );

  // Pie 1: Peso por etapa
  const pieY = 27;
  const pieH = 74;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, pieY, 134, pieH, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("GRÁFICO DE PASTEL · PESO DE CADA ETAPA", 17, pieY + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Proporción porcentual de Fase 1, Fase 2 y Fase 3", 17, pieY + 11.5);

  const totalEtapasSegs = stats.pieEtapas.reduce((a, b) => a + b.value, 0);
  drawDonutChart(
    doc,
    43,
    pieY + 43,
    22,
    12,
    stats.pieEtapas,
    "Total Prom.",
    fmtMinSeg(totalEtapasSegs)
  );

  stats.pieEtapas.forEach((s, i) => {
    const ly = pieY + 26 + i * 14;
    const pct = totalEtapasSegs > 0 ? Math.round((s.value / totalEtapasSegs) * 100) : 0;
    const [r, g, b] = hexToRgb(s.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(72, ly, 4, 4, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(truncText(s.label, 24), 78, ly + 3.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${pct}% (${s.formattedValue})`, 141, ly + 3.2, { align: "right" });
  });

  // Pie 2: Casos y Metas
  const pie2X = 151;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pie2X, pieY, 134, pieH, 3, 3, "FD");

  const activeSlices2 =
    modoPastelCasos === "categoria" ? stats.pieCategorias : stats.pieMeta;
  const totalCasosPie = activeSlices2.reduce((a, b) => a + b.value, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    modoPastelCasos === "categoria"
      ? "GRÁFICO DE PASTEL · CATEGORÍAS TRIAGE"
      : "GRÁFICO DE PASTEL · CUMPLIMIENTO HORA DORADA",
    pie2X + 5,
    pieY + 7
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Distribución sobre ${metricasFiltradas.length} caso(s) filtrados`,
    pie2X + 5,
    pieY + 11.5
  );

  drawDonutChart(
    doc,
    pie2X + 31,
    pieY + 43,
    22,
    12,
    activeSlices2,
    "Casos",
    `${metricasFiltradas.length}`
  );

  activeSlices2.forEach((s, i) => {
    const ly = pieY + 26 + i * 14;
    const pct = totalCasosPie > 0 ? Math.round((s.value / totalCasosPie) * 100) : 0;
    const [r, g, b] = hexToRgb(s.color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(pie2X + 60, ly, 4, 4, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(truncText(s.label, 24), pie2X + 66, ly + 3.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`${pct}% (${s.formattedValue})`, pie2X + 129, ly + 3.2, {
      align: "right",
    });
  });

  // Line Chart (full width below Pies)
  const lineBoxY = 106;
  const lineBoxH = 92;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, lineBoxY, 273, lineBoxH, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "GRÁFICO DE LÍNEAS · EVOLUCIÓN DE TIEMPOS POR CASO (MINUTOS)",
    17,
    lineBoxY + 7.5
  );

  // Legend
  const legends = [
    { label: "Total", color: [15, 43, 92] as [number, number, number] },
    { label: "Fase 2", color: [245, 158, 11] as [number, number, number] },
    { label: "Fase 3", color: [126, 34, 206] as [number, number, number] },
    { label: "Meta 60 min", color: [225, 29, 72] as [number, number, number] },
  ];
  legends.forEach((leg, idx) => {
    const lx = 190 + idx * 24;
    doc.setDrawColor(...leg.color);
    doc.setLineWidth(0.9);
    doc.line(lx, lineBoxY + 6.5, lx + 5, lineBoxY + 6.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(leg.label, lx + 6.5, lineBoxY + 7.5);
  });

  const gx0 = 28;
  const gx1 = 276;
  const gy0 = lineBoxY + 18;
  const gy1 = lineBoxY + 78;
  const maxMins = Math.max(
    65,
    Math.ceil(Math.max(...serieCronologica.map((c) => c.totalSegs / 60), 0) / 10) * 10
  );

  const getLineX = (idx: number) =>
    serieCronologica.length <= 1
      ? (gx0 + gx1) / 2
      : gx0 + (idx / (serieCronologica.length - 1)) * (gx1 - gx0);
  const getLineY = (mins: number) =>
    gy1 - (Math.min(mins, maxMins) / maxMins) * (gy1 - gy0);

  doc.setLineWidth(0.2);
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const val = Math.round(maxMins * f);
    const yy = getLineY(val);
    doc.setDrawColor(226, 232, 240);
    doc.line(gx0, yy, gx1, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${val}m`, gx0 - 2, yy + 1, { align: "right" });
  });

  // Meta 60 min horizontal line
  const y60 = getLineY(60);
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(gx0, y60, gx1, y60);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.8);
  doc.setTextColor(225, 29, 72);
  doc.text("Meta 60m", gx1, y60 - 1.5, { align: "right" });

  // Draw series lines
  const drawSeries = (
    getter: (m: PdfCasoMetrica) => number,
    color: [number, number, number],
    width: number
  ) => {
    if (serieCronologica.length >= 2) {
      doc.setDrawColor(...color);
      doc.setLineWidth(width);
      for (let i = 0; i < serieCronologica.length - 1; i++) {
        const xA = getLineX(i);
        const yA = getLineY(getter(serieCronologica[i]) / 60);
        const xB = getLineX(i + 1);
        const yB = getLineY(getter(serieCronologica[i + 1]) / 60);
        doc.line(xA, yA, xB, yB);
      }
    }
    serieCronologica.forEach((c, i) => {
      const px = getLineX(i);
      const py = getLineY(getter(c) / 60);
      doc.setFillColor(...color);
      doc.circle(px, py, 1.2, "F");
    });
  };

  drawSeries((c) => c.fase2Segs, [245, 158, 11], 0.55);
  drawSeries((c) => c.fase3Segs, [126, 34, 206], 0.55);
  drawSeries((c) => c.totalSegs, [15, 43, 92], 0.85);

  // X Labels
  const stepLabel = Math.max(1, Math.ceil(serieCronologica.length / 16));
  serieCronologica.forEach((c, i) => {
    if (i % stepLabel !== 0 && i !== serieCronologica.length - 1) return;
    const px = getLineX(i);
    const shortCode = c.paciente.codigo.replace("HILA-2026-", "#");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(shortCode, px, gy1 + 5, { align: "center" });
  });

  // =========================================================================
  // PÁGINA 3+: TABLA COMPARATIVA DE CASOS Y SUBMÓDULOS
  // =========================================================================
  let currentPage = 3;
  doc.addPage();
  drawHeaderBanner(
    doc,
    currentPage,
    `Detalle Comparativo por Caso y Submódulos (${metricasFiltradas.length} registros)`
  );

  const cols = [
    { header: "Código", x: 12, w: 23 },
    { header: "Paciente / ID", x: 35, w: 38 },
    { header: "Cat", x: 73, w: 12 },
    { header: "Estado", x: 85, w: 20 },
    { header: "F1", x: 105, w: 15 },
    { header: "F2", x: 120, w: 15 },
    { header: "F3", x: 135, w: 15 },
    { header: "Total", x: 150, w: 16 },
    { header: "Meta", x: 166, w: 20 },
    { header: "Sub1 Val.", x: 186, w: 18 },
    { header: "Sub2 Chk1", x: 204, w: 18 },
    { header: "Sub3 Lab", x: 222, w: 20 },
    { header: "Sub4 Anexo", x: 242, w: 19 },
    { header: "Mayor Demora", x: 261, w: 24 },
  ];

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(15, 43, 92);
    doc.rect(12, yPos, 273, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    cols.forEach((c) => {
      doc.text(c.header, c.x + 1.5, yPos + 5.2);
    });
  };

  let rowY = 28;
  drawTableHeader(rowY);
  rowY += 8;

  metricasFiltradas.forEach((m, idx) => {
    if (rowY > 194) {
      currentPage += 1;
      doc.addPage();
      drawHeaderBanner(
        doc,
        currentPage,
        "Detalle Comparativo por Caso y Submódulos (Continuación)"
      );
      rowY = 28;
      drawTableHeader(rowY);
      rowY += 8;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, rowY, 273, 7.5, "FD");

    const p = m.paciente;
    const estadoTxt = m.cerrado
      ? "Cerrado"
      : m.descartado
      ? "Descartado"
      : "En curso";
    const pacNombre = p.nombre
      ? `${p.nombre} (${p.identificacionPaciente || ""})`
      : p.identificacionPaciente || "Sin ID";
    const mayorDem =
      m.submoduloMasLentoSegs > 0 ? m.submoduloMasLento : m.moduloMasLento;

    const vals = [
      p.codigo.replace("HILA-2026-", "HILA-"),
      truncText(pacNombre, 22),
      `Cat ${m.cat}`,
      estadoTxt,
      fmtMinSeg(m.fase1Segs),
      fmtMinSeg(m.fase2Segs),
      m.fase3Segs > 0 ? fmtMinSeg(m.fase3Segs) : "—",
      fmtMinSeg(m.totalSegs),
      m.cumpleMeta ? "En Meta" : "Excede",
      m.subValidacionEstado === "no_iniciado" ? "—" : fmtMinSeg(m.subValidacionSegs),
      m.subChecklist1Estado === "no_iniciado" ? "—" : fmtMinSeg(m.subChecklist1Segs),
      m.subLabEstado === "no_iniciado"
        ? "—"
        : `${fmtMinSeg(m.subLabSegs)}${m.labOrigen === "laboratorios" ? " (L)" : ""}`,
      m.subAnexoEstado === "no_iniciado" ? "—" : fmtMinSeg(m.subAnexoSegs),
      truncText(mayorDem, 15),
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    vals.forEach((v, cIdx) => {
      if (cIdx === 8) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(
          m.cumpleMeta ? 4 : 190,
          m.cumpleMeta ? 120 : 18,
          m.cumpleMeta ? 87 : 60
        );
      } else if (cIdx === 0 || cIdx === 7) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
      }
      doc.text(v, cols[cIdx].x + 1.5, rowY + 5);
    });

    rowY += 7.5;
  });

  const dateTag = new Date().toISOString().split("T")[0];
  doc.save(`Tablero_Control_DETECTO_HILA_${dateTag}.pdf`);
}

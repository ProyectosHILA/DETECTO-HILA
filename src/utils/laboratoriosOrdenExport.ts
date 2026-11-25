import * as XLSX from "xlsx";
import { PacienteRegistro, LaboratoriosDOMData } from "../types";

export interface FilaOrdenLaboratorio {
  id: string;
  sistema: string;
  examen: string;
  detalle: string;
  cups: string; // Siempre en blanco por ahora hasta recibir los códigos CUPS
  prioridadMeta: string;
  fechaHora: string;
  resultadoEstado: string;
  solicitadoOValorado: boolean;
}

const LABELS_CATEGORIA: Record<1 | 2 | 3, string> = {
  1: "BAJA POSIBILIDAD DE SEPSIS (Cat 1)",
  2: "ALERTA DE SEPSIS SIN DOM (Cat 2)",
  3: "ALERTA CHOQUE SÉPTICO / DOM (Cat 3)",
};

export function construirListaLaboratoriosPorCaso(
  categoria: 1 | 2 | 3,
  labs?: LaboratoriosDOMData
): FilaOrdenLaboratorio[] {
  const data = labs || {};
  const metaDOM =
    categoria === 3
      ? "INMEDIATO (Meta ≤ 45 min)"
      : categoria === 2
      ? "URGENTE (Primeras 2 horas / Meta ≤ 60 min)"
      : "PRIORITARIO (Protocolo MAMUTTS ≤ 60 min)";

  const filas: FilaOrdenLaboratorio[] = [
    {
      id: "hemograma",
      sistema: "Hematológico",
      examen: "Hemograma completo",
      detalle: "Hemoglobina, hematocrito, plaquetas, leucocitos, neutrófilos (RAN), linfocitos",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.hemograma?.fechaHora || "",
      resultadoEstado: data.hemograma?.valor
        ? data.hemograma.valor
        : data.hemograma?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.hemograma?.checked || data.hemograma?.valor),
    },
    {
      id: "tpInr",
      sistema: "Hematológico / Coagulación",
      examen: "Tiempo de Protrombina (TP / INR)",
      detalle: "Evaluación de coagulopatía / DOM hematológica (últimas 6 horas)",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.tpInr?.fechaHora || "",
      resultadoEstado: data.tpInr?.valor
        ? data.tpInr.valor
        : data.tpInr?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.tpInr?.checked || data.tpInr?.valor),
    },
    {
      id: "fibrinogeno",
      sistema: "Hematológico / Coagulación",
      examen: "Fibrinógeno",
      detalle: "Estudio de coagulación / disfunción orgánica múltiple",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.fibrinogeno?.fechaHora || "",
      resultadoEstado: data.fibrinogeno?.valor
        ? data.fibrinogeno.valor
        : data.fibrinogeno?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.fibrinogeno?.checked || data.fibrinogeno?.valor),
    },
    {
      id: "dimeroD",
      sistema: "Hematológico / Coagulación",
      examen: "Dímero D",
      detalle: "Marcador de coagulopatía / trombosis asociada a sepsis",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.dimeroD?.fechaHora || "",
      resultadoEstado: data.dimeroD?.valor
        ? data.dimeroD.valor
        : data.dimeroD?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.dimeroD?.checked || data.dimeroD?.valor),
    },
    {
      id: "pcr",
      sistema: "Inflamatorio / Hematológico",
      examen: "Proteína C Reactiva (PCR)",
      detalle: "Marcador inflamatorio cuantitativo",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.pcr?.fechaHora || "",
      resultadoEstado: data.pcr?.valor
        ? data.pcr.valor
        : data.pcr?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.pcr?.checked || data.pcr?.valor),
    },
    {
      id: "astAlt",
      sistema: "Hepático",
      examen: "Transaminasas (AST / ALT)",
      detalle: "Evaluación de disfunción hepática (últimas 6 horas)",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.astAlt?.fechaHora || "",
      resultadoEstado: data.astAlt?.valor
        ? data.astAlt.valor
        : data.astAlt?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.astAlt?.checked || data.astAlt?.valor),
    },
    {
      id: "bilirrubina",
      sistema: "Hepático",
      examen: "Bilirrubina Total y Directa",
      detalle: "Evaluación de disfunción hepática (últimas 6 horas)",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.bilirrubina?.fechaHora || "",
      resultadoEstado: data.bilirrubina?.valor
        ? data.bilirrubina.valor
        : data.bilirrubina?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.bilirrubina?.checked || data.bilirrubina?.valor),
    },
    {
      id: "creatinina",
      sistema: "Renal",
      examen: "Creatinina sérica (y BUN)",
      detalle: "Evaluación de función renal / DOM renal",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.creatinina?.fechaHora || "",
      resultadoEstado: data.creatinina?.valor
        ? data.creatinina.valor
        : data.creatinina?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.creatinina?.checked || data.creatinina?.valor),
    },
    {
      id: "electrolitos",
      sistema: "Renal / Hidroelectrolítico",
      examen: "Electrolitos séricos",
      detalle: "Calcio, Sodio, Potasio, Magnesio y Cloro",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.electrolitos?.fechaHora || "",
      resultadoEstado: data.electrolitos?.valor
        ? data.electrolitos.valor
        : data.electrolitos?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.electrolitos?.checked || data.electrolitos?.valor),
    },
    {
      id: "lactatoSerico",
      sistema: "Cardiovascular / Perfusión",
      examen: "Lactato sérico",
      detalle: "Evaluación de hipoperfusión tisular y choque séptico",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.lactatoSerico?.fechaHora || "",
      resultadoEstado: data.lactatoSerico?.valor
        ? data.lactatoSerico.valor
        : data.lactatoSerico?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.lactatoSerico?.checked || data.lactatoSerico?.valor),
    },
    {
      id: "glucosa",
      sistema: "Metabólico",
      examen: "Glucosa sérica / Glucometría",
      detalle: "Descartar hipoglucemia o disfunción metabólica",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.glucosa?.fechaHora || "",
      resultadoEstado: data.glucosa?.valor
        ? data.glucosa.valor
        : data.glucosa?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.glucosa?.checked || data.glucosa?.valor),
    },
    {
      id: "gasesPaFiO2",
      sistema: "Respiratorio",
      examen: "Gases Arteriales (PaO₂ / FiO₂ - PaFiO₂)",
      detalle:
        categoria === 3
          ? "Evaluación respiratoria y cálculo PaFiO₂ (Módulo TERAPIAS)"
          : "Clasificación respiratoria PaFiO₂ si hay compromiso respiratorio",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.gasesPaFiO2?.fechaHora || "",
      resultadoEstado: data.gasesPaFiO2?.resultado
        ? `PaFiO₂: ${data.gasesPaFiO2.resultado} (PaO₂ ${data.gasesPaFiO2.pao2 || "-"} / FiO₂ ${data.gasesPaFiO2.fio2 || "-"})`
        : data.gasesPaFiO2?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.gasesPaFiO2?.checked || data.gasesPaFiO2?.resultado),
    },
    {
      id: "spFiO2",
      sistema: "Respiratorio",
      examen: "Oximetría / Índice SpFiO₂ (SaFiO₂)",
      detalle:
        categoria === 3
          ? "Registro SpO₂ / FiO₂ en Módulo TERAPIAS"
          : "Clasificación respiratoria no invasiva SpO₂ / FiO₂",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.spFiO2?.fechaHora || "",
      resultadoEstado: data.spFiO2?.resultado
        ? `SpFiO₂: ${data.spFiO2.resultado} (SpO₂ ${data.spFiO2.spo2 || "-"} / FiO₂ ${data.spFiO2.fio2 || "-"})`
        : data.spFiO2?.checked
        ? "Solicitado / Marcado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.spFiO2?.checked || data.spFiO2?.resultado),
    },
    {
      id: "hemocultivosA3",
      sistema: "Microbiológico",
      examen: "Hemocultivos (Periférico + Línea Central)",
      detalle: "2 sets: 1 periférico + 1 de línea central si tiene CVC/PICC + cultivos según foco",
      cups: "",
      prioridadMeta:
        categoria === 3
          ? "INMEDIATO (Antes de ATB sin retrasar >45 min)"
          : "URGENTE (Antes de ATB / Meta ≤ 60 min)",
      fechaHora: data.hemocultivosA3?.fechaHora || "",
      resultadoEstado: data.hemocultivosA3?.detalle
        ? data.hemocultivosA3.detalle
        : data.hemocultivosA3?.tomado
        ? "Tomado / Solicitado"
        : "Pendiente",
      solicitadoOValorado: Boolean(data.hemocultivosA3?.tomado || data.hemocultivosA3?.detalle),
    },
    {
      id: "aislamientosPrevios",
      sistema: "Microbiológico",
      examen: "Revisión de aislamientos previos y cultivos adicionales",
      detalle: "Urocultivo, cultivo de punta de catéter, secreciones o LCR según foco clínico",
      cups: "",
      prioridadMeta: metaDOM,
      fechaHora: data.aislamientosPrevios?.fechaHora || "",
      resultadoEstado: data.aislamientosPrevios?.valor
        ? data.aislamientosPrevios.valor
        : data.aislamientosPrevios?.checked
        ? "Revisado / Solicitado"
        : "Pendiente",
      solicitadoOValorado: Boolean(
        data.aislamientosPrevios?.checked || data.aislamientosPrevios?.valor
      ),
    },
  ];

  if (categoria === 3) {
    filas.push({
      id: "monitoreoGastoUrinario",
      sistema: "Renal / Hemodinámico",
      examen: "Monitoreo estricto de gasto urinario",
      detalle: "Control horario en cc/kg/h para evaluación de DOM renal en Choque Séptico",
      cups: "",
      prioridadMeta: "CONTINUO / INMEDIATO (Choque Séptico)",
      fechaHora: data.monitoreoGastoUrinario?.fechaHora || "",
      resultadoEstado: data.monitoreoGastoUrinario?.valor
        ? data.monitoreoGastoUrinario.valor
        : data.monitoreoGastoUrinario?.checked
        ? "En monitoreo"
        : "Pendiente",
      solicitadoOValorado: Boolean(
        data.monitoreoGastoUrinario?.checked || data.monitoreoGastoUrinario?.valor
      ),
    });
  }

  if (categoria === 1) {
    filas.push(
      {
        id: "procalcitonina",
        sistema: "Inflamatorio / MAMUTTS",
        examen: "Procalcitonina (si disponibilidad)",
        detalle: "Paraclínico inicial algoritmo neutropenia febril MAMUTTS",
        cups: "",
        prioridadMeta: "PRIORITARIO (Algoritmo MAMUTTS)",
        fechaHora: "",
        resultadoEstado: "Según criterio clínico MAMUTTS",
        solicitadoOValorado: false,
      },
      {
        id: "imagenesFoco",
        sistema: "Imágenes Diagnósticas",
        examen: "Imágenes según foco clínico (Rx tórax / Eco abdominal / RNM cerebral)",
        detalle: "Solicitar según síntomas respiratorios, abdominales o neurológicos",
        cups: "",
        prioridadMeta: "Según foco clínico",
        fechaHora: "",
        resultadoEstado: "Según foco clínico",
        solicitadoOValorado: false,
      }
    );
  }

  return filas;
}

export async function copiarListaLaboratoriosTabla(
  filas: FilaOrdenLaboratorio[],
  meta: { codigo?: string; paciente?: string; identificacion?: string; categoria: 1 | 2 | 3 }
): Promise<void> {
  const headers = [
    "Código Caso",
    "Paciente",
    "Identificación",
    "Clasificación",
    "Sistema / Grupo",
    "Examen / Laboratorio Solicitado",
    "Parámetros / Detalle",
    "CUPS",
    "Prioridad / Meta",
    "Fecha/Hora",
    "Estado / Resultado",
  ];

  const rows = filas.map((f) => [
    meta.codigo || "GENERAL",
    meta.paciente || "Sin nombre",
    meta.identificacion || "Sin ID",
    LABELS_CATEGORIA[meta.categoria],
    f.sistema,
    f.examen,
    f.detalle,
    f.cups, // En blanco
    f.prioridadMeta,
    f.fechaHora,
    f.resultadoEstado,
  ]);

  const tsv = [
    headers.join("\t"),
    ...rows.map((r) => r.map((cell) => String(cell ?? "").replace(/[\t\r\n]+/g, " ")).join("\t")),
  ].join("\n");

  const escapeHtml = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const html = `
    <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
      <thead>
        <tr style="background:#0b4d6c;color:#ffffff;font-weight:bold;">
          ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr>${r.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      const item = new ClipboardItem({
        "text/plain": new Blob([tsv], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      });
      await navigator.clipboard.write([item]);
      return;
    } catch {
      // Fallback a writeText si ClipboardItem HTML está restringido en el navegador/iframe
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(tsv);
  } else {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export function exportarListaLaboratoriosExcelPlano(
  filas: FilaOrdenLaboratorio[],
  meta: { codigo?: string; paciente?: string; identificacion?: string; categoria: 1 | 2 | 3 },
  pacienteObj?: PacienteRegistro | null
): void {
  const plano = filas.map((f, index) => ({
    Orden: index + 1,
    "Código Caso": meta.codigo || pacienteObj?.codigo || "GENERAL",
    Paciente: meta.paciente || pacienteObj?.nombre || "",
    Identificación: meta.identificacion || pacienteObj?.identificacionPaciente || "",
    Clasificación: LABELS_CATEGORIA[meta.categoria],
    "Sistema / Grupo": f.sistema,
    "Examen / Laboratorio Solicitado": f.examen,
    "Parámetros / Detalle": f.detalle,
    CUPS: f.cups || "",
    "Prioridad / Meta": f.prioridadMeta,
    "Fecha / Hora": f.fechaHora || "",
    "Estado / Resultado": f.resultadoEstado,
  }));

  const ws = XLSX.utils.json_to_sheet(plano);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laboratorios_CUPS");

  const sufijo = (meta.codigo || "Caso").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fecha = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Lista_Laboratorios_CUPS_${sufijo}_${fecha}.xlsx`);
}

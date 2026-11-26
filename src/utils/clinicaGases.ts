import { ParaclinicoEntry, VasopresoresData } from "../types";

export interface EvaluacionPlaquetasResult {
  tieneHemograma: boolean;
  tienePlaquetas: boolean;
  plaquetas: number | null;
  plaquetasFormateadas: string;
  estado: "sin_hemograma" | "sin_plaquetas" | "adecuadas" | "trombocitopenia";
  gasesArterialesHabilitados: boolean;
}

function parseNumeroPlaquetas(rawNum: string, unidadExtra?: string): number | null {
  const clean = rawNum.trim();
  if (!clean) return null;

  let val: number;
  if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    val = parseInt(clean.replace(/\./g, ""), 10);
  } else if (/^\d{1,3}(,\d{3})+$/.test(clean)) {
    val = parseInt(clean.replace(/,/g, ""), 10);
  } else {
    val = parseFloat(clean.replace(",", "."));
  }

  if (Number.isNaN(val) || val < 0) return null;

  const u = (unidadExtra || "").toLowerCase();
  if (u && /(mil|k|10\^?3|10e3|10\*3)/.test(u) && val < 1000) {
    val = Math.round(val * 1000);
  }

  return Math.round(val);
}

export function evaluarPlaquetasHemograma(
  hemograma?: ParaclinicoEntry
): EvaluacionPlaquetasResult {
  const texto = (hemograma?.valor || "").trim();
  const tieneHemograma = Boolean(hemograma?.checked || texto.length > 0);

  if (!tieneHemograma || !texto) {
    return {
      tieneHemograma: false,
      tienePlaquetas: false,
      plaquetas: null,
      plaquetasFormateadas: "",
      estado: "sin_hemograma",
      gasesArterialesHabilitados: false,
    };
  }

  // Buscar primero etiqueta explícita de plaquetas (Plaq, Plaquetas, PLT, Trombocitos)
  const rxEtiqueta =
    /(?:\bplaquetas\b|\bplaq\b|\bplt\b|\btrombocitos\b)\s*[:=\-]?\s*([\d.,]+)\s*(mil|k|x\s*10\^?3|10e3|10\*3)?/i;
  const mEtiqueta = texto.match(rxEtiqueta);

  let plaquetas: number | null = null;
  if (mEtiqueta && mEtiqueta[1]) {
    plaquetas = parseNumeroPlaquetas(mEtiqueta[1], mEtiqueta[2]);
  } else {
    // Si todo el campo es únicamente un valor numérico (ej. "85.000", "42000", "120 k/uL")
    const mSolo = texto.match(
      /^([\d.,]+)\s*(mil|k|x\s*10\^?3|\/?mm3|\/?mm³|\/?[uµ]L)?$/i
    );
    if (mSolo && mSolo[1]) {
      const parsed = parseNumeroPlaquetas(mSolo[1], mSolo[2]);
      if (parsed !== null && (parsed >= 1000 || /(mil|k|10\^?3)/i.test(mSolo[2] || ""))) {
        plaquetas = parsed;
      }
    }
  }

  if (plaquetas === null) {
    return {
      tieneHemograma: true,
      tienePlaquetas: false,
      plaquetas: null,
      plaquetasFormateadas: "",
      estado: "sin_plaquetas",
      gasesArterialesHabilitados: false,
    };
  }

  const plaquetasFormateadas = plaquetas.toLocaleString("es-CO");
  const estado = plaquetas >= 50000 ? "adecuadas" : "trombocitopenia";

  return {
    tieneHemograma: true,
    tienePlaquetas: true,
    plaquetas,
    plaquetasFormateadas,
    estado,
    gasesArterialesHabilitados: true,
  };
}

export function calcPaFiO2(pao2Str: string, fio2Str: string): string {
  const pao2 = parseFloat(String(pao2Str || "").replace(",", "."));
  let fio2 = parseFloat(String(fio2Str || "").replace(",", "."));
  if (!Number.isNaN(pao2) && !Number.isNaN(fio2) && fio2 > 0) {
    if (fio2 > 1) fio2 = fio2 / 100;
    return (pao2 / fio2).toFixed(1);
  }
  return "";
}

export function calcSpFiO2(spo2Str: string, fio2Str: string): string {
  const spo2 = parseFloat(String(spo2Str || "").replace(",", "."));
  let fio2 = parseFloat(String(fio2Str || "").replace(",", "."));
  if (!Number.isNaN(spo2) && !Number.isNaN(fio2) && fio2 > 0) {
    if (fio2 > 1) fio2 = fio2 / 100;
    return (spo2 / fio2).toFixed(1);
  }
  return "";
}

export interface AlertaOrdenVasopresor {
  nivel: "critica" | "advertencia" | "info";
  titulo: string;
  detalle: string;
}

export interface CalculoOrdenVasopresor {
  pesoValido: boolean;
  pesoNum: number;
  dosisValida: boolean;
  dosisNum: number;
  metodoActivo: "metodo_a" | "metodo_b";
  diluyenteActivo: "SSN 0.9%" | "DAD 5%";
  superficieCorporal: string; // m2
  mgTotales: string;
  volumenTotalCc: string;
  ccAmpolla: string;
  ampollasRequeridas: string;
  concentracionMcgMl: string;
  velocidadMlHr: string;
  hidrocortisonaDiaMg: string;
  hidrocortisonaDosisC6hMg: string;
  requiereHidrocortisonaPorDosis: boolean;
  alertas: AlertaOrdenVasopresor[];
  ordenMedicaTexto: string;
}

export function calcularOrdenVasopresorPorPeso(
  data: VasopresoresData,
  pesoIngresoDefault = "",
  horaIngresoDefault = ""
): CalculoOrdenVasopresor {
  const pesoStr =
    data.pesoKg !== undefined && data.pesoKg !== "" ? data.pesoKg : pesoIngresoDefault;
  const pesoNum = parseFloat(String(pesoStr || "").replace(",", "."));
  const pesoValido = !Number.isNaN(pesoNum) && pesoNum > 0;

  const dosisRaw = String(data.dosisMcgKgMin || "0.1").replace(",", ".");
  const dosisNum = parseFloat(dosisRaw);
  const dosisValida = !Number.isNaN(dosisNum) && dosisNum > 0;

  const metodoActivo: "metodo_a" | "metodo_b" =
    data.metodo === "metodo_b" ? "metodo_b" : "metodo_a";
  const diluyenteActivo: "SSN 0.9%" | "DAD 5%" =
    data.diluyente === "DAD 5%" ? "DAD 5%" : "SSN 0.9%";

  // Superficie corporal pediátrica estimada por peso: (4 * peso + 7) / (peso + 90)
  const scNum = pesoValido ? (4 * pesoNum + 7) / (pesoNum + 90) : 0;
  const superficieCorporal = pesoValido ? scNum.toFixed(2) : "";

  const hidrocortisonaDiaMg = pesoValido ? (100 * scNum).toFixed(1) : "";
  const hidrocortisonaDosisC6hMg = pesoValido ? (25 * scNum).toFixed(1) : "";

  let mgTotales = "";
  let volumenTotalCc = "";
  let ccAmpolla = "";
  let ampollasRequeridas = "";
  let concentracionMcgMl = "";
  let velocidadMlHr = "";

  if (metodoActivo === "metodo_a") {
    // 1 mg en 50 cc = 20 mcg/ml -> velocidad = 3 * dosis * peso
    mgTotales = "1.00";
    volumenTotalCc = "50";
    ccAmpolla = "1.00";
    ampollasRequeridas =
      data.medicamento === "noradrenalina"
        ? "1 ml de ampolla 4 mg/4 ml (1 mg)"
        : "1 ampolla de 1 mg/1 ml";
    concentracionMcgMl = "20.0";
    if (pesoValido && dosisValida) {
      velocidadMlHr = (3 * dosisNum * pesoNum).toFixed(2);
    }
  } else {
    // Método B: 0.3 * peso(kg) mg en 500 cc -> 0.1 mcg/kg/min = 10 cc/hr -> velocidad = dosis * 100
    volumenTotalCc = "500";
    if (pesoValido) {
      const mgB = 0.3 * pesoNum;
      mgTotales = mgB.toFixed(2);
      ccAmpolla = mgB.toFixed(2);
      const numAmpAdr = Math.ceil(mgB / 1);
      const numAmpNor = Math.ceil(mgB / 4);
      ampollasRequeridas =
        data.medicamento === "noradrenalina"
          ? `${mgB.toFixed(2)} ml (${numAmpNor} ampolla(s) de 4 mg/4 ml)`
          : `${mgB.toFixed(2)} ml (${numAmpAdr} ampolla(s) de 1 mg/1 ml)`;
      concentracionMcgMl = ((mgB * 1000) / 500).toFixed(2);
    }
    if (dosisValida) {
      velocidadMlHr = (dosisNum * 100).toFixed(2);
    }
  }

  const requiereHidrocortisonaPorDosis = dosisValida && dosisNum > 0.25;
  const alertas: AlertaOrdenVasopresor[] = [];

  if (!pesoValido) {
    alertas.push({
      nivel: "critica",
      titulo: "Peso faltante o inválido",
      detalle:
        "Ingrese el peso real del paciente en kg para calcular automáticamente la preparación por peso y la velocidad de infusión.",
    });
  } else if (pesoNum > 100 || pesoNum < 1.5) {
    alertas.push({
      nivel: "advertencia",
      titulo: `Alerta de peso atípico (${pesoNum} kg)`,
      detalle:
        pesoNum > 100
          ? "El peso ingresado supera 100 kg. Verifique el peso real pediátrico antes de preparar la mezcla vasoactiva."
          : "Peso menor a 1.5 kg. Verifique peso neonatal/lactante y confirme dosificación con pediatría/UCI.",
    });
  }

  if (!dosisValida) {
    alertas.push({
      nivel: "advertencia",
      titulo: "Dosis sin definir",
      detalle: "Digite la dosis en mcg/kg/min (rango estándar 0.05 – 2.0 mcg/kg/min).",
    });
  } else {
    if (dosisNum < 0.05 || dosisNum > 2) {
      alertas.push({
        nivel: "critica",
        titulo: `Dosis fuera de rango terapéutico (${dosisNum} mcg/kg/min)`,
        detalle:
          "El rango protocolizado DETECTO para Adrenalina/Noradrenalina es 0.05 – 2.0 mcg/kg/min. Confirme indicación médica.",
      });
    }
    if (dosisNum > 0.25) {
      alertas.push({
        nivel: "critica",
        titulo: "Dosis > 0.25 mcg/kg/min — Choque refractario / Alerta UCI",
        detalle:
          "Obligatorio considerar Hidrocortisona (100 mg/m²/día), evaluar 2º vasoactivo y gestionar acceso venoso central.",
      });
    }
  }

  if (data.viaAcceso === "vena_periferica" || !data.viaAcceso) {
    alertas.push({
      nivel: "info",
      titulo: "Cuidado de Vía Periférica (Inicio Temprano)",
      detalle:
        "Vigilar permeabilidad, retorno venoso y signos de extravasación/isquemia cada 15 min mientras se asegura acceso central si persiste requerimiento.",
    });
  }

  const nombreMed =
    data.medicamento === "noradrenalina"
      ? "NORADRENALINA (Ampolla 4 mg / 4 ml)"
      : data.medicamento === "ambos"
      ? "ADRENALINA + NORADRENALINA (2º Vasoactivo)"
      : data.medicamento === "adrenalina"
      ? "ADRENALINA (Ampolla 1 mg / 1 ml)"
      : "SELECCIONAR MEDICAMENTO VASOACTIVO";

  const viaTexto =
    data.viaAcceso === "acceso_central"
      ? "Catéter Venoso Central"
      : data.viaAcceso === "intraosea"
      ? "Vía Intraósea"
      : "Vena Periférica (Inicio Temprano)";

  const horaFinal = data.horaInicio || horaIngresoDefault || "Inmediato";

  const lineasOrden: string[] = [
    "============================================================",
    "ORDEN MÉDICA — INFUSIÓN DE VASOPRESORES (PROTOCOLO DETECTO)",
    "============================================================",
    `Conducta: ${
      data.iniciado === "pendiente_respuesta_bolo"
        ? "En observación post 1er bolo (10 ml/kg) — orden de respaldo lista"
        : "INICIAR INFUSIÓN CONTINUA DE VASOPRESOR"
    }`,
    `Hora de orden / inicio: ${horaFinal}`,
    `Peso del paciente: ${pesoValido ? `${pesoNum} kg` : "SIN DEFINIR"} | SC estimada: ${
      superficieCorporal ? `${superficieCorporal} m²` : "—"
    }`,
    "------------------------------------------------------------",
    `1. MEDICAMENTO: ${nombreMed}`,
    `   Vía de administración: ${viaTexto}`,
    `   Método de dilución: ${
      metodoActivo === "metodo_a"
        ? "MÉTODO A — Concentración fija (1 mg en 50 cc = 20 mcg/ml)"
        : `MÉTODO B — Fórmula por peso (0.3 × ${pesoValido ? pesoNum : "__"} kg = ${
            mgTotales || "__"
          } mg en 500 cc)`
    }`,
    `   Preparación exacta: Tomar ${
      ccAmpolla ? `${ccAmpolla} ml (${mgTotales} mg)` : "___ ml"
    }${ampollasRequeridas ? ` [${ampollasRequeridas}]` : ""} y aforar hasta ${volumenTotalCc} cc de ${diluyenteActivo}.`,
    `   Dosis ordenada: ${dosisValida ? `${dosisNum} mcg/kg/min` : "___ mcg/kg/min"} (rango titulación 0.05 – 2 mcg/kg/min).`,
    `   Velocidad de bomba de infusión: ${
      velocidadMlHr ? `${velocidadMlHr} cc/hr` : "___ cc/hr"
    }${concentracionMcgMl ? ` (Concentración final: ${concentracionMcgMl} mcg/ml)` : ""}.`,
  ];

  if (data.considerarHidrocortisona || requiereHidrocortisonaPorDosis) {
    lineasOrden.push(
      `2. HIDROCORTISONA (100 mg/m²/día): Administrar ${
        hidrocortisonaDosisC6hMg
          ? `${hidrocortisonaDosisC6hMg} mg IV cada 6 horas (Total día: ${hidrocortisonaDiaMg} mg/día para SC ${superficieCorporal} m²)`
          : "100 mg/m²/día dividido cada 6 horas IV"
      }.`
    );
  }

  if (data.segundoVasoactivoAccesoCentral || requiereHidrocortisonaPorDosis) {
    lineasOrden.push(
      `3. SOPORTE ADICIONAL: Evaluar inicio de 2º vasoactivo y canalización de acceso venoso central + notificación prioritaria a UCIP.`
    );
  }

  lineasOrden.push(
    `4. MONITOREO: Control estricto de TA, FC, SatO2, perfusión capilar y sitio de venopunción cada 15 minutos; titular según metas hemodinámicas por edad.`
  );

  if (data.observaciones?.trim()) {
    lineasOrden.push(`5. OBSERVACIONES CLÍNICAS: ${data.observaciones.trim()}`);
  }

  lineasOrden.push(
    `Médico que ordena / Responsable: ${data.responsable?.trim() || "Por firmar"}`
  );

  return {
    pesoValido,
    pesoNum: pesoValido ? pesoNum : 0,
    dosisValida,
    dosisNum: dosisValida ? dosisNum : 0,
    metodoActivo,
    diluyenteActivo,
    superficieCorporal,
    mgTotales,
    volumenTotalCc,
    ccAmpolla,
    ampollasRequeridas,
    concentracionMcgMl,
    velocidadMlHr,
    hidrocortisonaDiaMg,
    hidrocortisonaDosisC6hMg,
    requiereHidrocortisonaPorDosis,
    alertas,
    ordenMedicaTexto: lineasOrden.join("\n"),
  };
}

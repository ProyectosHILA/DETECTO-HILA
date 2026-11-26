import express, { NextFunction, Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  deleteDoc,
} from "firebase/firestore";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no está configurada en el servidor. Verifique Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const isTransientGeminiError = (err: any): boolean => {
  const status = err?.status || err?.statusCode || err?.error?.code;
  const msg = String(err?.message || err?.error?.message || "").toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === 502 ||
    status === 504 ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("resource_exhausted") ||
    msg.includes("overloaded") ||
    msg.includes("try again later")
  );
};

async function generateWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  fallbackModel: string,
  buildRequest: (model: string, isFallback: boolean) => any
) {
  let lastErr: any;
  const attempts: Array<{ model: string; isFallback: boolean; waitMs: number }> = [
    { model: primaryModel, isFallback: false, waitMs: 800 },
    { model: primaryModel, isFallback: false, waitMs: 1200 },
    { model: fallbackModel, isFallback: true, waitMs: 1000 },
    { model: fallbackModel, isFallback: true, waitMs: 0 },
  ];

  for (const attempt of attempts) {
    try {
      return await ai.models.generateContent(
        buildRequest(attempt.model, attempt.isFallback)
      );
    } catch (err: any) {
      lastErr = err;
      if (!isTransientGeminiError(err) || attempt.waitMs === 0) {
        if (!isTransientGeminiError(err) && attempt.isFallback) {
          throw err;
        }
        if (!isTransientGeminiError(err)) {
          throw err;
        }
      }
      if (attempt.waitMs > 0) {
        await new Promise((r) => setTimeout(r, attempt.waitMs));
      }
    }
  }
  throw lastErr;
}

function formatFriendlyGeminiError(err: any, fallbackMsg: string): string {
  const msg = String(err?.message || "");
  if (isTransientGeminiError(err)) {
    return "El servicio de análisis IA tiene alta demanda temporal. Intente nuevamente en unos segundos.";
  }
  return msg && !msg.startsWith("{") ? msg : fallbackMsg;
}

function extractLabsFromTextStrict(rawText: string) {
  const clean = rawText.replace(/\r/g, "\n");
  const findDateTime = () => {
    const m = clean.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-]\d{2,4})?\s+(\d{1,2}):(\d{2})/);
    if (!m) return "";
    return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")} ${m[3].padStart(2, "0")}:${m[4]}`;
  };
  const findTimeOnly = () => {
    const m = clean.match(/\b(\d{1,2}):(\d{2})\b/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  };
  const globalDT = findDateTime();
  const globalTime = findTimeOnly();

  const nombreM = clean.match(/paciente\s*[:\-]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ ]{3,50})/i);
  const idM = clean.match(/(?:c[eé]dula|identificaci[oó]n|documento|\bID\b)\s*[:\-]?\s*([0-9.\-]{5,20})/i);

  const emptyEntry = () => ({ presente: false, fechaHora: "", valor: "", evidencia: "" });

  // Hemograma
  const hbM = clean.match(/(?:\bhb\b|hemoglobina)\s*[:\-]?\s*(\d+(?:[.,]\d+)?\s*(?:g\/d[lL]|gr\/d[lL])?)/i);
  const plaqM = clean.match(/(?:\bplaq(?:uetas)?\b)\s*[:\-]?\s*([\d.,]+\s*(?:\/?mm3|\/?mm³|x?10\^?3\/?[uµ]L|K\/uL)?)/i);
  const neutM = clean.match(/(?:\bneutr[oó]filos(?:\s+absolutos)?\b|\bRAN\b|\bneut\b)\s*[:\-]?\s*([\d.,]+\s*(?:\/?mm3|\/?mm³|c[eé]l\/[uµ]L)?)/i);
  const linfM = clean.match(/(?:\blinfocitos\b|\blinf\b)\s*[:\-]?\s*([\d.,]+\s*(?:\/?mm3|\/?mm³)?)/i);
  const hemoParts: string[] = [];
  if (hbM) hemoParts.push(`Hb ${hbM[1].trim()}`);
  if (plaqM) hemoParts.push(`Plaq ${plaqM[1].trim()}`);
  if (neutM) hemoParts.push(`Neut ${neutM[1].trim()}`);
  if (linfM) hemoParts.push(`Linf ${linfM[1].trim()}`);
  const hemograma = hemoParts.length > 0
    ? { presente: true, fechaHora: globalDT, valor: hemoParts.join(", "), evidencia: hemoParts.join(", ") }
    : emptyEntry();

  const matchSimple = (regex: RegExp, unitDefault = "", onlyTime = false) => {
    const m = clean.match(regex);
    if (!m || !m[1]) return emptyEntry();
    const val = `${m[1].trim()}${unitDefault && !/[a-zA-Z%]/.test(m[1]) ? " " + unitDefault : ""}`.trim();
    return {
      presente: true,
      fechaHora: onlyTime ? globalTime : globalDT,
      valor: val,
      evidencia: m[0].trim().slice(0, 80),
    };
  };

  // TP / INR
  const tpM = clean.match(/\bTP\b(?:\s*\(seg\))?\s*[:\-]?\s*(\d+(?:[.,]\d+)?\s*(?:seg|s)?)/i);
  const inrM = clean.match(/\bINR\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i);
  const tpInrParts: string[] = [];
  if (tpM) tpInrParts.push(`TP ${tpM[1].trim()}`);
  if (inrM) tpInrParts.push(`INR ${inrM[1].trim()}`);
  const tpInr = tpInrParts.length > 0
    ? { presente: true, fechaHora: globalDT, valor: tpInrParts.join(" / "), evidencia: tpInrParts.join(" / ") }
    : emptyEntry();

  const fibrinogeno = matchSimple(/fibrin[oó]geno\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/d[lL])?)/i, "mg/dL");
  const dimeroD = matchSimple(/d[ií]mero\s*d\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:ng\/m[lL]|ug\/m[lL]|mg\/[lL]))?)/i, "ng/mL");
  const pcr = matchSimple(/(?:prote[ií]na\s*c\s*reactiva(?:\s*\(PCR\))?|\bPCR\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/[lL]|\s*mg\/d[lL])?)/i, "mg/L");

  const astM = clean.match(/\b(?:AST|TGO)\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*U\/[lL])?)/i);
  const altM = clean.match(/\b(?:ALT|TGP)\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*U\/[lL])?)/i);
  const astAltParts: string[] = [];
  if (astM) astAltParts.push(`AST ${astM[1].trim()}`);
  if (altM) astAltParts.push(`ALT ${altM[1].trim()}`);
  const astAlt = astAltParts.length > 0
    ? { presente: true, fechaHora: globalDT, valor: astAltParts.join(", "), evidencia: astAltParts.join(", ") }
    : emptyEntry();

  const btM = clean.match(/bilirrubina\s*total\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/d[lL])?)/i);
  const bdM = clean.match(/bilirrubina\s*directa\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/d[lL])?)/i);
  const biliParts: string[] = [];
  if (btM) biliParts.push(`BT ${btM[1].trim()}`);
  if (bdM) biliParts.push(`BD ${bdM[1].trim()}`);
  const bilirrubina = biliParts.length > 0
    ? { presente: true, fechaHora: globalDT, valor: biliParts.join(", "), evidencia: biliParts.join(", ") }
    : emptyEntry();

  const creatinina = matchSimple(/creatinina(?:\s*s[eé]rica)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/d[lL])?)/i, "mg/dL");

  const elecParts: string[] = [];
  const naM = clean.match(/(?:sodio|\bNa\+?\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mEq\/[lL]|mmol\/[lL]))?)/i);
  const kM = clean.match(/(?:potasio|\bK\+?\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mEq\/[lL]|mmol\/[lL]))?)/i);
  const clM = clean.match(/(?:cloro|\bCl\-?\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mEq\/[lL]|mmol\/[lL]))?)/i);
  const caM = clean.match(/(?:calcio|\bCa\+?\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mg\/d[lL]|mmol\/[lL]))?)/i);
  const mgM = clean.match(/(?:magnesio|\bMg\+?\b)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mg\/d[lL]|mEq\/[lL]))?)/i);
  if (naM) elecParts.push(`Na ${naM[1].trim()}`);
  if (kM) elecParts.push(`K ${kM[1].trim()}`);
  if (clM) elecParts.push(`Cl ${clM[1].trim()}`);
  if (caM) elecParts.push(`Ca ${caM[1].trim()}`);
  if (mgM) elecParts.push(`Mg ${mgM[1].trim()}`);
  const electrolitos = elecParts.length > 0
    ? { presente: true, fechaHora: globalDT, valor: elecParts.join(", "), evidencia: elecParts.join(", ") }
    : emptyEntry();

  const monitoreoGastoUrinario = matchSimple(/gasto\s*urinario\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:ml\/kg\/h|cc\/kg\/h))?)/i, "", true);
  const lactatoSerico = matchSimple(/lactato(?:\s*s[eé]rico)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:mmol\/[lL]|mg\/d[lL]))?)/i, "mmol/L");
  const glucosa = matchSimple(/(?:glucosa|glicemia|glucometr[ií]a)\s*[:\-]?\s*(\d+(?:[.,]\d+)?(?:\s*mg\/d[lL])?)/i, "mg/dL");
  const aislM = clean.match(/aislamientos?\s*(?:previos?)?\s*[:\-]?\s*([^\n.;]{3,90})/i);
  const aislamientosPrevios = aislM
    ? { presente: true, fechaHora: globalDT, valor: aislM[1].trim(), evidencia: aislM[0].trim().slice(0, 90) }
    : emptyEntry();

  const pao2M = clean.match(/\bPaO2\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i);
  const fio2M = clean.match(/\bFiO2\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i);
  const pafiM = clean.match(/\bPaFiO2\b|\bPaO2\/FiO2\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i);
  const gasesPaFiO2 = pao2M || pafiM
    ? {
        presente: true,
        fechaHora: globalTime,
        pao2: pao2M ? pao2M[1].replace(",", ".") : "",
        fio2: fio2M ? fio2M[1].replace(",", ".") : "",
        resultado: pafiM && pafiM[1] ? pafiM[1].replace(",", ".") : "",
        evidencia: (pao2M?.[0] || pafiM?.[0] || "").trim(),
      }
    : { presente: false, fechaHora: "", pao2: "", fio2: "", resultado: "", evidencia: "" };

  const spo2M = clean.match(/\b(?:SpO2|SatO2)\b\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/i);
  const spFiO2 = spo2M && fio2M
    ? {
        presente: true,
        fechaHora: globalTime,
        spo2: spo2M[1].replace(",", "."),
        fio2: fio2M[1].replace(",", "."),
        resultado: "",
        evidencia: `${spo2M[0]} ${fio2M[0]}`,
      }
    : { presente: false, fechaHora: "", spo2: "", fio2: "", resultado: "", evidencia: "" };

  const hemoCulM = clean.match(/hemocultivos?\s*[:\-]?\s*([^\n]{3,120})/i);
  const hemocultivosA3 = hemoCulM
    ? { presente: true, fechaHora: globalTime, detalle: hemoCulM[1].trim(), evidencia: hemoCulM[0].trim().slice(0, 120) }
    : { presente: false, fechaHora: "", detalle: "", evidencia: "" };

  return {
    pacienteDocumento: {
      nombreDetectado: nombreM ? nombreM[1].trim() : "",
      identificacionDetectada: idM ? idM[1].trim() : "",
      fechaReporte: globalDT,
    },
    hemograma,
    tpInr,
    fibrinogeno,
    dimeroD,
    pcr,
    astAlt,
    bilirrubina,
    creatinina,
    electrolitos,
    monitoreoGastoUrinario,
    lactatoSerico,
    glucosa,
    aislamientosPrevios,
    gasesPaFiO2,
    spFiO2,
    hemocultivosA3,
  };
}

function extractVoiceFromTextStrict(rawText: string) {
  let rect = rawText.trim();
  const replacements: Array<[RegExp, string]> = [
    [/\bele\s*ele\s*a\b/gi, "Leucemia LLA"],
    [/\bele\s*eme\s*a\b/gi, "Leucemia LMA"],
    [/\bmeropen[eé]n\b/gi, "Meropenem"],
    [/\bcefepima\b/gi, "Cefepime"],
    [/\bcefe\s*pime\b/gi, "Cefepime"],
    [/\bpiperacilina\s*tazobact[aá]n\b/gi, "Piperacilina/tazobactam"],
    [/\bvancomisina\b/gi, "Vancomicina"],
    [/\bglasgo[uw]?\b/gi, "Glasgow"],
  ];
  for (const [rx, rep] of replacements) {
    rect = rect.replace(rx, rep);
  }

  const lower = rect.toLowerCase();
  const getNum = (rx: RegExp) => {
    const m = rect.match(rx);
    return m && m[1] ? m[1].replace(",", ".") : "";
  };

  const out: Record<string, any> = {
    textoRectificado: rect,
    dxOncologico: /\bLLA\b/i.test(rect)
      ? "Leucemia Linfoblástica Aguda (LLA)"
      : /\bLMA\b/i.test(rect)
      ? "Leucemia Mieloide Aguda (LMA)"
      : "",
    temperatura: getNum(/(?:temperatura|temp|fiebre(?:\s+de)?)\s*(?:de|:)?\s*(\d{2}(?:[.,]\d)?)/i),
    fc: getNum(/(?:frecuencia\s*card[ií]aca|\bfc\b)\s*(?:de|:)?\s*(\d{2,3})/i),
    fr: getNum(/(?:frecuencia\s*respiratoria|\bfr\b)\s*(?:de|:)?\s*(\d{1,2})/i),
    pas: getNum(/(?:sist[oó]lica|\bpas\b)\s*(?:de|:)?\s*(\d{2,3})/i),
    pam: getNum(/(?:\bpam\b|arterial\s*media)\s*(?:de|:)?\s*(\d{2,3})/i),
    satO2: getNum(/(?:saturaci[oó]n|\bsat\s*o2\b|\bspo2\b)\s*(?:de|:)?\s*(\d{2,3})/i),
    fio2: getNum(/(?:\bfio2\b)\s*(?:de|:)?\s*(\d{1,3}(?:[.,]\d{1,2})?)/i),
    evatPuntaje: getNum(/(?:\bevat\b)\s*(?:de|:)?\s*(\d{1,2})/i),
    glasgowTotal: getNum(/(?:\bglasgow\b)\s*(?:de|:)?\s*(\d{1,2})/i),
    llenadoCapilar: lower.includes("llenado capilar prolongado")
      ? "prolongado"
      : lower.includes("llenado capilar normal")
      ? "normal"
      : lower.includes("llenado capilar flash") || lower.includes("llenado capilar rapido") || lower.includes("llenado capilar rápido")
      ? "rapido_flash"
      : "",
    anexoAntibioticoMeropenem: lower.includes("meropenem"),
    anexoAntibioticoCefepime: lower.includes("cefepime"),
    anexoAntibioticoPipTazo: lower.includes("piperacilina"),
    anexoAntibioticoVancomicina: lower.includes("vancomicina"),
    anexoOxigenoFio2100: lower.includes("fio2 100") || lower.includes("oxigeno al 100") || lower.includes("oxígeno al 100"),
    anexoBoloIv10: lower.includes("bolo"),
    anexoTipoLiquido: lower.includes("ringer")
      ? "lactato_ringer"
      : lower.includes("solucion salina") || lower.includes("solución salina") || lower.includes("ssn")
      ? "ssn_09"
      : "",
    anexoNotificarUci: lower.includes("uci") || lower.includes("cuidado intensivo"),
    notaClinica: rect.length >= 25 ? rect : "",
  };
  return out;
}

const PACIENTES_COLLECTION = "pacientes";
const ESTADOS_VALIDOS = [
  "en_triage",
  "pendiente_urgencias",
  "pendiente_detecto",
  "completado",
  "descartado",
];
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export interface PacienteRegistro {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  identificacionPaciente?: string;
  edadAnos?: string;
  edadMeses?: string;
  vitalesIngreso?: any;
  fechaCreacion: number;
  faseActual: 1 | 2 | 3 | 4;
  estado: "en_triage" | "pendiente_urgencias" | "pendiente_detecto" | "completado" | "descartado";
  fase1Completada: boolean;
  fase2Completada: boolean;
  fase3Completada: boolean;
  criteriosTamizaje?: boolean[];
  puntajeTamizaje?: number;
  categoriaTriage?: 1 | 2 | 3;
  categoriaTriageLabel?: string;
  diagnosticoTriage: string;
  autorTriage?: string;
  diagnosticoUrgencias: string;
  aplicaSepsis?: boolean;
  aprobadoUrgencias?: boolean;
  motivoDescarte?: string;
  autorUrgencias?: string;
  diagnosticoDetecto?: string;
  autorDetecto?: string;
  tiempoFase1Segundos: number;
  tiempoFase2Segundos: number;
  tiempoFase3Segundos: number;
  tiempoTotalSegundos: number;
  timestampInicio: number;
  timestampPasoFase2?: number;
  timestampPasoFase3?: number;
  timestampFinalizado?: number;
  formularioEquipoSepsis?: any;
  categoriaTriageValidada?: 1 | 2 | 3;
  categoriaTriageValidadaLabel?: string;
  motivoCambioCategoria?: string;
  reportadoADetecto?: boolean;
  habilitadoCierreAnticipado?: boolean;
  motivoCierreAnticipado?: string;
  estadosModulos?: {
    fase1Validada: boolean;
    checklist1Completado: boolean;
    laboratoriosCompletado: boolean;
    anexoCompletado: boolean;
    vasopresoresCompletado?: boolean;
    terapiasCompletado?: boolean;
  };
  tiemposSubmodulos?: {
    timestampValidacionTriage?: number;
    validacionTriageSegundos?: number;
    timestampChecklist1?: number;
    checklist1Segundos?: number;
    timestampLaboratorios?: number;
    laboratoriosSegundos?: number;
    laboratoriosCompletadoPor?: "fase2" | "fase3" | "laboratorios";
    timestampAnexo?: number;
    anexoSegundos?: number;
    anexoTipo?: string;
    timestampVasopresores?: number;
    vasopresoresSegundos?: number;
    timestampTerapias?: number;
    terapiasSegundos?: number;
  };
  laboratorios?: any;
  anexo2Data?: any;
  anexo3Data?: any;
  anexo4Data?: any;
  vasopresoresData?: any;
  enPapelera?: boolean;
  fechaEliminacion?: number;
}

function sanitizeForFirestore<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as Record<string, any>)) {
      if (v === undefined) continue;
      if (typeof v === "number" && Number.isNaN(v)) continue;
      out[k] = sanitizeForFirestore(v);
    }
    return out as T;
  }
  return input;
}

async function readCloudDB(): Promise<PacienteRegistro[]> {
  const q = query(
    collection(db, PACIENTES_COLLECTION),
    where("estado", "in", ESTADOS_VALIDOS)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => d.data() as PacienteRegistro);
  const now = Date.now();
  return docs
    .filter((p) => {
      if (p.enPapelera && p.fechaEliminacion) {
        return now - p.fechaEliminacion < TEN_DAYS_MS;
      }
      return true;
    })
    .sort((a, b) => (b.fechaCreacion || 0) - (a.fechaCreacion || 0));
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: "30mb" }));

  const uploadsGasesDir = path.join(__dirname, "uploads", "gases");
  fs.mkdirSync(uploadsGasesDir, { recursive: true });
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // API: Get active patients (from Cloud Firestore)
  app.get("/api/pacientes", async (_req: Request, res: Response) => {
    try {
      const list = await readCloudDB();
      res.json(list.filter((p) => !p.enPapelera));
    } catch (err) {
      console.error("Error reading Firestore /api/pacientes:", err);
      res.status(500).json({ error: "Error consultando base de datos en la nube" });
    }
  });

  // API: Get pending alerts count for MedUrg, Detecto, Laboratorios
  app.get("/api/alertas", async (_req: Request, res: Response) => {
    try {
      const list = await readCloudDB();
      const pendientesUrgencias = list.filter(
        (p) =>
          !p.enPapelera &&
          !p.fase3Completada &&
          p.estado !== "completado" &&
          p.estado !== "descartado"
      );
      const pendientesDetecto = list.filter(
        (p) =>
          !p.enPapelera &&
          !p.fase3Completada &&
          (p.estado === "pendiente_detecto" || p.reportadoADetecto)
      );
      const pendientesLaboratorios = list.filter(
        (p) =>
          !p.enPapelera &&
          !p.fase3Completada &&
          p.estado !== "completado" &&
          p.estado !== "descartado" &&
          p.estadosModulos?.fase1Validada === true &&
          !p.estadosModulos?.laboratoriosCompletado
      );
      const pendientesTerapias = list.filter(
        (p) =>
          !p.enPapelera &&
          !p.fase3Completada &&
          p.estado !== "completado" &&
          p.estado !== "descartado" &&
          (p.categoriaTriageValidada || p.categoriaTriage) === 3 &&
          !p.estadosModulos?.terapiasCompletado
      );

      res.json({
        urgencias: {
          cantidad: pendientesUrgencias.length,
          items: pendientesUrgencias.map((p) => ({
            id: p.id,
            nombre: p.nombre
              ? `${p.nombre} (ID: ${p.identificacionPaciente})`
              : p.identificacionPaciente
              ? `ID: ${p.identificacionPaciente}`
              : "Paciente",
            identificacionPaciente: p.identificacionPaciente || "",
            categoriaTriage: p.categoriaTriageValidada || p.categoriaTriage,
            categoriaTriageLabel:
              p.categoriaTriageValidadaLabel || p.categoriaTriageLabel,
            puntajeTamizaje: p.puntajeTamizaje,
            esperandoDesde: p.timestampPasoFase2 || p.timestampInicio,
            diagnosticoTriage: p.diagnosticoTriage,
          })),
        },
        detecto: {
          cantidad: pendientesDetecto.length,
          items: pendientesDetecto.map((p) => ({
            id: p.id,
            nombre: p.nombre
              ? `${p.nombre} (ID: ${p.identificacionPaciente})`
              : p.identificacionPaciente
              ? `ID: ${p.identificacionPaciente}`
              : "Paciente",
            identificacionPaciente: p.identificacionPaciente || "",
            categoriaTriage: p.categoriaTriageValidada || p.categoriaTriage,
            categoriaTriageLabel:
              p.categoriaTriageValidadaLabel || p.categoriaTriageLabel,
            puntajeTamizaje: p.puntajeTamizaje,
            esperandoDesde: p.timestampPasoFase3 || p.timestampInicio,
            diagnosticoUrgencias: p.diagnosticoUrgencias,
          })),
        },
        laboratorios: {
          cantidad: pendientesLaboratorios.length,
          items: pendientesLaboratorios.map((p) => ({
            id: p.id,
            nombre: p.nombre
              ? `${p.nombre} (ID: ${p.identificacionPaciente})`
              : p.identificacionPaciente
              ? `ID: ${p.identificacionPaciente}`
              : "Paciente",
            identificacionPaciente: p.identificacionPaciente || "",
            categoriaTriage: p.categoriaTriageValidada || p.categoriaTriage,
            categoriaTriageLabel:
              p.categoriaTriageValidadaLabel || p.categoriaTriageLabel,
            esperandoDesde:
              p.tiemposSubmodulos?.timestampValidacionTriage ||
              p.timestampPasoFase2 ||
              p.timestampInicio,
          })),
        },
        terapias: {
          cantidad: pendientesTerapias.length,
          items: pendientesTerapias.map((p) => ({
            id: p.id,
            nombre: p.nombre
              ? `${p.nombre} (ID: ${p.identificacionPaciente})`
              : p.identificacionPaciente
              ? `ID: ${p.identificacionPaciente}`
              : "Paciente",
            identificacionPaciente: p.identificacionPaciente || "",
            categoriaTriage: p.categoriaTriageValidada || p.categoriaTriage,
            categoriaTriageLabel:
              p.categoriaTriageValidadaLabel || p.categoriaTriageLabel,
            esperandoDesde:
              p.tiemposSubmodulos?.timestampValidacionTriage ||
              p.timestampPasoFase2 ||
              p.timestampInicio,
          })),
        },
      });
    } catch (err) {
      console.error("Error reading Firestore /api/alertas:", err);
      res.status(500).json({ error: "Error consultando alertas en la nube" });
    }
  });

  // API: Create new patient case in Cloud Firestore
  app.post("/api/pacientes", async (req: Request, res: Response) => {
    try {
      const now = Date.now();
      const id = `pac-${now}-${Math.random().toString(36).substring(2, 6)}`;
      const counterRef = doc(db, "counters", "pacientes_seq");
      const pacRef = doc(db, PACIENTES_COLLECTION, id);

      const nuevo = await runTransaction(db, async (tx) => {
        const counterSnap = await tx.get(counterRef);
        const nextSeq = counterSnap.exists()
          ? Number(counterSnap.data().lastSeq || 0) + 1
          : 1;
        const codigo = `HILA-2026-${nextSeq.toString().padStart(3, "0")}`;

        const record: PacienteRegistro = sanitizeForFirestore({
          id,
          codigo,
          identificacionPaciente:
            req.body.identificacionPaciente?.trim() || "Sin identificación",
          nombre: req.body.nombre?.trim() || "",
          apellido: req.body.apellido?.trim() || "",
          edadAnos: req.body.edadAnos?.trim() || "",
          edadMeses: req.body.edadMeses?.trim() || "",
          vitalesIngreso: req.body.vitalesIngreso || {},
          fechaCreacion: now,
          faseActual: req.body.faseActual || 1,
          estado: req.body.estado || "en_triage",
          fase1Completada: Boolean(req.body.fase1Completada),
          fase2Completada: Boolean(req.body.fase2Completada),
          fase3Completada: Boolean(req.body.fase3Completada),
          criteriosTamizaje: req.body.criteriosTamizaje || [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ],
          puntajeTamizaje: req.body.puntajeTamizaje ?? 0,
          categoriaTriage: req.body.categoriaTriage || 1,
          categoriaTriageLabel:
            req.body.categoriaTriageLabel || "BAJA POSIBILIDAD DE SEPSIS",
          diagnosticoTriage: req.body.diagnosticoTriage || "",
          autorTriage: req.body.autorTriage || "Triage",
          diagnosticoUrgencias: req.body.diagnosticoUrgencias || "",
          autorUrgencias: req.body.autorUrgencias || "",
          diagnosticoDetecto: req.body.diagnosticoDetecto || "",
          autorDetecto: req.body.autorDetecto || "",
          tiempoFase1Segundos: req.body.tiempoFase1Segundos || 0,
          tiempoFase2Segundos: req.body.tiempoFase2Segundos || 0,
          tiempoFase3Segundos: req.body.tiempoFase3Segundos || 0,
          tiempoTotalSegundos: req.body.tiempoTotalSegundos || 0,
          timestampInicio: req.body.timestampInicio || now,
          timestampPasoFase2: req.body.timestampPasoFase2,
          timestampPasoFase3: req.body.timestampPasoFase3,
          timestampFinalizado: req.body.timestampFinalizado,
          aplicaSepsis: req.body.aplicaSepsis,
          aprobadoUrgencias: req.body.aprobadoUrgencias,
          motivoDescarte: req.body.motivoDescarte,
          formularioEquipoSepsis: req.body.formularioEquipoSepsis,
          categoriaTriageValidada: req.body.categoriaTriageValidada,
          categoriaTriageValidadaLabel: req.body.categoriaTriageValidadaLabel,
          motivoCambioCategoria: req.body.motivoCambioCategoria,
          reportadoADetecto: Boolean(req.body.reportadoADetecto),
          habilitadoCierreAnticipado: Boolean(req.body.habilitadoCierreAnticipado),
          motivoCierreAnticipado: req.body.motivoCierreAnticipado,
          estadosModulos: req.body.estadosModulos || {
            fase1Validada: false,
            checklist1Completado: false,
            laboratoriosCompletado: false,
            anexoCompletado: false,
            vasopresoresCompletado: false,
            terapiasCompletado: false,
          },
          tiemposSubmodulos: req.body.tiemposSubmodulos || {},
          laboratorios: req.body.laboratorios || {},
          anexo2Data: req.body.anexo2Data || {},
          anexo3Data: req.body.anexo3Data || {},
          anexo4Data: req.body.anexo4Data || {},
          vasopresoresData: req.body.vasopresoresData || {},
        });

        tx.set(counterRef, { lastSeq: nextSeq });
        tx.set(pacRef, record);
        return record;
      });

      res.status(201).json(nuevo);
    } catch (err) {
      console.error("Error creating Firestore patient:", err);
      res.status(500).json({ error: "Error guardando paciente en la nube" });
    }
  });

  // API: Update patient case in Cloud Firestore
  app.put("/api/pacientes/:id", async (req: Request, res: Response) => {
    try {
      const pacRef = doc(db, PACIENTES_COLLECTION, req.params.id);
      const updated = await runTransaction(db, async (tx) => {
        const snap = await tx.get(pacRef);
        if (!snap.exists()) return null;
        const current = snap.data() as PacienteRegistro;
        const mergedEstados = req.body.estadosModulos
          ? {
              fase1Validada: Boolean(current.estadosModulos?.fase1Validada),
              checklist1Completado: Boolean(current.estadosModulos?.checklist1Completado),
              laboratoriosCompletado: Boolean(current.estadosModulos?.laboratoriosCompletado),
              anexoCompletado: Boolean(current.estadosModulos?.anexoCompletado),
              vasopresoresCompletado: Boolean(current.estadosModulos?.vasopresoresCompletado),
              terapiasCompletado: Boolean(current.estadosModulos?.terapiasCompletado),
              ...req.body.estadosModulos,
            }
          : current.estadosModulos;

        const mergedTiemposSub = req.body.tiemposSubmodulos
          ? {
              ...(current.tiemposSubmodulos || {}),
              ...req.body.tiemposSubmodulos,
            }
          : current.tiemposSubmodulos;

        const cleanBody = sanitizeForFirestore({ ...req.body });
        delete (cleanBody as any).diasRestantes;

        const merged: PacienteRegistro = sanitizeForFirestore({
          ...current,
          ...cleanBody,
          estadosModulos: mergedEstados,
          tiemposSubmodulos: mergedTiemposSub,
          id: current.id,
          codigo: current.codigo,
          fechaCreacion: current.fechaCreacion,
        });
        tx.set(pacRef, merged);
        return merged;
      });

      if (!updated) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }
      res.json(updated);
    } catch (err) {
      console.error("Error updating Firestore patient:", err);
      res.status(500).json({ error: "Error actualizando paciente en la nube" });
    }
  });

  // API: Move to trash
  app.delete("/api/pacientes/:id", async (req: Request, res: Response) => {
    try {
      const pacRef = doc(db, PACIENTES_COLLECTION, req.params.id);
      const ok = await runTransaction(db, async (tx) => {
        const snap = await tx.get(pacRef);
        if (!snap.exists()) return false;
        const current = snap.data() as PacienteRegistro;
        tx.set(
          pacRef,
          sanitizeForFirestore({
            ...current,
            enPapelera: true,
            fechaEliminacion: Date.now(),
          })
        );
        return true;
      });
      if (!ok) return res.status(404).json({ error: "Paciente no encontrado" });
      res.json({ success: true, message: "Movido a papelera (se eliminará permanentemente en 10 días)" });
    } catch (err) {
      console.error("Error moving patient to trash:", err);
      res.status(500).json({ error: "Error al mover a papelera" });
    }
  });

  // API: Trash list
  app.get("/api/papelera", async (_req: Request, res: Response) => {
    try {
      const list = await readCloudDB();
      const now = Date.now();
      const papelera = list
        .filter((p) => p.enPapelera)
        .map((p) => {
          const transcurrido = now - (p.fechaEliminacion || now);
          const diasRestantes = Math.max(
            0,
            Math.ceil((TEN_DAYS_MS - transcurrido) / (24 * 3600 * 1000))
          );
          return { ...p, diasRestantes };
        });
      res.json(papelera);
    } catch (err) {
      console.error("Error reading trash:", err);
      res.status(500).json({ error: "Error consultando papelera" });
    }
  });

  // API: Restore from trash
  app.post("/api/papelera/restaurar/:id", async (req: Request, res: Response) => {
    try {
      const pacRef = doc(db, PACIENTES_COLLECTION, req.params.id);
      const ok = await runTransaction(db, async (tx) => {
        const snap = await tx.get(pacRef);
        if (!snap.exists()) return false;
        const data = { ...(snap.data() as PacienteRegistro) };
        data.enPapelera = false;
        delete data.fechaEliminacion;
        tx.set(pacRef, sanitizeForFirestore(data));
        return true;
      });
      if (!ok) return res.status(404).json({ error: "No encontrado" });
      res.json({ success: true, message: "Paciente restaurado exitosamente" });
    } catch (err) {
      console.error("Error restoring patient:", err);
      res.status(500).json({ error: "Error restaurando paciente" });
    }
  });

  // API: Permanent purge
  app.delete("/api/papelera/purgar/:id", async (req: Request, res: Response) => {
    try {
      await deleteDoc(doc(db, PACIENTES_COLLECTION, req.params.id));
      res.json({ success: true, message: "Registro eliminado definitivamente" });
    } catch (err) {
      console.error("Error purging patient:", err);
      res.status(500).json({ error: "Error eliminando definitivamente" });
    }
  });

  // API: Interpret uploaded Lab PDF/image accurately via server-side Gemini API
  app.post("/api/laboratorios/interpretar-pdf", async (req: Request, res: Response) => {
    try {
      const { fileBase64, mimeType, fileName, imagesBase64, extractedText } = req.body || {};

      const hasImagesArray = Array.isArray(imagesBase64) && imagesBase64.length > 0;
      const hasExtractedText = typeof extractedText === "string" && extractedText.trim().length > 0;

      if (!fileBase64 && !hasImagesArray && !hasExtractedText) {
        return res.status(400).json({ error: "No se recibió el archivo para analizar." });
      }

      const allowedMimeTypes = new Set([
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ]);

      const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : String(mimeType || "application/pdf");
      if (fileBase64 && !allowedMimeTypes.has(normalizedMime)) {
        return res.status(400).json({
          error: "Formato no soportado. Suba un archivo PDF o una imagen (PNG, JPG, WEBP).",
        });
      }

      const ai = getGeminiClient();

      const entrySchema = {
        type: Type.OBJECT,
        properties: {
          presente: {
            type: Type.BOOLEAN,
            description:
              "true ÚNICAMENTE si el examen y su resultado aparecen explícitamente en el documento; false si no aparece.",
          },
          fechaHora: {
            type: Type.STRING,
            description:
              "Fecha y hora exacta de toma o validación en formato 'dd/mm hh:mm' (o 'hh:mm' si solo hay hora) solo si aparece impresa en el documento; de lo contrario ''.",
          },
          valor: {
            type: Type.STRING,
            description:
              "Valor(es) real(es) con unidades exactas tal como figuran en el documento; '' si no está en el documento.",
          },
          evidencia: {
            type: Type.STRING,
            description:
              "Cita literal breve del texto del reporte que respalda el dato extraído; '' si no está.",
          },
        },
        required: ["presente", "fechaHora", "valor", "evidencia"],
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          pacienteDocumento: {
            type: Type.OBJECT,
            properties: {
              nombreDetectado: { type: Type.STRING },
              identificacionDetectada: { type: Type.STRING },
              fechaReporte: { type: Type.STRING },
            },
            required: ["nombreDetectado", "identificacionDetectada", "fechaReporte"],
          },
          hemograma: entrySchema,
          tpInr: entrySchema,
          fibrinogeno: entrySchema,
          dimeroD: entrySchema,
          pcr: entrySchema,
          astAlt: entrySchema,
          bilirrubina: entrySchema,
          creatinina: entrySchema,
          electrolitos: entrySchema,
          monitoreoGastoUrinario: entrySchema,
          lactatoSerico: entrySchema,
          glucosa: entrySchema,
          aislamientosPrevios: entrySchema,
          gasesPaFiO2: {
            type: Type.OBJECT,
            properties: {
              presente: { type: Type.BOOLEAN },
              fechaHora: { type: Type.STRING },
              pao2: { type: Type.STRING, description: "Solo número de PaO2 en mmHg si aparece; sino ''." },
              fio2: { type: Type.STRING, description: "Solo número de FiO2 (0.21-1.0 o %) si aparece; sino ''." },
              resultado: { type: Type.STRING, description: "Valor PaFiO2 si aparece o si PaO2 y FiO2 están presentes; sino ''." },
              evidencia: { type: Type.STRING },
            },
            required: ["presente", "fechaHora", "pao2", "fio2", "resultado", "evidencia"],
          },
          spFiO2: {
            type: Type.OBJECT,
            properties: {
              presente: { type: Type.BOOLEAN },
              fechaHora: { type: Type.STRING },
              spo2: { type: Type.STRING, description: "Solo número de SpO2/SatO2 (%) si aparece; sino ''." },
              fio2: { type: Type.STRING, description: "Solo número de FiO2 si aparece; sino ''." },
              resultado: { type: Type.STRING },
              evidencia: { type: Type.STRING },
            },
            required: ["presente", "fechaHora", "spo2", "fio2", "resultado", "evidencia"],
          },
          hemocultivosA3: {
            type: Type.OBJECT,
            properties: {
              presente: { type: Type.BOOLEAN },
              fechaHora: { type: Type.STRING, description: "Hora hh:mm si aparece; sino ''." },
              detalle: {
                type: Type.STRING,
                description: "Microorganismo, sensibilidad o resultado literal de hemocultivo/cultivo si aparece; sino ''.",
              },
              evidencia: { type: Type.STRING },
            },
            required: ["presente", "fechaHora", "detalle", "evidencia"],
          },
        },
        required: [
          "pacienteDocumento",
          "hemograma",
          "tpInr",
          "fibrinogeno",
          "dimeroD",
          "pcr",
          "astAlt",
          "bilirrubina",
          "creatinina",
          "electrolitos",
          "monitoreoGastoUrinario",
          "lactatoSerico",
          "glucosa",
          "aislamientosPrevios",
          "gasesPaFiO2",
          "spFiO2",
          "hemocultivosA3",
        ],
      };

      const systemInstruction = `Eres un auditor clínico experto de laboratorio hospitalario en oncología pediátrica (Hospital Infantil Los Ángeles - DETECTO).
Tu tarea es leer el documento de laboratorio adjunto (${fileName || "documento.pdf"}) y extraer ÚNICAMENTE los resultados reales que estén explícitamente escritos en él.

REGLAS CRÍTICAS DE SEGURIDAD DEL PACIENTE (OBLIGATORIAS):
1. CERO INVENCIÓN: NUNCA inventes, estimes, deduzcas, completes ni asumas valores, unidades, fechas ni horas que no estén impresos en el documento.
2. CAMPOS AUSENTES VACÍOS: Si un examen o parámetro NO aparece en el documento adjunto, debes responder presente: false y cadenas vacías "" en todos sus subcampos. Jamás escribas "No reportado", "N/A", "Pendiente" ni guiones.
3. PRECISIÓN NUMÉRICA Y UNIDADES: Copia exactamente las cifras y unidades reales del documento (por ejemplo para Hemograma incluye lo que aparezca: "Hb 9.4 g/dL, Plaq 85.000/mm³, Neut 1.200/mm³, Linf 900/mm³"; para TP/INR: "TP 14.2 seg / INR 1.25"; para AST/ALT: "AST 48 U/L, ALT 52 U/L"; para Bilirrubina: "BT 1.4 mg/dL, BD 0.6 mg/dL"; para Electrolitos incluye solo los electrolitos presentes: "Na 138, K 4.1, Cl 102, Ca 8.9, Mg 2.0").
4. FECHA Y HORA: Usa la fecha/hora de toma, recepción o validación impresa en el reporte en formato "dd/mm hh:mm" (ej. "19/11 08:30") si aparecen día, mes y hora; para monitoreoGastoUrinario, gasesPaFiO2, spFiO2 y hemocultivosA3 usa formato "hh:mm" si aparece la hora. Si NO hay fecha/hora impresa en el documento, deja fechaHora como "".
5. GASES ARTERIALES / PaFiO2: Solo llena gasesPaFiO2 si el documento trae gases arteriales con PaO2, FiO2 o índice PaO2/FiO2 (PaFiO2). Deja pao2/fio2 solo con el valor numérico.
6. HEMOCULTIVOS / CULTIVOS: Si el documento corresponde a hemocultivo, urocultivo, cultivo de punta de catéter u otro cultivo microbiológico reciente (aislamiento), registra en hemocultivosA3 y/o aislamientosPrevios según corresponda al texto literal del reporte.`;

      const contentParts: any[] = [];
      if (hasImagesArray) {
        for (const imgB64 of imagesBase64.slice(0, 8)) {
          if (typeof imgB64 === "string" && imgB64.length > 0) {
            contentParts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: imgB64,
              },
            });
          }
        }
      } else if (fileBase64 && typeof fileBase64 === "string") {
        contentParts.push({
          inlineData: {
            mimeType: normalizedMime,
            data: fileBase64,
          },
        });
      }

      if (hasExtractedText) {
        contentParts.push({
          text: `Texto extraído del documento PDF (${fileName || "laboratorio.pdf"}):\n---\n${String(extractedText).slice(0, 40000)}\n---`,
        });
      }

      contentParts.push({
        text: "Analiza este documento de resultados de laboratorio clínico y extrae con máxima precisión los parámetros presentes para el formulario de Evaluación DOM y Paraclínicos, dejando estrictamente vacíos (presente: false, valor: '') todos los campos que no estén en este archivo.",
      });

      let parsed: any;
      try {
        const aiResponse = await generateWithFallback(
          ai,
          "gemini-4-hydrogen",
          "gemini-3.1-flash-lite",
          (model, isFallback) => ({
            model,
            contents: { parts: contentParts },
            config: {
              ...(isFallback ? {} : { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }),
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
            },
          })
        );

        let rawText = (aiResponse.text || "").trim();
        if (!rawText) {
          throw new Error("El servicio de interpretación devolvió una respuesta vacía.");
        }

        if (rawText.startsWith("```")) {
          rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
        }
        parsed = JSON.parse(rawText);
      } catch (geminiErr: any) {
        if (hasExtractedText && isTransientGeminiError(geminiErr)) {
          parsed = extractLabsFromTextStrict(String(extractedText));
        } else {
          throw geminiErr;
        }
      }

      const isBlank = (v: unknown): boolean => {
        if (typeof v !== "string") return true;
        const s = v.trim().toLowerCase();
        if (!s) return true;
        return [
          "n/a",
          "na",
          "no reportado",
          "no aplica",
          "no disponible",
          "no consta",
          "no encontrado",
          "sin dato",
          "sin datos",
          "null",
          "undefined",
          "-",
          "--",
          "---",
        ].includes(s);
      };

      const cleanDateTime = (s: unknown, onlyTime = false): string => {
        if (isBlank(s)) return "";
        const txt = String(s).trim();
        if (onlyTime) {
          const mTime = txt.match(/(\d{1,2}):(\d{2})/);
          if (mTime) return `${mTime[1].padStart(2, "0")}:${mTime[2]}`;
          return "";
        }
        const mFull = txt.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-]\d{2,4})?\s+(\d{1,2}):(\d{2})/);
        if (mFull) {
          return `${mFull[1].padStart(2, "0")}/${mFull[2].padStart(2, "0")} ${mFull[3].padStart(2, "0")}:${mFull[4]}`;
        }
        return txt.slice(0, 20);
      };

      const paraclinicosKeys: Array<{ key: string; label: string; onlyTime?: boolean }> = [
        { key: "hemograma", label: "Hemograma (Hb, Plaquetas, Neutrófilos, Linfocitos)" },
        { key: "tpInr", label: "TP / INR" },
        { key: "fibrinogeno", label: "Fibrinógeno" },
        { key: "dimeroD", label: "Dímero D" },
        { key: "pcr", label: "Proteína C Reactiva (PCR)" },
        { key: "astAlt", label: "AST / ALT" },
        { key: "bilirrubina", label: "Bilirrubina Total / Directa" },
        { key: "creatinina", label: "Creatinina" },
        { key: "electrolitos", label: "Electrolitos (Na, K, Cl, Ca, Mg)" },
        { key: "monitoreoGastoUrinario", label: "Monitoreo de Gasto Urinario", onlyTime: true },
        { key: "lactatoSerico", label: "Lactato Sérico" },
        { key: "glucosa", label: "Glucosa / Glucometría" },
        { key: "aislamientosPrevios", label: "Aislamientos Previos" },
      ];

      const extracted: Record<string, any> = {};
      const camposEncontrados: Array<{
        campo: string;
        valor: string;
        fechaHora: string;
        evidencia: string;
      }> = [];
      const camposVacios: string[] = [];

      for (const item of paraclinicosKeys) {
        const node = parsed[item.key];
        const valor = !isBlank(node?.valor) ? String(node.valor).trim() : "";
        if (node?.presente === true && valor) {
          const fechaHora = cleanDateTime(node?.fechaHora, item.onlyTime);
          extracted[item.key] = {
            checked: true,
            fechaHora,
            valor,
          };
          camposEncontrados.push({
            campo: item.label,
            valor,
            fechaHora,
            evidencia: !isBlank(node?.evidencia) ? String(node.evidencia).trim() : valor,
          });
        } else {
          extracted[item.key] = {
            checked: false,
            fechaHora: "",
            valor: "",
          };
          camposVacios.push(item.label);
        }
      }

      // Gases Arteriales / PaFiO2
      const gNode = parsed.gasesPaFiO2;
      const pao2 = !isBlank(gNode?.pao2) ? String(gNode.pao2).replace(/[^\d.,]/g, "").replace(",", ".") : "";
      const fio2Gas = !isBlank(gNode?.fio2) ? String(gNode.fio2).replace(/[^\d.,]/g, "").replace(",", ".") : "";
      let resPaFi = !isBlank(gNode?.resultado) ? String(gNode.resultado).trim() : "";
      if (!resPaFi && pao2 && fio2Gas) {
        const pVal = parseFloat(pao2);
        let fVal = parseFloat(fio2Gas);
        if (!isNaN(pVal) && !isNaN(fVal) && fVal > 0) {
          if (fVal > 1) fVal = fVal / 100;
          resPaFi = (pVal / fVal).toFixed(1);
        }
      }
      if (gNode?.presente === true && (pao2 || fio2Gas || resPaFi)) {
        const fh = cleanDateTime(gNode?.fechaHora, true);
        extracted.gasesPaFiO2 = {
          checked: true,
          fechaHora: fh,
          pao2,
          fio2: fio2Gas,
          resultado: resPaFi,
        };
        camposEncontrados.push({
          campo: "Gases Arteriales (PaFiO₂)",
          valor: `PaO₂: ${pao2 || "—"} | FiO₂: ${fio2Gas || "—"} | PaFiO₂: ${resPaFi || "—"}`,
          fechaHora: fh,
          evidencia: !isBlank(gNode?.evidencia) ? String(gNode.evidencia).trim() : "",
        });
      } else {
        extracted.gasesPaFiO2 = { checked: false, fechaHora: "", pao2: "", fio2: "", resultado: "" };
        camposVacios.push("Gases Arteriales (PaFiO₂)");
      }

      // Oximetría / SpFiO2
      const spNode = parsed.spFiO2;
      const spo2 = !isBlank(spNode?.spo2) ? String(spNode.spo2).replace(/[^\d.,]/g, "").replace(",", ".") : "";
      const fio2Sp = !isBlank(spNode?.fio2) ? String(spNode.fio2).replace(/[^\d.,]/g, "").replace(",", ".") : "";
      let resSpFi = !isBlank(spNode?.resultado) ? String(spNode.resultado).trim() : "";
      if (!resSpFi && spo2 && fio2Sp) {
        const sVal = parseFloat(spo2);
        let fVal = parseFloat(fio2Sp);
        if (!isNaN(sVal) && !isNaN(fVal) && fVal > 0) {
          if (fVal > 1) fVal = fVal / 100;
          resSpFi = (sVal / fVal).toFixed(1);
        }
      }
      if (spNode?.presente === true && (spo2 || fio2Sp || resSpFi)) {
        const fh = cleanDateTime(spNode?.fechaHora, true);
        extracted.spFiO2 = {
          checked: true,
          fechaHora: fh,
          spo2,
          fio2: fio2Sp,
          resultado: resSpFi,
        };
        camposEncontrados.push({
          campo: "Oximetría (SpFiO₂ / SaFiO₂)",
          valor: `SpO₂: ${spo2 || "—"} | FiO₂: ${fio2Sp || "—"} | SpFiO₂: ${resSpFi || "—"}`,
          fechaHora: fh,
          evidencia: !isBlank(spNode?.evidencia) ? String(spNode.evidencia).trim() : "",
        });
      } else {
        extracted.spFiO2 = { checked: false, fechaHora: "", spo2: "", fio2: "", resultado: "" };
        camposVacios.push("Oximetría (SpFiO₂ / SaFiO₂)");
      }

      // Hemocultivos A3
      const hemoNode = parsed.hemocultivosA3;
      const hemoDetalle = !isBlank(hemoNode?.detalle) ? String(hemoNode.detalle).trim() : "";
      if (hemoNode?.presente === true && hemoDetalle) {
        const fh = cleanDateTime(hemoNode?.fechaHora, true);
        extracted.hemocultivosA3 = {
          tomado: true,
          fechaHora: fh,
          detalle: hemoDetalle,
        };
        camposEncontrados.push({
          campo: "A3. Hemocultivos y Cultivos Microbiológicos",
          valor: hemoDetalle,
          fechaHora: fh,
          evidencia: !isBlank(hemoNode?.evidencia) ? String(hemoNode.evidencia).trim() : hemoDetalle,
        });
      } else {
        extracted.hemocultivosA3 = { tomado: false, fechaHora: "", detalle: "" };
        camposVacios.push("A3. Hemocultivos y Cultivos Microbiológicos");
      }

      res.json({
        extracted,
        auditoria: {
          pacienteDocumento: {
            nombreDetectado: !isBlank(parsed.pacienteDocumento?.nombreDetectado)
              ? String(parsed.pacienteDocumento.nombreDetectado).trim()
              : "",
            identificacionDetectada: !isBlank(parsed.pacienteDocumento?.identificacionDetectada)
              ? String(parsed.pacienteDocumento.identificacionDetectada).trim()
              : "",
            fechaReporte: !isBlank(parsed.pacienteDocumento?.fechaReporte)
              ? String(parsed.pacienteDocumento.fechaReporte).trim()
              : "",
          },
          camposEncontrados,
          camposVacios,
        },
      });
    } catch (err: any) {
      console.error("Error interpretando PDF de laboratorios:", err);
      const status = typeof err?.status === "number" ? err.status : 500;
      const msg = formatFriendlyGeminiError(
        err,
        "No fue posible analizar el documento de laboratorio."
      );
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: msg });
    }
  });

  // API: Real-time Medical Voice Rectification & Auto-fill (Fase 2 & Fase 3)
  // Strictly auto-fills Checklist 1, Active Anexo (2/3/4), and Clinical Note.
  // NEVER touches Laboratorios, Vasopresores, or Módulo 1 (Validación Triage).
  app.post("/api/voz/interpretar-clinico", async (req: Request, res: Response) => {
    try {
      const {
        transcriptRaw,
        audioBase64,
        audioMimeType,
        categoriaValidada = 1,
        modoFase = "fase2",
      } = req.body || {};

      const ai = getGeminiClient();
      let textoCapturado = typeof transcriptRaw === "string" ? transcriptRaw.trim() : "";

      if (!textoCapturado && audioBase64 && typeof audioBase64 === "string") {
        const cleanMime = String(audioMimeType || "audio/webm").split(";")[0];
        const transcribeResp = await generateWithFallback(
          ai,
          "gemini-3.5-transcribe",
          "gemini-4-hydrogen",
          (model) => ({
            model,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: audioBase64,
                  },
                },
                {
                  text: "Transcribe con máxima precisión médica en español de Colombia lo que dice el médico sobre la evaluación de sepsis pediátrica oncológica. Corrige términos médicos mal pronunciados sin inventar hechos.",
                },
              ],
            },
          })
        );
        textoCapturado = (transcribeResp.text || "").trim();
      }

      if (!textoCapturado) {
        return res.json({
          textoRectificado: "",
          checklist1Patch: {},
          anexoPatch: {},
          notaClinica: "",
          camposAplicados: [],
        });
      }

      const voiceSchema = {
        type: Type.OBJECT,
        properties: {
          textoRectificado: {
            type: Type.STRING,
            description:
              "Transcripción limpia y médicamente rectificada en español clínico (por ejemplo corregir 'leucemia ele ele a' -> 'Leucemia LLA', 'meropenén' -> 'Meropenem', 'piperacilina tazobactan' -> 'Piperacilina/tazobactam').",
          },
          dxOncologico: { type: Type.STRING, description: "Diagnóstico oncológico si se menciona; sino ''." },
          faseQuimioterapia: { type: Type.STRING, description: "Fase de quimioterapia si se menciona; sino ''." },
          temperatura: { type: Type.STRING, description: "Temperatura en °C (solo número); sino ''." },
          fc: { type: Type.STRING, description: "Frecuencia cardíaca lpm (solo número); sino ''." },
          fr: { type: Type.STRING, description: "Frecuencia respiratoria rpm (solo número); sino ''." },
          pas: { type: Type.STRING, description: "Presión arterial sistólica mmHg (solo número); sino ''." },
          pam: { type: Type.STRING, description: "Presión arterial media mmHg (solo número); sino ''." },
          satO2: { type: Type.STRING, description: "Saturación O2 % (solo número); sino ''." },
          fio2: { type: Type.STRING, description: "FiO2 % o decimal; sino ''." },
          evatAvalado: { type: Type.STRING, description: "'si', 'no', o ''" },
          evatPuntaje: { type: Type.STRING, description: "Puntaje EVAT si se menciona; sino ''." },
          glasgowTotal: { type: Type.STRING, description: "Puntaje total de Glasgow (solo número 3-15); sino ''." },
          glasgowO: { type: Type.STRING, description: "Glasgow ocular (1-4); sino ''." },
          glasgowV: { type: Type.STRING, description: "Glasgow verbal (1-5); sino ''." },
          glasgowM: { type: Type.STRING, description: "Glasgow motor (1-6); sino ''." },
          llenadoCapilar: {
            type: Type.STRING,
            description: "'normal' (<3s), 'prolongado' (>=3s), 'rapido_flash', o '' si no se menciona",
          },
          colorPiel: {
            type: Type.STRING,
            description: "'rosada', 'moteada', 'rubicundez', 'cianotico', o ''",
          },
          dificultadRespiratoria: { type: Type.STRING, description: "'si', 'no', o ''" },
          aleteoNasal: { type: Type.BOOLEAN },
          tirajesIntercostales: { type: Type.BOOLEAN },
          quejido: { type: Type.BOOLEAN },
          auscultacion: { type: Type.STRING, description: "'normal', 'anormal', o ''" },
          abdNormal: { type: Type.BOOLEAN },
          abdDistension: { type: Type.BOOLEAN },
          abdDolor: { type: Type.BOOLEAN },
          abdVisceromegalias: { type: Type.BOOLEAN },
          gastoUrinario: { type: Type.STRING, description: "'menor_igual_05', 'mayor_05', o ''" },
          extremidades: { type: Type.STRING, description: "'calientes', 'frias', o ''" },
          pulsos: { type: Type.STRING, description: "'normales', 'saltones', 'debiles', o ''" },
          pielNormal: { type: Type.BOOLEAN },
          palidez: { type: Type.BOOLEAN },
          ictericia: { type: Type.BOOLEAN },
          petequias: { type: Type.BOOLEAN },
          equimosis: { type: Type.BOOLEAN },
          livideces: { type: Type.BOOLEAN },
          mucositisGrado: { type: Type.STRING },
          cateterPeriferico: {
            type: Type.STRING,
            description: "'normal', 'cambios_inflamatorios', o ''",
          },
          cateterCentral: {
            type: Type.STRING,
            description: "'normal', 'cambios_inflamatorios', o ''",
          },
          focoInfecciosoPresente: { type: Type.STRING, description: "'si' si menciona foco infeccioso o sospecha de foco, 'no', o ''" },
          focoInfecciosoEspecificar: { type: Type.STRING, description: "Foco infeccioso mencionado (ej. pulmonar, urinario, piel, abdomen); sino ''." },
          medicoFirma: { type: Type.STRING },
          enfermeroFirma: { type: Type.STRING },
          // Anexo fields (depending on Cat 1/2/3)
          anexoAntibioticoMeropenem: { type: Type.BOOLEAN, description: "true si indica o inicia Meropenem." },
          anexoAntibioticoCefepime: { type: Type.BOOLEAN, description: "true si indica o inicia Cefepime." },
          anexoAntibioticoPipTazo: { type: Type.BOOLEAN, description: "true si indica o inicia Piperacilina/tazobactam." },
          anexoAntibioticoVancomicina: { type: Type.BOOLEAN, description: "true si indica o inicia Vancomicina." },
          anexoOxigenoFio2100: { type: Type.BOOLEAN, description: "true si indica oxígeno FiO2 100%." },
          anexoBoloIv10: { type: Type.BOOLEAN, description: "true si indica bolo de líquidos IV 10 ml/kg." },
          anexoTipoLiquido: { type: Type.STRING, description: "'lactato_ringer', 'ssn_09', o ''" },
          anexoCanalizarCateter: { type: Type.BOOLEAN },
          anexoIdentificarFoco: { type: Type.BOOLEAN },
          anexoClasificarRiesgoMamutts: { type: Type.BOOLEAN },
          anexoNotificarUci: { type: Type.BOOLEAN, description: "true si indica avisar/notificar o trasladar a UCI." },
          anexoUciAlteracionSensorio: { type: Type.BOOLEAN },
          anexoUciSobrecargaVolumen: { type: Type.BOOLEAN },
          anexoUciHipotensionArterial: { type: Type.BOOLEAN },
          anexoUciDisfuncionMiocardica: { type: Type.BOOLEAN },
          anexoUciSignosMalaPerfusion: { type: Type.BOOLEAN },
          anexoUciDificultadRespiratoria: { type: Type.BOOLEAN },
          notaClinica: {
            type: Type.STRING,
            description:
              "Resumen clínico breve y profesional rectificado para el campo Concepto / Nota Clínica si el médico dictó conducta o diagnóstico; '' si solo dictó un signo aislado.",
          },
        },
        required: ["textoRectificado", "notaClinica"],
      };

      const systemInstruction = `Eres un escribiente médico experto en oncología pediátrica y protocolo DETECTO de sepsis (Hospital Infantil Los Ángeles).
Tu función es escuchar la evaluación hablada en vivo del médico en ${modoFase === "fase3" ? "Fase 3 (Equipo DETECTO)" : "Fase 2 (Médico de Urgencias)"} (Clasificación actual: Categoría ${categoriaValidada}), RECTIFICAR términos médicos mal reconocidos por el dictado de voz (ej. fármacos como Cefepime, Meropenem, Piperacilina/tazobactam, Vancomicina; signos como petequias, equimosis, livideces, mucositis, llenado capilar, EVAT, Glasgow, lactato de Ringer), y extraer TODOS los signos vitales, examen físico (Glasgow, llenado capilar, foco infeccioso) y decisiones del Anexo ${categoriaValidada === 3 ? "2" : categoriaValidada === 2 ? "3" : "4"} (antibióticos, oxígeno, líquidos, criterios UCI) que hayan sido explícitamente mencionados en el audio/texto.

RESTRICCIONES ESTRICTAS (OBLIGATORIAS):
1. NO inventes ni asumas ningún dato clínico que no haya sido dicho en el audio/texto. Deja los campos no mencionados en false o "".
2. EXCLUSIONES PROHIBIDAS: NUNCA intentes llenar resultados de Laboratorio/Paraclínicos, NUNCA intentes llenar Vasopresores, y NUNCA cambies la validación de Triage (Módulo 1). Solo extrae campos de Checklist 1 (Evaluación Equipo de Sepsis), Anexo ${categoriaValidada === 3 ? "2" : categoriaValidada === 2 ? "3" : "4"} y Nota Clínica.`;

      let parsed: any;
      try {
        const aiResp = await generateWithFallback(
          ai,
          "gemini-4-hydrogen",
          "gemini-3.1-flash-lite",
          (model, isFallback) => ({
            model,
            contents: `Audio/Texto dictado por el médico: "${textoCapturado}"`,
            config: {
              ...(isFallback ? {} : { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }),
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: voiceSchema,
            },
          })
        );

        let rawJson = (aiResp.text || "").trim();
        if (rawJson.startsWith("```")) {
          rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
        }
        parsed = rawJson ? JSON.parse(rawJson) : {};
      } catch (voiceErr: any) {
        if (isTransientGeminiError(voiceErr)) {
          parsed = extractVoiceFromTextStrict(textoCapturado);
        } else {
          throw voiceErr;
        }
      }

      const checklist1Patch: Record<string, any> = {};
      const anexoPatch: Record<string, any> = {};
      const camposAplicados: string[] = [];

      const nonEmpty = (v: unknown) => (typeof v === "string" ? v.trim() : "");

      if (nonEmpty(parsed.dxOncologico)) {
        checklist1Patch.dxOncologico = nonEmpty(parsed.dxOncologico);
        camposAplicados.push("Dx Oncológico");
      }
      if (nonEmpty(parsed.faseQuimioterapia)) {
        checklist1Patch.faseQuimioterapia = nonEmpty(parsed.faseQuimioterapia);
        camposAplicados.push("Fase Quimioterapia");
      }

      const signos: Record<string, string> = {};
      for (const k of ["temperatura", "fc", "fr", "pas", "pam", "satO2", "fio2"] as const) {
        if (nonEmpty(parsed[k])) signos[k] = nonEmpty(parsed[k]);
      }
      if (Object.keys(signos).length > 0) {
        checklist1Patch.signosVitales = signos;
        camposAplicados.push("Signos Vitales");
      }

      if (parsed.evatAvalado === "si" || parsed.evatAvalado === "no" || nonEmpty(parsed.evatPuntaje)) {
        checklist1Patch.evat = {};
        if (parsed.evatAvalado === "si") checklist1Patch.evat.centroAvalado = true;
        if (parsed.evatAvalado === "no") checklist1Patch.evat.centroAvalado = false;
        if (nonEmpty(parsed.evatPuntaje)) checklist1Patch.evat.puntaje = nonEmpty(parsed.evatPuntaje);
        camposAplicados.push("EVAT");
      }

      const examen: Record<string, any> = {};
      for (const k of ["glasgowTotal", "glasgowO", "glasgowV", "glasgowM"] as const) {
        if (nonEmpty(parsed[k])) examen[k] = nonEmpty(parsed[k]);
      }
      if (["normal", "prolongado", "rapido_flash"].includes(parsed.llenadoCapilar)) {
        examen.llenadoCapilar = parsed.llenadoCapilar;
      }
      if (["rosada", "moteada", "rubicundez", "cianotico"].includes(parsed.colorPiel)) {
        examen.colorPiel = parsed.colorPiel;
      }
      if (parsed.dificultadRespiratoria === "si" || parsed.dificultadRespiratoria === "no") {
        examen.dificultadRespiratoria = parsed.dificultadRespiratoria;
      }
      if (parsed.aleteoNasal || parsed.tirajesIntercostales || parsed.quejido) {
        examen.signosDificultad = {};
        if (parsed.aleteoNasal) examen.signosDificultad.aleteoNasal = true;
        if (parsed.tirajesIntercostales) examen.signosDificultad.tirajesIntercostales = true;
        if (parsed.quejido) examen.signosDificultad.quejido = true;
      }
      if (parsed.auscultacion === "normal" || parsed.auscultacion === "anormal") {
        examen.auscultacion = parsed.auscultacion;
      }
      if (parsed.abdNormal || parsed.abdDistension || parsed.abdDolor || parsed.abdVisceromegalias) {
        examen.abdominal = {};
        if (parsed.abdNormal) examen.abdominal.normal = true;
        if (parsed.abdDistension) examen.abdominal.distension = true;
        if (parsed.abdDolor) examen.abdominal.dolor = true;
        if (parsed.abdVisceromegalias) examen.abdominal.visceromegalias = true;
      }
      if (parsed.gastoUrinario === "menor_igual_05" || parsed.gastoUrinario === "mayor_05") {
        examen.gastoUrinario = parsed.gastoUrinario;
      }
      if (parsed.extremidades === "calientes" || parsed.extremidades === "frias") {
        examen.extremidades = parsed.extremidades;
      }
      if (["normales", "saltones", "debiles"].includes(parsed.pulsos)) {
        examen.pulsos = parsed.pulsos;
      }
      if (
        parsed.pielNormal ||
        parsed.palidez ||
        parsed.ictericia ||
        parsed.petequias ||
        parsed.equimosis ||
        parsed.livideces ||
        nonEmpty(parsed.mucositisGrado)
      ) {
        examen.pielMucosas = {};
        if (parsed.pielNormal) examen.pielMucosas.normal = true;
        if (parsed.palidez) examen.pielMucosas.palidez = true;
        if (parsed.ictericia) examen.pielMucosas.ictericia = true;
        if (parsed.petequias) examen.pielMucosas.petequias = true;
        if (parsed.equimosis) examen.pielMucosas.equimosis = true;
        if (parsed.livideces) examen.pielMucosas.livideces = true;
        if (nonEmpty(parsed.mucositisGrado)) examen.pielMucosas.mucositisGrado = nonEmpty(parsed.mucositisGrado);
      }
      if (
        parsed.cateterPeriferico === "normal" ||
        parsed.cateterPeriferico === "cambios_inflamatorios" ||
        parsed.cateterCentral === "normal" ||
        parsed.cateterCentral === "cambios_inflamatorios"
      ) {
        examen.cateteres = {};
        if (parsed.cateterPeriferico === "normal" || parsed.cateterPeriferico === "cambios_inflamatorios") {
          examen.cateteres.periferico = parsed.cateterPeriferico;
        }
        if (parsed.cateterCentral === "normal" || parsed.cateterCentral === "cambios_inflamatorios") {
          examen.cateteres.central = parsed.cateterCentral;
        }
      }
      if (
        parsed.focoInfecciosoPresente === "si" ||
        parsed.focoInfecciosoPresente === "no" ||
        nonEmpty(parsed.focoInfecciosoEspecificar)
      ) {
        examen.focoInfeccioso = {};
        if (parsed.focoInfecciosoPresente === "si") examen.focoInfeccioso.presente = true;
        if (parsed.focoInfecciosoPresente === "no") examen.focoInfeccioso.presente = false;
        if (nonEmpty(parsed.focoInfecciosoEspecificar)) {
          examen.focoInfeccioso.presente = true;
          examen.focoInfeccioso.especificar = nonEmpty(parsed.focoInfecciosoEspecificar);
        }
      }
      if (Object.keys(examen).length > 0) {
        checklist1Patch.examenFisico = examen;
        camposAplicados.push("Examen Físico (Checklist 1)");
      }

      if (nonEmpty(parsed.medicoFirma)) checklist1Patch.medicoFirma = nonEmpty(parsed.medicoFirma);
      if (nonEmpty(parsed.enfermeroFirma)) checklist1Patch.enfermeroFirma = nonEmpty(parsed.enfermeroFirma);

      // Map Anexo fields depending on active category
      if (categoriaValidada === 3) {
        const uci: Record<string, boolean> = {};
        if (parsed.anexoUciAlteracionSensorio) uci.alteracionSensorio = true;
        if (parsed.anexoUciSobrecargaVolumen) uci.sobrecargaVolumen = true;
        if (parsed.anexoUciHipotensionArterial) uci.hipotensionArterial = true;
        if (parsed.anexoUciDisfuncionMiocardica) uci.disfuncionMiocardica = true;
        if (parsed.anexoUciSignosMalaPerfusion) uci.signosMalaPerfusion = true;
        if (parsed.anexoUciDificultadRespiratoria) uci.dificultadRespiratoria = true;
        if (Object.keys(uci).length > 0) {
          anexoPatch.criteriosUci = uci;
          camposAplicados.push("Criterios UCI (Anexo 2)");
        }

        const ordenes: Record<string, any> = {};
        if (parsed.anexoOxigenoFio2100) ordenes.oxigenoFio2100 = true;
        if (parsed.anexoBoloIv10) ordenes.boloIv10 = true;
        if (parsed.anexoTipoLiquido === "lactato_ringer" || parsed.anexoTipoLiquido === "ssn_09") {
          ordenes.tipoLiquido = parsed.anexoTipoLiquido;
        }
        if (parsed.anexoCanalizarCateter) ordenes.canalizarCateter = true;
        if (Object.keys(ordenes).length > 0) {
          anexoPatch.ordenesInmediatas = ordenes;
          camposAplicados.push("Órdenes Inmediatas (Anexo 2)");
        }

        const atb: Record<string, boolean> = {};
        if (parsed.anexoAntibioticoMeropenem) atb.meropenem = true;
        if (parsed.anexoAntibioticoCefepime) atb.cefepime = true;
        if (parsed.anexoAntibioticoPipTazo) atb.pipTazo = true;
        if (parsed.anexoAntibioticoVancomicina) atb.vancomicina = true;
        if (Object.keys(atb).length > 0) {
          anexoPatch.antibiotico = atb;
          camposAplicados.push("Antibiótico (Anexo 2)");
        }

        if (parsed.anexoNotificarUci) {
          anexoPatch.monitoreo = { notificarUci: true };
          camposAplicados.push("Notificar UCI (Anexo 2)");
        }
      } else {
        // Anexo 3 or Anexo 4
        if (categoriaValidada === 2) {
          const ord: Record<string, boolean> = {};
          if (parsed.anexoIdentificarFoco) ord.identificarFoco = true;
          if (parsed.anexoClasificarRiesgoMamutts) ord.clasificarRiesgoMamutts = true;
          if (Object.keys(ord).length > 0) {
            anexoPatch.ordenesInmediatas = ord;
            camposAplicados.push("Órdenes Inmediatas (Anexo 3)");
          }
        }
        const atb: Record<string, any> = {};
        if (parsed.anexoAntibioticoCefepime) atb.escenarioA_cefepime = true;
        if (parsed.anexoAntibioticoPipTazo) atb.escenarioB_piptazo = true;
        if (parsed.anexoAntibioticoVancomicina) {
          atb.vancomicinaIndicaciones = { sospechaCocos: true };
        }
        if (Object.keys(atb).length > 0) {
          anexoPatch.antibiotico = atb;
          camposAplicados.push(`Antibiótico (Anexo ${categoriaValidada === 2 ? "3" : "4"})`);
        }
      }

      const notaClinica = nonEmpty(parsed.notaClinica);
      if (notaClinica) {
        camposAplicados.push("Nota Clínica");
      }

      res.json({
        textoRectificado: nonEmpty(parsed.textoRectificado) || textoCapturado,
        checklist1Patch,
        anexoPatch,
        notaClinica,
        camposAplicados,
      });
    } catch (err: any) {
      console.error("Error interpretando voz clínica con IA:", err);
      const status = typeof err?.status === "number" ? err.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: formatFriendlyGeminiError(
          err,
          "Error al rectificar y aplicar dictado médico."
        ),
      });
    }
  });

  // API: Guardar foto de tira de gases (venosa / arterial) en disco del servidor
  app.post("/api/terapias/guardar-foto", async (req: Request, res: Response) => {
    try {
      const { pacienteId, tipo, imageBase64, mimeType, fileName } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "No se recibió la imagen para guardar." });
      }

      const safeTipo = tipo === "venosa" ? "venosa" : "arterial";
      const safePacienteId = String(pacienteId || "pac")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 48) || "pac";

      const normalizedMime = String(mimeType || "image/jpeg").toLowerCase();
      let ext = "jpg";
      if (normalizedMime.includes("png")) ext = "png";
      else if (normalizedMime.includes("webp")) ext = "webp";
      else if (normalizedMime.includes("pdf")) ext = "pdf";

      const cleanB64 = imageBase64.includes(",")
        ? imageBase64.slice(imageBase64.indexOf(",") + 1)
        : imageBase64;
      const buffer = Buffer.from(cleanB64, "base64");

      if (buffer.length === 0) {
        return res.status(400).json({ error: "El archivo de imagen está vacío." });
      }
      if (buffer.length > 15 * 1024 * 1024) {
        return res.status(400).json({ error: "La imagen excede el límite de 15 MB." });
      }

      const uniqueName = `${safePacienteId}_${safeTipo}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}.${ext}`;
      const destPath = path.join(uploadsGasesDir, uniqueName);
      fs.writeFileSync(destPath, buffer);

      res.status(201).json({
        url: `/uploads/gases/${uniqueName}`,
        fileName: String(fileName || uniqueName).slice(0, 120),
        tipo: safeTipo,
      });
    } catch (err: any) {
      console.error("Error guardando foto de gases en servidor:", err);
      res.status(500).json({ error: "No se pudo guardar la foto en el servidor." });
    }
  });

  // API: Interpretar tirilla Radiometer ABL90 SERIES / Gases (Muestra Venosa -> cLac | Arterial -> PaFiO2 y SpFiO2)
  app.post("/api/terapias/interpretar-gases", async (req: Request, res: Response) => {
    try {
      const {
        fileBase64,
        imagesBase64,
        extractedText,
        mimeType,
        fileName,
        tipoMuestraEsperado = "auto",
      } = req.body || {};

      const hasImagesArray = Array.isArray(imagesBase64) && imagesBase64.length > 0;
      const hasExtractedText =
        typeof extractedText === "string" && extractedText.trim().length > 0;

      if (!fileBase64 && !hasImagesArray && !hasExtractedText) {
        return res
          .status(400)
          .json({ error: "No se recibió imagen o archivo de gases para interpretar." });
      }

      const normalizedMime =
        mimeType === "image/jpg" ? "image/jpeg" : String(mimeType || "image/jpeg");

      const ai = getGeminiClient();

      const gasesSchema = {
        type: Type.OBJECT,
        properties: {
          tipoMuestraDetectado: {
            type: Type.STRING,
            description: "'venosa', 'arterial', o 'desconocido' según el campo Tipo muestra del reporte.",
          },
          fechaHora: {
            type: Type.STRING,
            description: "Hora del análisis en formato 24h 'hh:mm' (ej. '07:58' o '10:19'); '' si no aparece.",
          },
          fechaCompleta: {
            type: Type.STRING,
            description: "Fecha y hora en 'dd/mm hh:mm' si aparece en el encabezado (ej. '25/11 10:19'); '' si no.",
          },
          cLac: {
            type: Type.STRING,
            description: "Valor numérico de cLac / Lactato en mmol/L (ej. '1.3'); '' si no aparece.",
          },
          pO2: {
            type: Type.STRING,
            description: "Valor numérico de pO2(T)c / PaO2 en mmHg (ej. '95.7'); '' si no aparece.",
          },
          sO2: {
            type: Type.STRING,
            description: "Valor numérico de sO2 / SatO2 en % (ej. '97.2'); '' si no aparece.",
          },
          fio2: {
            type: Type.STRING,
            description: "Valor numérico de FO2(I) / FiO2 en % o decimal (ej. '35.0' o '0.35'); '' si no aparece.",
          },
          pao2Fio2Equipo: {
            type: Type.STRING,
            description: "Valor pO2(a)/FO2(I)c si viene impreso en el reporte (ej. '259'); '' si no aparece.",
          },
          evidencia: {
            type: Type.STRING,
            description: "Resumen breve literal de los parámetros leídos del ticket.",
          },
        },
        required: [
          "tipoMuestraDetectado",
          "fechaHora",
          "fechaCompleta",
          "cLac",
          "pO2",
          "sO2",
          "fio2",
          "pao2Fio2Equipo",
          "evidencia",
        ],
      };

      const systemInstruction = `Eres un especialista clínico leyendo tirillas de analizador de gases sanguíneos (como RADIOMETER ABL90 SERIES) para Terapia Respiratoria pediátrica.
REGLAS ESTRICTAS:
1. CERO INVENCIÓN: Lee ÚNICAMENTE los números impresos en la imagen o documento (${fileName || "gases"}). Si un dato no es legible o no aparece, devuelve "".
2. TIPO DE MUESTRA: Identifica 'Tipo muestra' (Venosa o Arterial).
3. MUESTRAS EN VENA: Extrae con máxima precisión 'cLac' (mmol/L) y la hora del reporte.
4. MUESTRAS EN ARTERIA: Extrae con máxima precisión 'pO2(T)c' (mmHg), 'sO2' (%), 'FO2(I)' (% o fracción), 'pO2(a)/FO2(I)c' si aparece impreso, y la hora del reporte.
5. HORA 24H: Convierte '07:58 AM' -> '07:58', '02:15 PM' -> '14:15'. Para fechaCompleta usa 'dd/mm hh:mm' si hay fecha.`;

      const contentParts: any[] = [];
      if (hasImagesArray) {
        for (const imgB64 of imagesBase64.slice(0, 4)) {
          if (typeof imgB64 === "string" && imgB64.length > 0) {
            contentParts.push({
              inlineData: { mimeType: "image/jpeg", data: imgB64 },
            });
          }
        }
      } else if (fileBase64 && typeof fileBase64 === "string") {
        const cleanB64 = fileBase64.includes(",")
          ? fileBase64.slice(fileBase64.indexOf(",") + 1)
          : fileBase64;
        contentParts.push({
          inlineData: { mimeType: normalizedMime, data: cleanB64 },
        });
      }

      if (hasExtractedText) {
        contentParts.push({
          text: `Texto extraído del archivo (${fileName || "gases"}):\n${String(extractedText).slice(0, 15000)}`,
        });
      }

      contentParts.push({
        text: `Contexto de carga: ${
          tipoMuestraEsperado === "venosa"
            ? "Muestra Venosa (priorizar cLac / Lactato sérico y hora)."
            : tipoMuestraEsperado === "arterial"
            ? "Muestra Arterial (priorizar pO2(T)c, sO2 y FO2(I) para calcular PaFiO2 y SpFiO2)."
            : "Auto-detectar si es muestra Venosa o Arterial y extraer sus valores."
        }`,
      });

      const aiResp = await generateWithFallback(
        ai,
        "gemini-4-hydrogen",
        "gemini-3.1-flash-lite",
        (model, isFallback) => ({
          model,
          contents: { parts: contentParts },
          config: {
            ...(isFallback ? {} : { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }),
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: gasesSchema,
          },
        })
      );

      let rawJson = (aiResp.text || "").trim();
      if (rawJson.startsWith("```")) {
        rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
      }
      const parsed = rawJson ? JSON.parse(rawJson) : {};

      const cleanNum = (s: unknown) =>
        typeof s === "string" ? s.replace(/[^\d.,]/g, "").replace(",", ".") : "";

      const tipoRaw = String(parsed.tipoMuestraDetectado || "").toLowerCase();
      const tipoFinal: "venosa" | "arterial" =
        tipoMuestraEsperado === "venosa"
          ? "venosa"
          : tipoMuestraEsperado === "arterial"
          ? "arterial"
          : tipoRaw.includes("ven")
          ? "venosa"
          : "arterial";

      const hora = typeof parsed.fechaHora === "string" ? parsed.fechaHora.trim() : "";
      const fechaCompleta =
        typeof parsed.fechaCompleta === "string" ? parsed.fechaCompleta.trim() : hora;

      const cLac = cleanNum(parsed.cLac);
      const pO2 = cleanNum(parsed.pO2);
      const sO2 = cleanNum(parsed.sO2);
      const fio2 = cleanNum(parsed.fio2);

      let pafiCalculado = "";
      let safiCalculado = "";

      if (fio2) {
        let fNum = parseFloat(fio2);
        if (!Number.isNaN(fNum) && fNum > 0) {
          if (fNum > 1) fNum = fNum / 100;
          if (pO2) {
            const pNum = parseFloat(pO2);
            if (!Number.isNaN(pNum)) pafiCalculado = (pNum / fNum).toFixed(1);
          }
          if (sO2) {
            const sNum = parseFloat(sO2);
            if (!Number.isNaN(sNum)) safiCalculado = (sNum / fNum).toFixed(1);
          }
        }
      }

      res.json({
        tipoMuestraDetectado: tipoRaw || tipoFinal,
        tipoAplicado: tipoFinal,
        fechaHora: hora,
        fechaCompleta,
        cLac,
        pO2,
        sO2,
        fio2,
        pafiCalculado,
        safiCalculado,
        pao2Fio2Equipo: cleanNum(parsed.pao2Fio2Equipo),
        evidencia: typeof parsed.evidencia === "string" ? parsed.evidencia.trim() : "",
      });
    } catch (err: any) {
      console.error("Error interpretando muestra de gases:", err);
      const status = typeof err?.status === "number" ? err.status : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: formatFriendlyGeminiError(
          err,
          "No fue posible interpretar la tirilla de gases. Verifique que la foto sea nítida."
        ),
      });
    }
  });

  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Ruta API no encontrada." });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      const status = Number(err?.status || err?.statusCode || 500);
      const message =
        err?.type === "entity.too.large"
          ? "El archivo adjunto excede el límite de transferencia. Intente con un documento más liviano."
          : err?.message || "Error interno procesando la petición.";
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
    next(err);
  });

  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DETECTO Server running at http://0.0.0.0:${PORT} (Cloud Firestore connected)`);
  });
}

startServer();

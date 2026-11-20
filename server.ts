import express, { Request, Response } from "express";
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
  };
  laboratorios?: any;
  anexo2Data?: any;
  anexo3Data?: any;
  anexo4Data?: any;
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

  app.use(express.json({ limit: "25mb" }));

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
          },
          tiemposSubmodulos: req.body.tiemposSubmodulos || {},
          laboratorios: req.body.laboratorios || {},
          anexo2Data: req.body.anexo2Data || {},
          anexo3Data: req.body.anexo3Data || {},
          anexo4Data: req.body.anexo4Data || {},
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
      const { fileBase64, mimeType, fileName } = req.body || {};

      if (!fileBase64 || typeof fileBase64 !== "string") {
        return res.status(400).json({ error: "No se recibió el archivo para analizar." });
      }

      const allowedMimeTypes = new Set([
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ]);

      const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : String(mimeType || "");
      if (!allowedMimeTypes.has(normalizedMime)) {
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

      const filePart = {
        inlineData: {
          mimeType: normalizedMime,
          data: fileBase64,
        },
      };

      const promptPart = {
        text: "Analiza este documento de resultados de laboratorio clínico y extrae con máxima precisión los parámetros presentes para el formulario de Evaluación DOM y Paraclínicos, dejando estrictamente vacíos (presente: false, valor: '') todos los campos que no estén en este archivo.",
      };

      const aiResponse = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts: [filePart, promptPart] },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const rawText = (aiResponse.text || "").trim();
      if (!rawText) {
        return res.status(502).json({
          error: "El servicio de interpretación devolvió una respuesta vacía.",
        });
      }

      const parsed = JSON.parse(rawText);

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
      const msg = err?.message || "No fue posible analizar el documento de laboratorio.";
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: msg });
    }
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

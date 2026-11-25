import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { PacienteRegistro } from "../types";

const PACIENTES_COLLECTION = "pacientes";
const COUNTER_DOC_PATH = "counters/pacientes_seq";
const ESTADOS_VALIDOS = [
  "en_triage",
  "pendiente_urgencias",
  "pendiente_detecto",
  "completado",
  "descartado",
];
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Recursively removes undefined and NaN values so Firestore never throws
 * on optional properties in nested medical forms.
 */
export function sanitizeForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
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

function buildPacientesQuery() {
  return query(
    collection(db, PACIENTES_COLLECTION),
    where("estado", "in", ESTADOS_VALIDOS)
  );
}

export function splitActivosYPapelera(allDocs: PacienteRegistro[]): {
  activos: PacienteRegistro[];
  papelera: (PacienteRegistro & { diasRestantes: number })[];
  alertas: {
    urgencias: { cantidad: number; items: any[] };
    detecto: { cantidad: number; items: any[] };
    laboratorios: { cantidad: number; items: any[] };
    terapias: { cantidad: number; items: any[] };
  };
} {
  const now = Date.now();
  const sorted = [...allDocs].sort((a, b) => (b.fechaCreacion || 0) - (a.fechaCreacion || 0));

  const activos = sorted.filter((p) => !p.enPapelera);
  const papelera = sorted
    .filter((p) => p.enPapelera)
    .map((p) => {
      const transcurrido = now - (p.fechaEliminacion || now);
      const diasRestantes = Math.max(
        0,
        Math.ceil((TEN_DAYS_MS - transcurrido) / (24 * 3600 * 1000))
      );
      return {
        ...p,
        diasRestantes,
      };
    });

  const pendientesUrgencias = activos.filter(
    (p) =>
      !p.fase3Completada &&
      p.estado !== "completado" &&
      p.estado !== "descartado"
  );
  const pendientesDetecto = activos.filter(
    (p) =>
      !p.fase3Completada &&
      (p.estado === "pendiente_detecto" || p.reportadoADetecto)
  );
  const pendientesLaboratorios = activos.filter(
    (p) =>
      !p.fase3Completada &&
      p.estado !== "completado" &&
      p.estado !== "descartado" &&
      p.estadosModulos?.fase1Validada === true &&
      !p.estadosModulos?.laboratoriosCompletado
  );
  const pendientesTerapias = activos.filter(
    (p) =>
      !p.fase3Completada &&
      p.estado !== "completado" &&
      p.estado !== "descartado" &&
      (p.categoriaTriageValidada || p.categoriaTriage) === 3 &&
      !p.estadosModulos?.terapiasCompletado
  );

  const alertas = {
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
  };

  return { activos, papelera, alertas };
}

export function subscribePacientesRealtime(
  onUpdate: (allDocs: PacienteRegistro[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = buildPacientesQuery();
  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data() as PacienteRegistro);
      onUpdate(docs);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, PACIENTES_COLLECTION);
      } catch (wrapped) {
        console.error(wrapped);
      }
    }
  );
}

export async function listarPacientesOnce(): Promise<PacienteRegistro[]> {
  try {
    const snap = await getDocs(buildPacientesQuery());
    return snap.docs.map((d) => d.data() as PacienteRegistro);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PACIENTES_COLLECTION);
  }
}

export async function crearPacienteFirestore(
  payload: Partial<PacienteRegistro>
): Promise<PacienteRegistro> {
  const now = Date.now();
  const id = `pac-${now}-${Math.random().toString(36).substring(2, 6)}`;
  const counterRef = doc(db, "counters", "pacientes_seq");
  const pacRef = doc(db, PACIENTES_COLLECTION, id);

  try {
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
          payload.identificacionPaciente?.trim() || "Sin identificación",
        nombre: payload.nombre?.trim() || "",
        apellido: payload.apellido?.trim() || "",
        edadAnos: payload.edadAnos?.trim() || "",
        edadMeses: payload.edadMeses?.trim() || "",
        vitalesIngreso: payload.vitalesIngreso || {},
        fechaCreacion: now,
        faseActual: payload.faseActual || 1,
        estado: payload.estado || "en_triage",
        fase1Completada: Boolean(payload.fase1Completada),
        fase2Completada: Boolean(payload.fase2Completada),
        fase3Completada: Boolean(payload.fase3Completada),
        criteriosTamizaje: payload.criteriosTamizaje || [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ],
        puntajeTamizaje: payload.puntajeTamizaje ?? 0,
        categoriaTriage: payload.categoriaTriage || 1,
        categoriaTriageLabel:
          payload.categoriaTriageLabel || "BAJA POSIBILIDAD DE SEPSIS",
        diagnosticoTriage: payload.diagnosticoTriage || "",
        autorTriage: payload.autorTriage || "Triage",
        diagnosticoUrgencias: payload.diagnosticoUrgencias || "",
        autorUrgencias: payload.autorUrgencias || "",
        diagnosticoDetecto: payload.diagnosticoDetecto || "",
        autorDetecto: payload.autorDetecto || "",
        tiempoFase1Segundos: payload.tiempoFase1Segundos || 0,
        tiempoFase2Segundos: payload.tiempoFase2Segundos || 0,
        tiempoFase3Segundos: payload.tiempoFase3Segundos || 0,
        tiempoTotalSegundos: payload.tiempoTotalSegundos || 0,
        timestampInicio: payload.timestampInicio || now,
        timestampPasoFase2: payload.timestampPasoFase2,
        timestampPasoFase3: payload.timestampPasoFase3,
        timestampFinalizado: payload.timestampFinalizado,
        aplicaSepsis: payload.aplicaSepsis,
        aprobadoUrgencias: payload.aprobadoUrgencias,
        motivoDescarte: payload.motivoDescarte,
        formularioEquipoSepsis: payload.formularioEquipoSepsis,
        categoriaTriageValidada: payload.categoriaTriageValidada,
        categoriaTriageValidadaLabel: payload.categoriaTriageValidadaLabel,
        motivoCambioCategoria: payload.motivoCambioCategoria,
        reportadoADetecto: Boolean(payload.reportadoADetecto),
        habilitadoCierreAnticipado: Boolean(payload.habilitadoCierreAnticipado),
        motivoCierreAnticipado: payload.motivoCierreAnticipado,
        estadosModulos: payload.estadosModulos || {
          fase1Validada: false,
          checklist1Completado: false,
          laboratoriosCompletado: false,
          anexoCompletado: false,
          vasopresoresCompletado: false,
          terapiasCompletado: false,
        },
        tiemposSubmodulos: payload.tiemposSubmodulos || {},
        laboratorios: payload.laboratorios || {},
        anexo2Data: payload.anexo2Data || {},
        anexo3Data: payload.anexo3Data || {},
        anexo4Data: payload.anexo4Data || {},
        vasopresoresData: payload.vasopresoresData || {},
      });

      tx.set(counterRef, { lastSeq: nextSeq });
      tx.set(pacRef, record);
      return record;
    });

    return nuevo;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PACIENTES_COLLECTION}/${id}`);
  }
}

export async function actualizarPacienteFirestore(
  id: string,
  patch: Partial<PacienteRegistro>
): Promise<PacienteRegistro> {
  const pacRef = doc(db, PACIENTES_COLLECTION, id);

  try {
    const updated = await runTransaction(db, async (tx) => {
      const snap = await tx.get(pacRef);
      if (!snap.exists()) {
        throw new Error(`Paciente ${id} no encontrado en Firestore`);
      }

      const current = snap.data() as PacienteRegistro;

      const mergedEstados = patch.estadosModulos
        ? {
            fase1Validada: Boolean(current.estadosModulos?.fase1Validada),
            checklist1Completado: Boolean(current.estadosModulos?.checklist1Completado),
            laboratoriosCompletado: Boolean(current.estadosModulos?.laboratoriosCompletado),
            anexoCompletado: Boolean(current.estadosModulos?.anexoCompletado),
            vasopresoresCompletado: Boolean(current.estadosModulos?.vasopresoresCompletado),
            terapiasCompletado: Boolean(current.estadosModulos?.terapiasCompletado),
            ...patch.estadosModulos,
          }
        : current.estadosModulos;

      const mergedTiemposSub = patch.tiemposSubmodulos
        ? {
            ...(current.tiemposSubmodulos || {}),
            ...patch.tiemposSubmodulos,
          }
        : current.tiemposSubmodulos;

      const cleanPatch = sanitizeForFirestore({ ...patch });
      delete (cleanPatch as any).diasRestantes;

      const merged: PacienteRegistro = sanitizeForFirestore({
        ...current,
        ...cleanPatch,
        estadosModulos: mergedEstados,
        tiemposSubmodulos: mergedTiemposSub,
        id: current.id,
        codigo: current.codigo,
        fechaCreacion: current.fechaCreacion,
      });

      tx.set(pacRef, merged);
      return merged;
    });

    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PACIENTES_COLLECTION}/${id}`);
  }
}

export async function moverAPapeleraFirestore(id: string): Promise<void> {
  await actualizarPacienteFirestore(id, {
    enPapelera: true,
    fechaEliminacion: Date.now(),
  });
}

export async function restaurarPacienteFirestore(id: string): Promise<void> {
  const pacRef = doc(db, PACIENTES_COLLECTION, id);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(pacRef);
      if (!snap.exists()) return;
      const data = { ...(snap.data() as PacienteRegistro) };
      data.enPapelera = false;
      delete data.fechaEliminacion;
      tx.set(pacRef, sanitizeForFirestore(data));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PACIENTES_COLLECTION}/${id}`);
  }
}

export async function purgarPacienteFirestore(id: string): Promise<void> {
  const pacRef = doc(db, PACIENTES_COLLECTION, id);
  try {
    await deleteDoc(pacRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PACIENTES_COLLECTION}/${id}`);
  }
}

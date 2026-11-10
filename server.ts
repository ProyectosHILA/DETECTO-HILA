import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "pacientes_db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface PacienteRegistro {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  identificacionPaciente?: string;
  fechaCreacion: number;
  faseActual: 1 | 2 | 3 | 4; // 1: Triage, 2: MedUrg, 3: Detecto, 4: Completado
  estado: "en_triage" | "pendiente_urgencias" | "pendiente_detecto" | "completado" | "descartado";
  fase1Completada: boolean;
  fase2Completada: boolean;
  fase3Completada: boolean;
  
  // Tamizaje 8 Criterios & Categoría
  criteriosTamizaje?: boolean[];
  puntajeTamizaje?: number;
  categoriaTriage?: 1 | 2 | 3;
  categoriaTriageLabel?: string;

  // Diagnósticos
  diagnosticoTriage: string;
  autorTriage?: string;
  diagnosticoUrgencias: string;
  aplicaSepsis?: boolean;
  aprobadoUrgencias?: boolean;
  motivoDescarte?: string;
  autorUrgencias?: string;
  diagnosticoDetecto?: string;
  autorDetecto?: string;
  
  // Tiempos (en segundos)
  tiempoFase1Segundos: number;
  tiempoFase2Segundos: number;
  tiempoFase3Segundos: number;
  tiempoTotalSegundos: number;
  timestampInicio: number;
  timestampPasoFase2?: number;
  timestampPasoFase3?: number;
  timestampFinalizado?: number;
  // Formulario digitalizado Lista de Chequeo 1 (PDF)
  formularioEquipoSepsis?: any;

  // Papelera
  enPapelera?: boolean;
  fechaEliminacion?: number;
}

// Initial data is empty (only real cases will be recorded)
const SEED_DATA: PacienteRegistro[] = [];

function readDB(): PacienteRegistro[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(SEED_DATA, null, 2), "utf-8");
      return SEED_DATA;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    // Cleanup items in trash older than 10 days (10 * 24 * 3600 * 1000 ms)
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const filtered = parsed.filter((p: PacienteRegistro) => {
      if (p.enPapelera && p.fechaEliminacion) {
        return now - p.fechaEliminacion < TEN_DAYS_MS;
      }
      return true;
    });
    if (filtered.length !== parsed.length) {
      fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    }
    return filtered;
  } catch (err) {
    console.error("Error reading DB:", err);
    return [];
  }
}

function writeDB(data: PacienteRegistro[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // API: Get active patients (not in trash)
  app.get("/api/pacientes", (_req: Request, res: Response) => {
    const list = readDB();
    const active = list.filter((p) => !p.enPapelera);
    res.json(active);
  });

  // API: Get pending alerts count for MedUrg and Detecto
  app.get("/api/alertas", (_req: Request, res: Response) => {
    const list = readDB();
    const pendientesUrgencias = list.filter(
      (p) => !p.enPapelera && p.estado === "pendiente_urgencias"
    );
    const pendientesDetecto = list.filter(
      (p) => !p.enPapelera && p.estado === "pendiente_detecto"
    );

    res.json({
      urgencias: {
        cantidad: pendientesUrgencias.length,
        items: pendientesUrgencias.map((p) => ({
          id: p.id,
          nombre: p.identificacionPaciente ? `ID: ${p.identificacionPaciente}` : `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Paciente',
          identificacionPaciente: p.identificacionPaciente || '',
          categoriaTriage: p.categoriaTriage,
          categoriaTriageLabel: p.categoriaTriageLabel,
          puntajeTamizaje: p.puntajeTamizaje,
          esperandoDesde: p.timestampPasoFase2 || p.timestampInicio,
          diagnosticoTriage: p.diagnosticoTriage,
        })),
      },
      detecto: {
        cantidad: pendientesDetecto.length,
        items: pendientesDetecto.map((p) => ({
          id: p.id,
          nombre: p.identificacionPaciente ? `ID: ${p.identificacionPaciente}` : `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Paciente',
          identificacionPaciente: p.identificacionPaciente || '',
          categoriaTriage: p.categoriaTriage,
          categoriaTriageLabel: p.categoriaTriageLabel,
          puntajeTamizaje: p.puntajeTamizaje,
          esperandoDesde: p.timestampPasoFase3 || p.timestampInicio,
          diagnosticoUrgencias: p.diagnosticoUrgencias,
        })),
      },
    });
  });

  // API: Create new patient case (from Triage)
  app.post("/api/pacientes", (req: Request, res: Response) => {
    const list = readDB();
    const now = Date.now();
    const count = list.length + 1;
    const nuevo: PacienteRegistro = {
      id: "pac-" + now + "-" + Math.random().toString(36).substring(2, 6),
      codigo: `HILA-2026-${count.toString().padStart(3, "0")}`,
      identificacionPaciente: req.body.identificacionPaciente?.trim() || "Sin identificación",
      nombre: req.body.nombre?.trim() || "",
      apellido: req.body.apellido?.trim() || "",
      fechaCreacion: now,
      faseActual: req.body.faseActual || 1,
      estado: req.body.estado || "en_triage",
      fase1Completada: Boolean(req.body.fase1Completada),
      fase2Completada: Boolean(req.body.fase2Completada),
      fase3Completada: Boolean(req.body.fase3Completada),
      criteriosTamizaje: req.body.criteriosTamizaje || [false, false, false, false, false, false, false, false],
      puntajeTamizaje: req.body.puntajeTamizaje ?? 0,
      categoriaTriage: req.body.categoriaTriage || 1,
      categoriaTriageLabel: req.body.categoriaTriageLabel || "BAJA POSIBILIDAD DE SEPSIS",
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
    };

    list.unshift(nuevo);
    writeDB(list);
    res.status(201).json(nuevo);
  });

  // API: Update patient case
  app.put("/api/pacientes/:id", (req: Request, res: Response) => {
    const list = readDB();
    const idx = list.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const current = list[idx];
    const updated: PacienteRegistro = {
      ...current,
      ...req.body,
      id: current.id, // Immutable ID
    };

    list[idx] = updated;
    writeDB(list);
    res.json(updated);
  });

  // API: Move to trash (Soft delete)
  app.delete("/api/pacientes/:id", (req: Request, res: Response) => {
    const list = readDB();
    const idx = list.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    list[idx].enPapelera = true;
    list[idx].fechaEliminacion = Date.now();
    writeDB(list);
    res.json({ success: true, message: "Movido a papelera (se eliminará permanentemente en 10 días)" });
  });

  // API: Trash list
  app.get("/api/papelera", (_req: Request, res: Response) => {
    const list = readDB();
    const now = Date.now();
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const papelera = list
      .filter((p) => p.enPapelera)
      .map((p) => {
        const transcurrido = now - (p.fechaEliminacion || now);
        const diasRestantes = Math.max(0, Math.ceil((TEN_DAYS_MS - transcurrido) / (24 * 3600 * 1000)));
        return {
          ...p,
          diasRestantes,
        };
      });
    res.json(papelera);
  });

  // API: Restore from trash
  app.post("/api/papelera/restaurar/:id", (req: Request, res: Response) => {
    const list = readDB();
    const idx = list.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "No encontrado" });
    }
    list[idx].enPapelera = false;
    delete list[idx].fechaEliminacion;
    writeDB(list);
    res.json({ success: true, message: "Paciente restaurado exitosamente" });
  });

  // API: Permanent purge
  app.delete("/api/papelera/purgar/:id", (req: Request, res: Response) => {
    let list = readDB();
    list = list.filter((p) => p.id !== req.params.id);
    writeDB(list);
    res.json({ success: true, message: "Registro eliminado definitivamente" });
  });

  // Vite development mode integration
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DETECTO Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

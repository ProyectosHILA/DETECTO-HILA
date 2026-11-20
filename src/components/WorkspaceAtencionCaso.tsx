import React, { useState, useEffect, useRef } from "react";
import {
  PacienteRegistro,
  CRITERIOS_TAMIZAJE_SEPSIS,
  FormularioEquipoSepsis,
  LaboratoriosDOMData,
  Anexo2ChoqueData,
  Anexo3AlertaSepsisData,
  Anexo4BajaProbabilidadData,
} from "../types";
import { FormularioEquipoSepsisPdf } from "./FormularioEquipoSepsisPdf";
import { FormularioLaboratorios } from "./FormularioLaboratorios";
import { FormularioAnexo2Rojo } from "./FormularioAnexo2Rojo";
import { FormularioAnexo3Amarillo } from "./FormularioAnexo3Amarillo";
import { FormularioAnexo4Verde } from "./FormularioAnexo4Verde";
import { VoiceDictationButton } from "./VoiceDictationButton";
import {
  Clock,
  Check,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Send,
  FileCheck2,
  FlaskConical,
  ClipboardList,
  ShieldCheck,
  Unlock,
  AlertTriangle,
  Stethoscope,
  Timer,
  Save,
} from "lucide-react";

interface WorkspaceAtencionCasoProps {
  paciente: PacienteRegistro;
  modoFase: "fase2" | "fase3";
  onActualizarPaciente: (patch: Partial<PacienteRegistro>) => Promise<void> | void;
  onReportarADetecto?: (diagnosticoUrgencias: string, segsFase2: number) => Promise<void> | void;
  onCerrarCaso: (datos: {
    diagnosticoUrgencias?: string;
    diagnosticoDetecto?: string;
    segsFaseActual: number;
  }) => Promise<void> | void;
  onVolverALista: () => void;
}

const LABELS_CATEGORIA: Record<1 | 2 | 3, string> = {
  1: "BAJA POSIBILIDAD DE SEPSIS",
  2: "ALERTA DE SEPSIS (SIN DOMᵃ)",
  3: "ALERTA CHOQUE SEPTICOᵇ O DOMᵃ",
};

export const WorkspaceAtencionCaso: React.FC<WorkspaceAtencionCasoProps> = ({
  paciente,
  modoFase,
  onActualizarPaciente,
  onReportarADetecto,
  onCerrarCaso,
  onVolverALista,
}) => {
  const [moduloAbierto, setModuloAbierto] = useState<
    null | "fase1" | "checklist1" | "laboratorios" | "anexo"
  >(null);

  // Live timers
  const [ahora, setAhora] = useState<number>(Date.now());
  const [segsEnVista, setSegsEnVista] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(Date.now());
      setSegsEnVista((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local editable states synced whenever patient prop updates from another device/phase
  const estados = paciente.estadosModulos || {
    fase1Validada: false,
    checklist1Completado: false,
    laboratoriosCompletado: false,
    anexoCompletado: false,
  };

  const categoriaValidada: 1 | 2 | 3 =
    paciente.categoriaTriageValidada || paciente.categoriaTriage || 1;
  const labelValidada =
    paciente.categoriaTriageValidadaLabel ||
    paciente.categoriaTriageLabel ||
    LABELS_CATEGORIA[categoriaValidada];

  // Botón 1 Validation state
  const [decisionCat, setDecisionCat] = useState<"mantener" | "cambiar">(
    paciente.motivoCambioCategoria ? "cambiar" : "mantener"
  );
  const [nuevaCatSeleccionada, setNuevaCatSeleccionada] = useState<1 | 2 | 3>(
    categoriaValidada
  );
  const [motivoCambioCat, setMotivoCambioCat] = useState<string>(
    paciente.motivoCambioCategoria || ""
  );
  const [diagnosticoUrgencias, setDiagnosticoUrgencias] = useState<string>(
    paciente.diagnosticoUrgencias || ""
  );
  const [diagnosticoDetecto, setDiagnosticoDetecto] = useState<string>(
    paciente.diagnosticoDetecto || ""
  );

  // Botón 2 Checklist 1 form state
  const [checklist1Data, setChecklist1Data] = useState<FormularioEquipoSepsis>(
    paciente.formularioEquipoSepsis || {}
  );

  // Botón 3 Laboratorios form state
  const [labsData, setLabsData] = useState<LaboratoriosDOMData>(
    paciente.laboratorios || {}
  );

  // Botón 4 Anexo form states
  const nombreDefaultAnexo = paciente.nombre
    ? `${paciente.nombre} (ID: ${paciente.identificacionPaciente})`
    : paciente.identificacionPaciente || paciente.codigo;

  const [anexo2Data, setAnexo2Data] = useState<Anexo2ChoqueData>({
    pacienteNombre: nombreDefaultAnexo,
    ...(paciente.anexo2Data || {}),
  });
  const [anexo3Data, setAnexo3AlertaData] = useState<Anexo3AlertaSepsisData>({
    pacienteNombre: nombreDefaultAnexo,
    ...(paciente.anexo3Data || {}),
  });
  const [anexo4Data, setAnexo4Data] = useState<Anexo4BajaProbabilidadData>({
    pacienteNombre: nombreDefaultAnexo,
    ...(paciente.anexo4Data || {}),
  });

  // Habilitar Cerrar Caso modal/box in Fase 3
  const [mostrarFormHabilitarCierre, setMostrarFormHabilitarCierre] = useState(false);
  const [motivoHabilitarCierre, setMotivoHabilitarCierre] = useState(
    paciente.motivoCierreAnticipado || ""
  );
  const [guardandoComentario, setGuardandoComentario] = useState(false);
  const [comentarioGuardadoOk, setComentarioGuardadoOk] = useState(false);

  // Track active patient ID, dirty flags (unsaved user edits), and last server snapshots
  // so 3-second background polling NEVER erases what the user is typing.
  const prevPacienteIdRef = useRef<string>(paciente.id);
  const dirtyFlagsRef = useRef({
    fase1: false,
    checklist1: false,
    laboratorios: false,
    anexo: false,
    diagnosticoUrgencias: false,
    diagnosticoDetecto: false,
    motivoHabilitarCierre: false,
  });
  const lastSnapshotsRef = useRef({
    categoriaValidada: String(categoriaValidada),
    motivoCambioCat: paciente.motivoCambioCategoria || "",
    checklist1: JSON.stringify(paciente.formularioEquipoSepsis || {}),
    laboratorios: JSON.stringify(paciente.laboratorios || {}),
    anexo2: JSON.stringify(paciente.anexo2Data || {}),
    anexo3: JSON.stringify(paciente.anexo3Data || {}),
    anexo4: JSON.stringify(paciente.anexo4Data || {}),
    diagnosticoUrgencias: paciente.diagnosticoUrgencias || "",
    diagnosticoDetecto: paciente.diagnosticoDetecto || "",
    motivoCierreAnticipado: paciente.motivoCierreAnticipado || "",
  });

  // Sync only when switching to a different patient, or when a specific field changed on the server
  // AND the user has not locally modified that form.
  useEffect(() => {
    const snapChecklist1 = JSON.stringify(paciente.formularioEquipoSepsis || {});
    const snapLabs = JSON.stringify(paciente.laboratorios || {});
    const snapAnexo2 = JSON.stringify(paciente.anexo2Data || {});
    const snapAnexo3 = JSON.stringify(paciente.anexo3Data || {});
    const snapAnexo4 = JSON.stringify(paciente.anexo4Data || {});
    const snapDiagUrg = paciente.diagnosticoUrgencias || "";
    const snapDiagDet = paciente.diagnosticoDetecto || "";
    const snapMotivoCambio = paciente.motivoCambioCategoria || "";
    const snapCatValidada = String(categoriaValidada);
    const snapMotivoCierre = paciente.motivoCierreAnticipado || "";

    if (prevPacienteIdRef.current !== paciente.id) {
      prevPacienteIdRef.current = paciente.id;
      dirtyFlagsRef.current = {
        fase1: false,
        checklist1: false,
        laboratorios: false,
        anexo: false,
        diagnosticoUrgencias: false,
        diagnosticoDetecto: false,
        motivoHabilitarCierre: false,
      };
      setDecisionCat(paciente.motivoCambioCategoria ? "cambiar" : "mantener");
      setNuevaCatSeleccionada(categoriaValidada);
      setMotivoCambioCat(snapMotivoCambio);
      setDiagnosticoUrgencias(snapDiagUrg);
      setDiagnosticoDetecto(snapDiagDet);
      setChecklist1Data(paciente.formularioEquipoSepsis || {});
      setLabsData(paciente.laboratorios || {});
      setAnexo2Data({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo2Data || {}) });
      setAnexo3AlertaData({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo3Data || {}) });
      setAnexo4Data({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo4Data || {}) });
      setMotivoHabilitarCierre(snapMotivoCierre);

      lastSnapshotsRef.current = {
        categoriaValidada: snapCatValidada,
        motivoCambioCat: snapMotivoCambio,
        checklist1: snapChecklist1,
        laboratorios: snapLabs,
        anexo2: snapAnexo2,
        anexo3: snapAnexo3,
        anexo4: snapAnexo4,
        diagnosticoUrgencias: snapDiagUrg,
        diagnosticoDetecto: snapDiagDet,
        motivoCierreAnticipado: snapMotivoCierre,
      };
      return;
    }

    if (
      !dirtyFlagsRef.current.fase1 &&
      (snapCatValidada !== lastSnapshotsRef.current.categoriaValidada ||
        snapMotivoCambio !== lastSnapshotsRef.current.motivoCambioCat)
    ) {
      setDecisionCat(snapMotivoCambio ? "cambiar" : "mantener");
      setNuevaCatSeleccionada(categoriaValidada);
      setMotivoCambioCat(snapMotivoCambio);
      lastSnapshotsRef.current.categoriaValidada = snapCatValidada;
      lastSnapshotsRef.current.motivoCambioCat = snapMotivoCambio;
    }

    if (
      !dirtyFlagsRef.current.checklist1 &&
      snapChecklist1 !== lastSnapshotsRef.current.checklist1
    ) {
      setChecklist1Data(paciente.formularioEquipoSepsis || {});
      lastSnapshotsRef.current.checklist1 = snapChecklist1;
    }

    if (
      !dirtyFlagsRef.current.laboratorios &&
      snapLabs !== lastSnapshotsRef.current.laboratorios
    ) {
      setLabsData(paciente.laboratorios || {});
      lastSnapshotsRef.current.laboratorios = snapLabs;
    }

    if (!dirtyFlagsRef.current.anexo) {
      if (snapAnexo2 !== lastSnapshotsRef.current.anexo2) {
        setAnexo2Data({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo2Data || {}) });
        lastSnapshotsRef.current.anexo2 = snapAnexo2;
      }
      if (snapAnexo3 !== lastSnapshotsRef.current.anexo3) {
        setAnexo3AlertaData({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo3Data || {}) });
        lastSnapshotsRef.current.anexo3 = snapAnexo3;
      }
      if (snapAnexo4 !== lastSnapshotsRef.current.anexo4) {
        setAnexo4Data({ pacienteNombre: nombreDefaultAnexo, ...(paciente.anexo4Data || {}) });
        lastSnapshotsRef.current.anexo4 = snapAnexo4;
      }
    }

    if (
      !dirtyFlagsRef.current.diagnosticoUrgencias &&
      snapDiagUrg !== lastSnapshotsRef.current.diagnosticoUrgencias
    ) {
      setDiagnosticoUrgencias(snapDiagUrg);
      lastSnapshotsRef.current.diagnosticoUrgencias = snapDiagUrg;
    }

    if (
      !dirtyFlagsRef.current.diagnosticoDetecto &&
      snapDiagDet !== lastSnapshotsRef.current.diagnosticoDetecto
    ) {
      setDiagnosticoDetecto(snapDiagDet);
      lastSnapshotsRef.current.diagnosticoDetecto = snapDiagDet;
    }

    if (
      !dirtyFlagsRef.current.motivoHabilitarCierre &&
      snapMotivoCierre !== lastSnapshotsRef.current.motivoCierreAnticipado
    ) {
      setMotivoHabilitarCierre(snapMotivoCierre);
      lastSnapshotsRef.current.motivoCierreAnticipado = snapMotivoCierre;
    }
  }, [paciente, categoriaValidada, nombreDefaultAnexo]);

  // Helper formatters
  const formatearTiempo = (totalSeg: number) => {
    const mins = Math.floor(totalSeg / 60);
    const segs = totalSeg % 60;
    return `${mins.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  // Time calculations
  const segsDesdeReporte = Math.max(0, Math.floor((ahora - (paciente.timestampInicio || ahora)) / 1000));
  const metaSegundos = categoriaValidada === 3 ? 2700 : 3600;
  const segsRestantesMeta = Math.max(0, metaSegundos - segsDesdeReporte);
  const minsRestantes = Math.floor(segsRestantesMeta / 60);
  const segsModulo = segsRestantesMeta % 60;

  const segsFase2EnVivo = paciente.timestampPasoFase2
    ? Math.max(0, Math.floor((ahora - paciente.timestampPasoFase2) / 1000))
    : (paciente.tiempoFase2Segundos || 0) + segsEnVista;

  const segsFase3EnVivo = paciente.timestampPasoFase3
    ? Math.max(0, Math.floor((ahora - paciente.timestampPasoFase3) / 1000))
    : (paciente.tiempoFase3Segundos || 0) + segsEnVista;

  const segsFaseActual =
    modoFase === "fase2"
      ? paciente.reportadoADetecto && (paciente.tiempoFase2Segundos || 0) > 0
        ? paciente.tiempoFase2Segundos
        : Math.max(paciente.tiempoFase2Segundos || 0, segsFase2EnVivo)
      : segsFase3EnVivo;

  // All 4 buttons green?
  const todosVerdes =
    estados.fase1Validada &&
    estados.checklist1Completado &&
    estados.laboratoriosCompletado &&
    estados.anexoCompletado;

  const puedeCerrarCaso =
    todosVerdes || (modoFase === "fase3" && Boolean(paciente.habilitadoCierreAnticipado));

  // HANDLER: Validar Botón 1 (Triage)
  const handleValidarFase1 = async () => {
    if (decisionCat === "cambiar" && motivoCambioCat.trim().length < 5) {
      alert("Debe explicar obligatoriamente por qué cambia la clasificación asignada en Triage.");
      return;
    }

    const catFinal: 1 | 2 | 3 =
      decisionCat === "mantener" ? paciente.categoriaTriage || 1 : nuevaCatSeleccionada;
    const labelFinal = LABELS_CATEGORIA[catFinal];
    const motivoFinal = decisionCat === "cambiar" ? motivoCambioCat.trim() : "";

    const ahoraTs = Date.now();
    const baseFase2Ts = paciente.timestampPasoFase2 || paciente.timestampInicio || ahoraTs;
    const tsValidacion = paciente.tiemposSubmodulos?.timestampValidacionTriage || ahoraTs;
    const segsValidacion =
      paciente.tiemposSubmodulos?.validacionTriageSegundos ??
      Math.max(1, Math.floor((ahoraTs - baseFase2Ts) / 1000));

    dirtyFlagsRef.current.fase1 = false;
    lastSnapshotsRef.current.categoriaValidada = String(catFinal);
    lastSnapshotsRef.current.motivoCambioCat = motivoFinal;

    await onActualizarPaciente({
      categoriaTriageValidada: catFinal,
      categoriaTriageValidadaLabel: labelFinal,
      motivoCambioCategoria: motivoFinal,
      diagnosticoUrgencias:
        diagnosticoUrgencias.trim() ||
        paciente.diagnosticoUrgencias ||
        `Validación Triage: ${labelFinal}`,
      aprobadoUrgencias: decisionCat === "mantener",
      aplicaSepsis: true,
      tiempoFase2Segundos: modoFase === "fase2" ? segsFaseActual : paciente.tiempoFase2Segundos,
      estadosModulos: {
        ...estados,
        fase1Validada: true,
      },
      tiemposSubmodulos: {
        ...(paciente.tiemposSubmodulos || {}),
        timestampValidacionTriage: tsValidacion,
        validacionTriageSegundos: segsValidacion,
      },
    });

    setModuloAbierto(null);
  };

  // HANDLER: Guardar Botón 2 (Lista de Chequeo 1)
  const handleGuardarChecklist1 = async () => {
    const ahoraTs = Date.now();
    const refTs =
      paciente.tiemposSubmodulos?.timestampValidacionTriage ||
      paciente.timestampPasoFase2 ||
      paciente.timestampInicio ||
      ahoraTs;

    dirtyFlagsRef.current.checklist1 = false;
    lastSnapshotsRef.current.checklist1 = JSON.stringify(checklist1Data || {});

    await onActualizarPaciente({
      formularioEquipoSepsis: checklist1Data,
      tiempoFase2Segundos: modoFase === "fase2" ? segsFaseActual : paciente.tiempoFase2Segundos,
      tiempoFase3Segundos: modoFase === "fase3" ? segsFaseActual : paciente.tiempoFase3Segundos,
      estadosModulos: {
        ...estados,
        checklist1Completado: true,
      },
      tiemposSubmodulos: {
        ...(paciente.tiemposSubmodulos || {}),
        timestampChecklist1: ahoraTs,
        checklist1Segundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
      },
    });
    setModuloAbierto(null);
  };

  // HANDLER: Guardar Botón 3 (Resultados de Laboratorio)
  const handleGuardarLaboratorios = async () => {
    const ahoraTs = Date.now();
    const refTs =
      paciente.tiemposSubmodulos?.timestampValidacionTriage ||
      paciente.timestampPasoFase2 ||
      paciente.timestampInicio ||
      ahoraTs;

    dirtyFlagsRef.current.laboratorios = false;
    lastSnapshotsRef.current.laboratorios = JSON.stringify(labsData || {});

    await onActualizarPaciente({
      laboratorios: labsData,
      tiempoFase2Segundos: modoFase === "fase2" ? segsFaseActual : paciente.tiempoFase2Segundos,
      tiempoFase3Segundos: modoFase === "fase3" ? segsFaseActual : paciente.tiempoFase3Segundos,
      estadosModulos: {
        ...estados,
        laboratoriosCompletado: true,
      },
      tiemposSubmodulos: {
        ...(paciente.tiemposSubmodulos || {}),
        timestampLaboratorios: ahoraTs,
        laboratoriosSegundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
        laboratoriosCompletadoPor: modoFase,
      },
    });
    setModuloAbierto(null);
  };

  // HANDLER: Guardar Botón 4 (Anexo 2/3/4)
  const handleGuardarAnexo = async () => {
    const ahoraTs = Date.now();
    const refTs =
      paciente.tiemposSubmodulos?.timestampValidacionTriage ||
      paciente.timestampPasoFase2 ||
      paciente.timestampInicio ||
      ahoraTs;

    dirtyFlagsRef.current.anexo = false;

    const patch: Partial<PacienteRegistro> = {
      tiempoFase2Segundos: modoFase === "fase2" ? segsFaseActual : paciente.tiempoFase2Segundos,
      tiempoFase3Segundos: modoFase === "fase3" ? segsFaseActual : paciente.tiempoFase3Segundos,
      estadosModulos: {
        ...estados,
        anexoCompletado: true,
      },
      tiemposSubmodulos: {
        ...(paciente.tiemposSubmodulos || {}),
        timestampAnexo: ahoraTs,
        anexoSegundos: Math.max(1, Math.floor((ahoraTs - refTs) / 1000)),
        anexoTipo:
          categoriaValidada === 3
            ? "Anexo 2 (Rojo)"
            : categoriaValidada === 2
            ? "Anexo 3 (Amarillo)"
            : "Anexo 4 (Verde)",
      },
    };

    if (categoriaValidada === 3) {
      patch.anexo2Data = anexo2Data;
      lastSnapshotsRef.current.anexo2 = JSON.stringify(anexo2Data || {});
    } else if (categoriaValidada === 2) {
      patch.anexo3Data = anexo3Data;
      lastSnapshotsRef.current.anexo3 = JSON.stringify(anexo3Data || {});
    } else {
      patch.anexo4Data = anexo4Data;
      lastSnapshotsRef.current.anexo4 = JSON.stringify(anexo4Data || {});
    }

    await onActualizarPaciente(patch);
    setModuloAbierto(null);
  };

  // HANDLER: Guardar comentarios de Fase 3 inmediatamente
  const handleGuardarComentarioDetecto = async () => {
    setGuardandoComentario(true);
    setComentarioGuardadoOk(false);
    try {
      const comentarioTrim = diagnosticoDetecto.trim();
      dirtyFlagsRef.current.diagnosticoDetecto = false;
      lastSnapshotsRef.current.diagnosticoDetecto = comentarioTrim;
      await onActualizarPaciente({
        diagnosticoDetecto: comentarioTrim,
      });
      setComentarioGuardadoOk(true);
      setTimeout(() => setComentarioGuardadoOk(false), 3000);
    } finally {
      setGuardandoComentario(false);
    }
  };

  // HANDLER: Habilitar Cerrar Caso en Fase 3
  const handleConfirmarHabilitarCierre = async () => {
    if (motivoHabilitarCierre.trim().length < 5) {
      alert("Debe diligenciar obligatoriamente el motivo para habilitar el cierre anticipado.");
      return;
    }
    const motivoTrim = motivoHabilitarCierre.trim();
    const comentarioTrim = diagnosticoDetecto.trim();
    dirtyFlagsRef.current.motivoHabilitarCierre = false;
    lastSnapshotsRef.current.motivoCierreAnticipado = motivoTrim;
    if (comentarioTrim) {
      dirtyFlagsRef.current.diagnosticoDetecto = false;
      lastSnapshotsRef.current.diagnosticoDetecto = comentarioTrim;
    }

    await onActualizarPaciente({
      habilitadoCierreAnticipado: true,
      motivoCierreAnticipado: motivoTrim,
      ...(comentarioTrim ? { diagnosticoDetecto: comentarioTrim } : {}),
    });
    setMostrarFormHabilitarCierre(false);
  };

  // Label & info for Botón 4 depending on validated category
  const getAnexoInfo = () => {
    if (categoriaValidada === 3) {
      return {
        titulo: "Anexo 2. LISTA DE CHEQUEO – ALERTA DE CHOQUE SÉPTICO/DOM",
        subtitulo: "Clasificación ROJO · Meta ≤ 45 min · Laboratorios DOM sincronizados",
        badgeColor: "bg-[#ff9999] text-black border-[#e65c5c]",
      };
    }
    if (categoriaValidada === 2) {
      return {
        titulo: "Anexo 3. LISTA DE CHEQUEO – ALERTA DE SEPSIS (SIN DOM)",
        subtitulo: "Clasificación AMARILLO · Meta ≤ 60 min · Reevaluación horaria",
        badgeColor: "bg-[#f4b400] text-black border-[#d99b00]",
      };
    }
    return {
      titulo: "Anexo 4. LISTA DE CHEQUEO – BAJA PROBABILIDAD DE SEPSIS",
      subtitulo: "Clasificación VERDE · Algoritmo Neutropenia Febril MAMUTTS",
      badgeColor: "bg-[#7ecc61] text-black border-[#5ba83e]",
    };
  };

  const anexoInfo = getAnexoInfo();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => (moduloAbierto ? setModuloAbierto(null) : onVolverALista())}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{moduloAbierto ? "Volver a los 4 Módulos" : "Volver a la lista de casos"}</span>
        </button>

        <div className="flex items-center gap-2">
          {paciente.reportadoADetecto && (
            <span className="text-[11px] font-black bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-300">
              ✓ Reportado a DETECTO
            </span>
          )}
          <span
            className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
              modoFase === "fase2"
                ? "bg-amber-100 text-amber-950 border-amber-400"
                : "bg-purple-100 text-purple-950 border-purple-400"
            }`}
          >
            {modoFase === "fase2"
              ? "Fase 2 · Médico de Urgencias"
              : "Fase 3 · Equipo DETECTO"}
          </span>
        </div>
      </div>

      {/* HEADER DEL CASO + CRONÓMETROS INTEGRADOS (TIEMPO DESDE QUE SE REPORTÓ + META 45/60 MIN) */}
      <div className="bg-[#0b1f42] border border-sky-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold bg-sky-900/90 text-sky-200 px-2.5 py-0.5 rounded-lg border border-sky-700">
                {paciente.codigo}
              </span>
              {categoriaValidada === 3 && (
                <span className="text-xs font-black bg-[#ff9999] text-black px-2.5 py-0.5 rounded-lg">
                  {labelValidada}
                </span>
              )}
              {categoriaValidada === 2 && (
                <span className="text-xs font-black bg-[#f4b400] text-black px-2.5 py-0.5 rounded-lg">
                  {labelValidada}
                </span>
              )}
              {categoriaValidada === 1 && (
                <span className="text-xs font-black bg-[#7ecc61] text-black px-2.5 py-0.5 rounded-lg">
                  {labelValidada}
                </span>
              )}
            </div>

            <div>
              {paciente.nombre && (
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {paciente.nombre}
                </h2>
              )}
              <p className="text-sm sm:text-base font-mono font-bold text-sky-300">
                Cédula / ID: {paciente.identificacionPaciente || paciente.codigo}
              </p>
            </div>
          </div>

          {/* CAJA DE TIEMPOS EN VIVO (CENTRADA Y COMPLETA) */}
          <div className="bg-slate-950/90 border-2 border-sky-500/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[300px] shadow-lg">
            {/* Tiempo desde que se reportó */}
            <div className="text-center sm:border-r sm:border-slate-800 sm:pr-3">
              <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                Tiempo desde que se reportó
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-sky-300 tracking-widest mt-1">
                {formatearTiempo(segsDesdeReporte)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Fase 1 (Triage): <strong className="text-emerald-300">{formatearTiempo(paciente.tiempoFase1Segundos)}</strong>
                {(paciente.tiempoFase2Segundos > 0 || modoFase === "fase2") && (
                  <>
                    {" · "}Fase 2: <strong className="text-amber-300">{formatearTiempo(modoFase === "fase2" && !paciente.reportadoADetecto ? segsFase2EnVivo : (paciente.tiempoFase2Segundos || segsFase2EnVivo))}</strong>
                  </>
                )}
              </span>
              {(modoFase === "fase3" || paciente.timestampPasoFase3) && (
                <span className="text-[10px] text-purple-300 font-bold block mt-0.5 tabular-nums">
                  Fase 3 (desde reporte): <strong className="text-purple-200">{formatearTiempo(segsFase3EnVivo)}</strong>
                </span>
              )}
            </div>

            {/* Conteo regresivo 45 min o 60 min */}
            <div className="text-center">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                <Timer className="w-3.5 h-3.5 text-rose-400" />
                {categoriaValidada === 3 ? "Conteo Regresivo · Meta 45 Min" : "Conteo Regresivo · Meta 1 Hora"}
              </span>
              <div
                className={`text-3xl sm:text-4xl font-mono font-black tracking-widest mt-1 ${
                  segsRestantesMeta <= 600 ? "text-red-400 animate-pulse" : "text-amber-300"
                }`}
              >
                {formatearTiempo(segsRestantesMeta)}
              </div>
              <span
                className={`text-[11px] font-black block mt-1 px-2 py-0.5 rounded ${
                  segsRestantesMeta === 0
                    ? "bg-red-600 text-white"
                    : segsRestantesMeta <= 600
                    ? "bg-red-950 text-red-200 border border-red-700"
                    : "bg-sky-900/60 text-sky-200"
                }`}
              >
                {segsRestantesMeta === 0
                  ? "Le queda 00 min 00 seg"
                  : `Le queda ${minsRestantes} min ${segsModulo.toString().padStart(2, "0")} seg`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* VISTA PRINCIPAL: LOS 4 BOTONES MODULARES CON SEMÁFORO DE COLORES         */}
      {/* ======================================================================== */}
      {moduloAbierto === null && (
        <div className="space-y-6">
          {/* Instrucción de estado */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <ClipboardList className="w-4 h-4 text-[#0c2340]" />
              <span>
                {!estados.fase1Validada
                  ? "Paso obligatorio inicial: Ingrese al Botón 1 (AMARILLO) para validar el Triage y desbloquear los demás módulos."
                  : todosVerdes
                  ? "Todos los 4 módulos han sido completados y guardados en verde (✓)."
                  : "Diligencie los módulos pendientes (en rojo clarito) hasta completar los 4 en verde."}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-black">
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400">Amarillo: Validar Triage</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">Rojo clarito: Pendiente</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">Verde: Completado</span>
            </div>
          </div>

          {/* GRID DE LOS 4 BOTONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BOTÓN 1: RESULTADO FASE 1 TRIAGE */}
            <button
              type="button"
              onClick={() => setModuloAbierto("fase1")}
              className={`text-left p-5 sm:p-6 rounded-3xl border-2 shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-4 hover:-translate-y-0.5 ${
                estados.fase1Validada
                  ? "bg-emerald-600 border-emerald-700 text-white"
                  : "bg-amber-300 border-amber-500 text-slate-950 animate-pulse"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div
                  className={`p-3 rounded-2xl ${
                    estados.fase1Validada ? "bg-emerald-700 text-white" : "bg-slate-950 text-amber-300"
                  }`}
                >
                  <Stethoscope className="w-7 h-7" />
                </div>
                <span
                  className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    estados.fase1Validada
                      ? "bg-white text-emerald-800 border-emerald-200"
                      : "bg-white text-amber-950 border-amber-500"
                  }`}
                >
                  {estados.fase1Validada ? "✓ Validado" : "1. Validar Ahora"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase opacity-80 block">
                  Módulo 1 · Validación Triage
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-0.5 leading-snug">
                  Resultado FASE 1 TRIAGE — Categoría Asignada en Triage
                </h3>
                <p className="text-xs font-bold mt-1.5 opacity-90">
                  Puntaje: {paciente.puntajeTamizaje ?? 0}/8 pts · Categoría actual: {labelValidada}
                </p>
              </div>
            </button>

            {/* BOTÓN 2: LISTA DE CHEQUEO 1 */}
            <button
              type="button"
              disabled={!estados.fase1Validada}
              onClick={() => estados.fase1Validada && setModuloAbierto("checklist1")}
              className={`text-left p-5 sm:p-6 rounded-3xl border-2 shadow-lg transition-all flex flex-col justify-between gap-4 ${
                !estados.fase1Validada
                  ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-75"
                  : estados.checklist1Completado
                  ? "bg-emerald-600 border-emerald-700 text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-rose-100 border-rose-300 text-rose-950 hover:bg-rose-200/80 cursor-pointer hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div
                  className={`p-3 rounded-2xl ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-500"
                      : estados.checklist1Completado
                      ? "bg-emerald-700 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {!estados.fase1Validada ? (
                    <Lock className="w-7 h-7" />
                  ) : (
                    <FileCheck2 className="w-7 h-7" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-600 border-slate-400"
                      : estados.checklist1Completado
                      ? "bg-white text-emerald-800 border-emerald-200"
                      : "bg-white text-rose-800 border-rose-300"
                  }`}
                >
                  {!estados.fase1Validada
                    ? "🔒 Bloqueado"
                    : estados.checklist1Completado
                    ? "✓ Diligenciado"
                    : "Pendiente por llenar"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase opacity-80 block">
                  Módulo 2 · Evaluación Equipo de Sepsis
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-0.5 leading-snug">
                  LISTA DE CHEQUEO 1 — EVALUACIÓN POR EQUIPO DE SEPSIS
                </h3>
                <p className="text-xs font-semibold mt-1.5 opacity-85">
                  Signos vitales, EVAT, Examen físico al pie de cama y firmas (≤ 10 min).
                </p>
              </div>
            </button>

            {/* BOTÓN 3: RESULTADOS DE LABORATORIO */}
            <button
              type="button"
              disabled={!estados.fase1Validada}
              onClick={() => estados.fase1Validada && setModuloAbierto("laboratorios")}
              className={`text-left p-5 sm:p-6 rounded-3xl border-2 shadow-lg transition-all flex flex-col justify-between gap-4 ${
                !estados.fase1Validada
                  ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-75"
                  : estados.laboratoriosCompletado
                  ? "bg-emerald-600 border-emerald-700 text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-rose-100 border-rose-300 text-rose-950 hover:bg-rose-200/80 cursor-pointer hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div
                  className={`p-3 rounded-2xl ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-500"
                      : estados.laboratoriosCompletado
                      ? "bg-emerald-700 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {!estados.fase1Validada ? (
                    <Lock className="w-7 h-7" />
                  ) : (
                    <FlaskConical className="w-7 h-7" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-600 border-slate-400"
                      : estados.laboratoriosCompletado
                      ? "bg-white text-emerald-800 border-emerald-200"
                      : "bg-white text-rose-800 border-rose-300"
                  }`}
                >
                  {!estados.fase1Validada
                    ? "🔒 Bloqueado"
                    : estados.laboratoriosCompletado
                    ? paciente.tiemposSubmodulos?.laboratoriosCompletadoPor === "laboratorios"
                      ? "✓ Guardado (Lab)"
                      : "✓ Guardado"
                    : "Pendiente por llenar"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase opacity-80 block">
                  Módulo 3 · Paraclínicos, Fórmulas y Cultivos
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-0.5 leading-snug">
                  Resultados de Laboratorio
                </h3>
                <p className="text-xs font-semibold mt-1.5 opacity-85">
                  Paraclínicos últimas 6h, cálculo automático PaFiO₂ / SpFiO₂ y Hemocultivos A3.
                </p>
              </div>
            </button>

            {/* BOTÓN 4: ANEXO DINÁMICO SEGÚN CLASIFICACIÓN */}
            <button
              type="button"
              disabled={!estados.fase1Validada}
              onClick={() => estados.fase1Validada && setModuloAbierto("anexo")}
              className={`text-left p-5 sm:p-6 rounded-3xl border-2 shadow-lg transition-all flex flex-col justify-between gap-4 ${
                !estados.fase1Validada
                  ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-75"
                  : estados.anexoCompletado
                  ? "bg-emerald-600 border-emerald-700 text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-rose-100 border-rose-300 text-rose-950 hover:bg-rose-200/80 cursor-pointer hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div
                  className={`p-3 rounded-2xl ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-500"
                      : estados.anexoCompletado
                      ? "bg-emerald-700 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {!estados.fase1Validada ? (
                    <Lock className="w-7 h-7" />
                  ) : (
                    <ShieldCheck className="w-7 h-7" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
                    !estados.fase1Validada
                      ? "bg-slate-300 text-slate-600 border-slate-400"
                      : estados.anexoCompletado
                      ? "bg-white text-emerald-800 border-emerald-200"
                      : "bg-white text-rose-800 border-rose-300"
                  }`}
                >
                  {!estados.fase1Validada
                    ? "🔒 Bloqueado"
                    : estados.anexoCompletado
                    ? "✓ Completado"
                    : "Pendiente por llenar"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase opacity-80 block">
                  Módulo 4 · Lista de Chequeo Específica
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-0.5 leading-snug">
                  {anexoInfo.titulo}
                </h3>
                <p className="text-xs font-semibold mt-1.5 opacity-85">
                  {anexoInfo.subtitulo}
                </p>
              </div>
            </button>
          </div>

          {/* PANEL DE NOTAS Y BOTONES FINALES DE ACCIÓN */}
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            {/* Observaciones según fase */}
            {modoFase === "fase2" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700">
                    Concepto / Nota Clínica Médico de Urgencias:
                  </label>
                  <VoiceDictationButton
                    onTranscript={(txt) => {
                      dirtyFlagsRef.current.diagnosticoUrgencias = true;
                      setDiagnosticoUrgencias(txt);
                    }}
                    valorActual={diagnosticoUrgencias}
                    label="Dictar nota"
                  />
                </div>
                <textarea
                  rows={2}
                  value={diagnosticoUrgencias}
                  onChange={(e) => {
                    dirtyFlagsRef.current.diagnosticoUrgencias = true;
                    setDiagnosticoUrgencias(e.target.value);
                  }}
                  placeholder="Escriba o dicte el concepto clínico de urgencias..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-purple-900">
                    Dictamen y Conducta Líder Equipo DETECTO (Opcional):
                  </label>
                  <VoiceDictationButton
                    onTranscript={(txt) => {
                      dirtyFlagsRef.current.diagnosticoDetecto = true;
                      setDiagnosticoDetecto(txt);
                    }}
                    valorActual={diagnosticoDetecto}
                    label="Dictar conducta"
                  />
                </div>
                <textarea
                  rows={2}
                  value={diagnosticoDetecto}
                  onChange={(e) => {
                    dirtyFlagsRef.current.diagnosticoDetecto = true;
                    setComentarioGuardadoOk(false);
                    setDiagnosticoDetecto(e.target.value);
                  }}
                  placeholder="Observaciones finales del Equipo DETECTO antes de cerrar el caso..."
                  className="w-full bg-purple-50/40 border border-purple-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-700">
                    {comentarioGuardadoOk ? "✓ Comentario guardado en la historia del paciente" : ""}
                  </span>
                  <button
                    type="button"
                    disabled={guardandoComentario}
                    onClick={handleGuardarComentarioDetecto}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{guardandoComentario ? "Guardando..." : "Guardar Comentario"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Banner si cierre anticipado habilitado */}
            {paciente.habilitadoCierreAnticipado && (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 text-xs text-amber-950">
                <span className="font-black block">
                  🔓 Cierre Anticipado Habilitado por Equipo DETECTO:
                </span>
                <p className="mt-0.5 font-medium">{paciente.motivoCierreAnticipado}</p>
              </div>
            )}

            {/* Form obligatorio para Habilitar Cerrar Caso en Fase 3 */}
            {modoFase === "fase3" && mostrarFormHabilitarCierre && (
              <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Habilitar Cierre Anticipado sin todos los módulos en verde
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMostrarFormHabilitarCierre(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  Especifique obligatoriamente la justificación clínica para habilitar el botón <strong>CERRAR CASO</strong> sin haber completado los 4 módulos en verde:
                </p>
                <textarea
                  rows={2}
                  value={motivoHabilitarCierre}
                  onChange={(e) => {
                    dirtyFlagsRef.current.motivoHabilitarCierre = true;
                    setMotivoHabilitarCierre(e.target.value);
                  }}
                  placeholder="Ej. Paciente trasladado a otra institución / diagnóstico alternativo confirmado / fallecimiento..."
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-semibold outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmarHabilitarCierre}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow cursor-pointer"
                >
                  Confirmar Justificación y Habilitar Cierre
                </button>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200">
              {/* En Fase 2: Botón REPORTAR A DETECTO */}
              {modoFase === "fase2" && onReportarADetecto && (
                <button
                  type="button"
                  onClick={() => {
                    dirtyFlagsRef.current.diagnosticoUrgencias = false;
                    lastSnapshotsRef.current.diagnosticoUrgencias = diagnosticoUrgencias;
                    onReportarADetecto(diagnosticoUrgencias, segsFaseActual);
                  }}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-black px-5 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {paciente.reportadoADetecto
                      ? "ACTUALIZAR REPORTE A DETECTO"
                      : "REPORTAR A DETECTO"}
                  </span>
                </button>
              )}

              {/* En Fase 3: Botón HABILITAR CERRAR CASO si no están todos en verde */}
              {modoFase === "fase3" &&
                !todosVerdes &&
                !paciente.habilitadoCierreAnticipado &&
                !mostrarFormHabilitarCierre && (
                  <button
                    type="button"
                    onClick={() => setMostrarFormHabilitarCierre(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>HABILITAR CERRAR CASO</span>
                  </button>
                )}

              {/* BOTÓN CERRAR CASO (habilitado solo si los 4 están verdes, o si DETECTO habilitó cierre) */}
              <button
                type="button"
                disabled={!puedeCerrarCaso}
                onClick={() =>
                  onCerrarCaso({
                    diagnosticoUrgencias,
                    diagnosticoDetecto,
                    segsFaseActual,
                  })
                }
                className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all ${
                  puedeCerrarCaso
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95"
                    : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CERRAR CASO</span>
              </button>
            </div>

            {!puedeCerrarCaso && (
              <p className="text-[11px] text-slate-500 font-semibold text-right">
                ⚠️ Para habilitar <strong>CERRAR CASO</strong> debe completar los 4 módulos en verde
                {modoFase === "fase3" && " (o usar 'Habilitar Cerrar Caso' con justificación)."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* SUBMÓDULO 1: RESULTADO FASE 1 TRIAGE + VALIDACIÓN                        */}
      {/* ======================================================================== */}
      {moduloAbierto === "fase1" && (
        <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase text-amber-700 block">
                Módulo 1 · Validación Clínica
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Resultado FASE 1 TRIAGE — Categoría Asignada en Triage
              </h3>
            </div>
            <span className="text-xs font-black bg-sky-100 text-sky-900 px-3 py-1 rounded-full border border-sky-300">
              Puntaje Tamizaje: {paciente.puntajeTamizaje ?? 0} / 8 pts
            </span>
          </div>

          {/* Clasificación actual asignada en Triage */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-slate-600 block">
              Clasificación Original Registrada en Triage:
            </span>
            {paciente.categoriaTriage === 3 && (
              <div className="bg-[#ff9999] border-2 border-[#e65c5c] text-black font-black text-center py-3 px-4 rounded-2xl text-base shadow-sm">
                ALERTA CHOQUE SEPTICOᵇ O DOMᵃ
              </div>
            )}
            {paciente.categoriaTriage === 2 && (
              <div className="bg-[#f4b400] border-2 border-[#d99b00] text-black font-black text-center py-3 px-4 rounded-2xl text-base shadow-sm">
                ALERTA DE SEPSIS (SIN DOMᵃ)
              </div>
            )}
            {(!paciente.categoriaTriage || paciente.categoriaTriage === 1) && (
              <div className="bg-[#7ecc61] border-2 border-[#5ba83e] text-black font-black text-center py-3 px-4 rounded-2xl text-base shadow-sm">
                BAJA POSIBILIDAD DE SEPSIS
              </div>
            )}
          </div>

          {/* Tabla de 8 criterios evaluados en Triage */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-700 block">
              Criterios de Tamizaje Evaluados en Fase 1:
            </span>
            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-200">
              {CRITERIOS_TAMIZAJE_SEPSIS.map((criterio, idx) => {
                const marcado =
                  paciente.criteriosTamizaje && paciente.criteriosTamizaje[idx] === true;
                return (
                  <div
                    key={idx}
                    className={`p-3 flex items-center justify-between text-xs ${
                      marcado ? "bg-emerald-50 font-bold text-slate-900" : "bg-white text-slate-500"
                    }`}
                  >
                    <span>
                      {idx + 1}. {criterio}
                    </span>
                    {marcado ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg font-black">
                        <Check className="w-3.5 h-3.5" />
                        +1 pto
                      </span>
                    ) : (
                      <span className="text-slate-400">0 pt</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnóstico / Notas Triage */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-black uppercase text-slate-600 block mb-1">
              Notas de Triage:
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-800">
              "{paciente.diagnosticoTriage || "Sin observaciones adicionales"}"
            </p>
          </div>

          {/* VALIDAR O CAMBIAR CLASIFICACIÓN */}
          <div className="bg-amber-50/80 border-2 border-amber-400 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-black uppercase text-slate-900">
              Decisión Médica sobre Clasificación de Triage:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  dirtyFlagsRef.current.fase1 = true;
                  setDecisionCat("mantener");
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  decisionCat === "mantener"
                    ? "bg-emerald-100 border-emerald-600 text-emerald-950 shadow-md"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
              >
                <span className="font-black text-sm block">✓ Mantener Clasificación</span>
                <span className="text-xs block mt-0.5">
                  Confirmo categoría: {LABELS_CATEGORIA[paciente.categoriaTriage || 1]}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  dirtyFlagsRef.current.fase1 = true;
                  setDecisionCat("cambiar");
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  decisionCat === "cambiar"
                    ? "bg-amber-200 border-amber-700 text-slate-950 shadow-md"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
              >
                <span className="font-black text-sm block">⇄ Cambiar Clasificación</span>
                <span className="text-xs block mt-0.5">
                  Reclasificar nivel de riesgo con justificación obligatoria
                </span>
              </button>
            </div>

            {decisionCat === "cambiar" && (
              <div className="bg-white border border-amber-300 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-black uppercase text-slate-700">
                  Seleccione la Nueva Clasificación:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { cat: 1 as const, label: LABELS_CATEGORIA[1], cls: "bg-[#7ecc61] border-[#5ba83e]" },
                    { cat: 2 as const, label: LABELS_CATEGORIA[2], cls: "bg-[#f4b400] border-[#d99b00]" },
                    { cat: 3 as const, label: LABELS_CATEGORIA[3], cls: "bg-[#ff9999] border-[#e65c5c]" },
                  ].map((opt) => (
                    <button
                      key={opt.cat}
                      type="button"
                      onClick={() => {
                        dirtyFlagsRef.current.fase1 = true;
                        setNuevaCatSeleccionada(opt.cat);
                      }}
                      className={`p-3 rounded-xl border-2 font-black text-xs text-black transition-all cursor-pointer ${
                        opt.cls
                      } ${
                        nuevaCatSeleccionada === opt.cat
                          ? "ring-4 ring-sky-600 scale-[1.02]"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-black text-red-700 mb-1">
                    ¿Por qué cambia la clasificación? * (Obligatorio)
                  </label>
                  <textarea
                    rows={2}
                    value={motivoCambioCat}
                    onChange={(e) => {
                      dirtyFlagsRef.current.fase1 = true;
                      setMotivoCambioCat(e.target.value);
                    }}
                    placeholder="Explique los hallazgos clínicos que justifican el cambio de categoría..."
                    className="w-full bg-slate-50 border border-red-300 rounded-xl p-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleValidarFase1}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>VALIDAR Y DESBLOQUEAR MÓDULOS</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* SUBMÓDULO 2: LISTA DE CHEQUEO 1 (SIN SECCIÓN D)                          */}
      {/* ======================================================================== */}
      {moduloAbierto === "checklist1" && (
        <div className="space-y-4">
          <FormularioEquipoSepsisPdf
            data={checklist1Data}
            onChange={(updated) => {
              dirtyFlagsRef.current.checklist1 = true;
              setChecklist1Data(updated);
            }}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModuloAbierto(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleGuardarChecklist1}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Lista de Chequeo 1 (Marcar Verde)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* SUBMÓDULO 3: RESULTADOS DE LABORATORIO + CALCULADORAS + A3 HEMOCULTIVOS  */}
      {/* ======================================================================== */}
      {moduloAbierto === "laboratorios" && (
        <div className="space-y-4">
          <FormularioLaboratorios
            data={labsData}
            categoriaValidada={categoriaValidada}
            onChange={(updated) => {
              dirtyFlagsRef.current.laboratorios = true;
              setLabsData(updated);
            }}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModuloAbierto(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleGuardarLaboratorios}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Resultados de Laboratorio (Marcar Verde)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* SUBMÓDULO 4: ANEXO 2 / 3 / 4 DINÁMICO SEGÚN CLASIFICACIÓN VALIDADA       */}
      {/* ======================================================================== */}
      {moduloAbierto === "anexo" && (
        <div className="space-y-4">
          {categoriaValidada === 3 && (
            <FormularioAnexo2Rojo
              data={anexo2Data}
              laboratorios={labsData}
              onChange={(updated) => {
                dirtyFlagsRef.current.anexo = true;
                setAnexo2Data(updated);
              }}
            />
          )}
          {categoriaValidada === 2 && (
            <FormularioAnexo3Amarillo
              data={anexo3Data}
              onChange={(updated) => {
                dirtyFlagsRef.current.anexo = true;
                setAnexo3AlertaData(updated);
              }}
            />
          )}
          {categoriaValidada === 1 && (
            <FormularioAnexo4Verde
              data={anexo4Data}
              onChange={(updated) => {
                dirtyFlagsRef.current.anexo = true;
                setAnexo4Data(updated);
              }}
            />
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModuloAbierto(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleGuardarAnexo}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                Guardar Anexo {categoriaValidada === 3 ? "2" : categoriaValidada === 2 ? "3" : "4"} (Marcar Verde)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

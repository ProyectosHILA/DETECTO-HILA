export interface IdentificacionCaso {
  centro: string;
  historiaClinica: string;
  iniciales: string;
  numeroCaso: string;
}

export interface Paciente {
  rangoEdad: string;
  pesoKg: number | null;
}

export interface SospechaData {
  fiebre: boolean;
  hipotermia: boolean;
  taquicardia: boolean;
  normotermiaConFoco: boolean;
  presente: boolean;
}

export interface TamizajeData {
  usaEvat: boolean;
  puntajeEvat: number | null;
  criteriosPssc: string[];
  positivo: boolean;
}

export interface EquipoChecklistData {
  pesoKg: number | null;
  
  // Section A: Vital Signs
  signosVitalesRegistrados: boolean;
  
  // Section B: Physical Exam
  neurologicoGlasgow: boolean;
  cardiovascularPerfusion: boolean;
  respiratorioDificultad: boolean;
  abdomenGastoUrinario: boolean;
  pielMucosasMucositis: boolean;
  cateteresInflamatorios: boolean;
  focoInfecciosoIdentificado: boolean;
  explicacionFiebreAlternativa: boolean;
  explicacionTaquicardiaAlternativa: boolean;
  
  // Section C: Labs
  hemogramaCoagulacion: boolean;
  lactatoCreatininaGlicemia: boolean;
  astAltGgtBiliPcr: boolean;
  gasesSaFiO2: boolean;
  aislamientosPreviosRevisados: boolean;
}

export type ResultadoClasificacion = "choque_dom" | "sepsis" | "baja_posibilidad" | null;

export interface ClasificacionData {
  resultado: ResultadoClasificacion;
  criteriosDom: string[];
  disfuncionCardiovascular: boolean;
}

export type EscenarioClinicoATB = "A" | "B" | "C" | "D";

export interface TratamientoData {
  escenarioClinico: EscenarioClinicoATB;
  antibioticoPrincipal: string;
  dosisMgPrincipal: number | null;
  indicacionesVancomicina: string[];
  incluyeVancomicina: boolean;
  dosisMgVancomicina: number | null;
  
  // Vasoactives
  vasoactivo: string;
  dosisVasoactivoMcgKgMin: number;
  velocidadInfusionMetodoA: number | null;
  dosisMgMetodoB: number | null;
  velocidadInfusionMetodoB: number | null;
}

export interface MonitoreoData {
  respuestaPrimerBolo: boolean | null; // true = mejora, false = no mejora
  reevaluacionHoraCriterios: string[];
  manejoAdicional: string[];
  criteriosUci: string[];
  reclasificado: boolean;
}

export interface TiemposData {
  inicioTamizaje: number | null; // Timestamp in ms
  administracionAntibiotico: number | null; // Timestamp in ms
  metaAntibioticoMinutos: number; // 60 or 45
}

export interface CasoSepsis {
  identificacion: IdentificacionCaso;
  paciente: Paciente;
  sospecha: SospechaData;
  tamizaje: TamizajeData;
  equipoChecklist: EquipoChecklistData;
  clasificacion: ClasificacionData;
  tratamiento: TratamientoData;
  monitoreo: MonitoreoData;
  tiempos: TiemposData;
}

export type RolUsuario = "triage" | "medico_urgencias" | "grupo_detecto" | "super_usuario";

export interface UsuarioSesion {
  rol: RolUsuario;
  nombre: string;
  usuario: string;
}

export const CRITERIOS_TAMIZAJE_SEPSIS = [
  "Hipotermia o Fiebre",
  "Taquicardia",
  "Taquipnea",
  "Hipotensión de acuerdo con valores para la edad",
  "Perfusión anormal: llenado capilar rápido o retrasado (≥ 3 segundos)",
  "Pulsos débiles o saltones",
  "Piel moteada, rubicundez o piel fría",
  "Alteración del sensorio: Hipoactivo o irritable",
];

export interface PacienteRegistro {
  id: string;
  codigo: string;
  identificacionPaciente: string; // Número de identificación / Documento del paciente
  nombre?: string;
  apellido?: string;
  fechaCreacion: number;
  faseActual: 1 | 2 | 3 | 4;
  estado: "en_triage" | "pendiente_urgencias" | "pendiente_detecto" | "completado" | "descartado";
  fase1Completada: boolean;
  fase2Completada: boolean;
  fase3Completada: boolean;

  // Tamizaje Sepsis (8 Criterios)
  criteriosTamizaje: boolean[]; // 8 booleans
  puntajeTamizaje: number; // 0 to 8
  categoriaTriage: 1 | 2 | 3; // 1: Baja posibilidad, 2: Alerta sepsis (sin DOMa), 3: Alerta choque septico o DOMa
  categoriaTriageLabel: string;
  
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
  
  // Formulario digitalizado Lista de Chequeo 1 (PDF) - Evaluación por Equipo de Sepsis
  formularioEquipoSepsis?: FormularioEquipoSepsis;
  
  // Papelera
  enPapelera?: boolean;
  fechaEliminacion?: number;
  diasRestantes?: number;
}

export interface FormularioEquipoSepsis {
  dxOncologico?: string;
  faseQuimioterapia?: string;
  signosVitales?: {
    temperatura?: string;
    fc?: string;
    fr?: string;
    pas?: string;
    pam?: string;
    satO2?: string;
    fio2?: string;
  };
  evat?: {
    centroAvalado?: boolean | null;
    puntaje?: string;
  };
  examenFisico?: {
    glasgowTotal?: string;
    glasgowO?: string;
    glasgowV?: string;
    glasgowM?: string;
    llenadoCapilar?: "normal" | "prolongado" | "rapido_flash" | "";
    colorPiel?: "rosada" | "moteada" | "rubicundez" | "cianotico" | "";
    dificultadRespiratoria?: "no" | "si" | "";
    signosDificultad?: {
      aleteoNasal?: boolean;
      tirajesIntercostales?: boolean;
      quejido?: boolean;
    };
    auscultacion?: "normal" | "anormal" | "";
    abdominal?: {
      normal?: boolean;
      distension?: boolean;
      dolor?: boolean;
      visceromegalias?: boolean;
    };
    gastoUrinario?: "menor_igual_05" | "mayor_05" | "";
    extremidades?: "calientes" | "frias" | "";
    pulsos?: "normales" | "saltones" | "debiles" | "";
    pielMucosas?: {
      normal?: boolean;
      palidez?: boolean;
      ictericia?: boolean;
      petequias?: boolean;
      equimosis?: boolean;
      livideces?: boolean;
      mucositisGrado?: string;
      otro?: string;
    };
    cateteres?: {
      periferico?: "normal" | "cambios_inflamatorios" | "";
      central?: "normal" | "cambios_inflamatorios" | "";
    };
    focoInfeccioso?: {
      presente?: boolean | null;
      especificar?: string;
    };
    explicacionFiebre?: {
      infusionMedicamento?: boolean;
      reaccionTransfusional?: boolean;
      dolor?: boolean;
      otro?: string;
    };
  };
  paraclinicos?: {
    hemograma?: { checked?: boolean; fechaHora?: string; valor?: string };
    tpInr?: { checked?: boolean; fechaHora?: string; valor?: string };
    fibrinogenoDimeroD?: { checked?: boolean; fechaHora?: string; valor?: string };
    pcr?: { checked?: boolean; fechaHora?: string; valor?: string };
    astAlt?: { checked?: boolean; fechaHora?: string; valor?: string };
    bilirrubina?: { checked?: boolean; fechaHora?: string; valor?: string };
    creatinina?: { checked?: boolean; fechaHora?: string; valor?: string };
    electrolitos?: { checked?: boolean; fechaHora?: string; valor?: string };
    aislamientosPrevios?: { checked?: boolean; fechaHora?: string; valor?: string };
  };
  horaInicio?: string;
  horaClasificacion?: string;
  medicoFirma?: string;
  enfermeroFirma?: string;
}

export interface RangoEdadInfo {
  id: string;
  label: string;
  fcMax: number;
  frMax: number;
  pasMin: number;
}

export const RANGOS_EDAD: RangoEdadInfo[] = [
  { id: "0_1m", label: "< 1 mes", fcMax: 180, frMax: 60, pasMin: 60 },
  { id: "1_3m", label: "1 – < 3 meses", fcMax: 175, frMax: 55, pasMin: 65 },
  { id: "3_6m", label: "3 – < 6 meses", fcMax: 170, frMax: 55, pasMin: 65 },
  { id: "6_9m", label: "≥ 6 – < 9 meses", fcMax: 163, frMax: 54, pasMin: 70 },
  { id: "9_12m", label: "9 – < 12 meses", fcMax: 160, frMax: 50, pasMin: 70 },
  { id: "1_2a", label: "1 – < 2 años", fcMax: 150, frMax: 40, pasMin: 75 },
  { id: "2_6a", label: "2 – < 6 años", fcMax: 140, frMax: 30, pasMin: 80 },
  { id: "6_12a", label: "6 – < 12 años", fcMax: 130, frMax: 25, pasMin: 85 },
  { id: "12a_plus", label: "≥ 12 años", fcMax: 120, frMax: 20, pasMin: 90 },
];

export interface CriterioPssc {
  id: string;
  label: string;
}

export const CRITERIOS_PSSC: CriterioPssc[] = [
  { id: "fiebre_hipotermia", label: "Fiebre o hipotermia (<36°C)" },
  { id: "taquicardia", label: "Taquicardia (FC > P95 para la edad)" },
  { id: "taquipnea", label: "Taquipnea (FR > P95 para la edad)" },
  { id: "hipotension", label: "Hipotensión (PAS o PAM < P5)" },
  { id: "perfusion_anormal", label: "Perfusión anormal: llenado capilar rápido o ≥ 3 seg" },
  { id: "pulsos_anormales", label: "Pulsos anormales: débiles o saltones" },
  { id: "piel_moteada", label: "Piel moteada, rubicundez o piel fría" },
  { id: "alteracion_sensorio", label: "Alteración del sensorio: hipoactivo o irritable" },
];

export interface CriterioDomSistema {
  id: string;
  nombreSistema: string;
  descripcion: string;
  esCardiovascular?: boolean;
}

export const CRITERIOS_DOM: CriterioDomSistema[] = [
  {
    id: "cardiovascular",
    nombreSistema: "Cardiovascular",
    descripcion: "PAS/PAM <P5 · Lactato >2 mmol/L · Necesidad de vasopresor",
    esCardiovascular: true,
  },
  {
    id: "respiratorio",
    nombreSistema: "Respiratorio",
    descripcion: "PaFiO2 <400 o SaFiO2 <292",
  },
  {
    id: "neurologico",
    nombreSistema: "Neurológico",
    descripcion: "Glasgow ≤10 o deterioro agudo del sensorio",
  },
  {
    id: "renal",
    nombreSistema: "Renal",
    descripcion: "GU ≤0.5 ml/kg/h ≥6h + Cr elevada · GU <0.5 ≥12h · Cr >2x basal · TFG <35 · Sobrecarga hídrica >20% a 48h",
  },
  {
    id: "hematologico",
    nombreSistema: "Hematológico",
    descripcion: "Plaquetas <30.000 · INR >1.3 · Fibrinógeno <100 mg/dL · Dímero D >2 mg/L",
  },
  {
    id: "hepatico",
    nombreSistema: "Hepático",
    descripcion: "AST/ALT/GGT >100 U/L · Bili total >5 mg/dL · Bili directa >2 mg/L",
  },
  {
    id: "metabolico",
    nombreSistema: "Metabólico",
    descripcion: "Glucosa ≤50 o ≥150 mg/dL",
  },
];

export interface EscenarioATBInfo {
  id: "A" | "B" | "C" | "D";
  label: string;
  antibioticoNombre: string;
  posologia: string;
  dosisMgKg: number;
  dosisMaximaMg: number;
  frecuencia: string;
}

export const ESCENARIOS_ATB: EscenarioATBInfo[] = [
  {
    id: "A",
    label: "A — Fiebre + estabilidad clínica",
    antibioticoNombre: "Cefepime IV",
    posologia: "50 mg/kg/dosis · cada 8h · máx 2.000 mg/dosis",
    dosisMgKg: 50,
    dosisMaximaMg: 2000,
    frecuencia: "cada 8h",
  },
  {
    id: "B",
    label: "B — Foco intraabdominal / Choque / Colonización previa KPC",
    antibioticoNombre: "Piperacilina / Tazobactam IV",
    posologia: "100 mg/kg/dosis (comp. piperacilina) · cada 6h · máx 4.000 mg/dosis",
    dosisMgKg: 100,
    dosisMaximaMg: 4000,
    frecuencia: "cada 6h",
  },
  {
    id: "C",
    label: "C — Neutropenia febril de alto riesgo / Inestabilidad hemodinámica",
    antibioticoNombre: "Meropenem IV",
    posologia: "20 mg/kg/dosis (o 40 mg/kg en meningitis/choque grave) · cada 8h · máx 2.000 mg/dosis",
    dosisMgKg: 20,
    dosisMaximaMg: 2000,
    frecuencia: "cada 8h",
  },
  {
    id: "D",
    label: "D — Alerta Choque/DOM (Esquema Dirigido Choque)",
    antibioticoNombre: "Meropenem IV + Vancomicina IV",
    posologia: "Meropenem: 20 mg/kg/dosis (máx 2.000 mg) + Vancomicina: 15 mg/kg/dosis (máx 500 mg)",
    dosisMgKg: 20,
    dosisMaximaMg: 2000,
    frecuencia: "cada 8h / cada 6h",
  },
];

export const LISTA_INDICACIONES_VANCOMICINA = [
  "Alerta choque/DOM",
  "Bacteriemia cocos gram+",
  "Infección osteoarticular",
  "Infección de piel y tejidos blandos",
  "Neumonía lobar complicada con derrame",
  "Sospecha infección por catéter (CVC/PICC)",
  "Sospecha cocos gram+ resistentes",
];

export interface VasoactivoInfo {
  id: string;
  nombre: string;
  descripcion: string;
}

export const VASOACTIVOS: VasoactivoInfo[] = [
  {
    id: "adrenalina",
    nombre: "Adrenalina",
    descripcion: "Adrenalina — 1ª línea en choque séptico pediátrico (am)",
  },
  {
    id: "noradrenalina",
    nombre: "Noradrenalina",
    descripcion: "Noradrenalina — Choque caliente / vasoplejía previa",
  },
  {
    id: "dopamina",
    nombre: "Dopamina",
    descripcion: "Dopamina — Alternativa si no hay adrenalina",
  },
];

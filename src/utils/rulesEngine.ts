import { ESCENARIOS_ATB } from "../data/clinicalData";
import { ResultadoClasificacion, EscenarioClinicoATB } from "../types";

export interface CalculoDosis {
  dosisMg: number;
  observacion?: string;
}

/**
 * Calculates dose by weight with min/max caps
 */
export function calcularDosisPorPeso(
  pesoKg: number,
  dosisMgKg: number,
  dosisMaximaMg?: number
): CalculoDosis {
  if (pesoKg <= 0) {
    return { dosisMg: 0, observacion: "El peso debe ser mayor que cero." };
  }

  const dosisCalculada = pesoKg * dosisMgKg;
  const dosisFinal = dosisMaximaMg
    ? Math.min(dosisCalculada, dosisMaximaMg)
    : dosisCalculada;

  return {
    dosisMg: Math.round(dosisFinal * 10) / 10,
    observacion:
      dosisMaximaMg && dosisCalculada > dosisMaximaMg
        ? `Se aplicó la dosis máxima configurada (${dosisMaximaMg} mg).`
        : undefined,
  };
}

/**
 * Screening decision engine
 */
export function calcularTamizaje(
  evat: number | null,
  criteriosPsscCount: number
): boolean {
  const evatPositivo = evat !== null && evat >= 3;
  const psscPositivo = criteriosPsscCount >= 2;
  return evatPositivo || psscPositivo;
}

/**
 * Final Classification decision engine
 */
export function clasificarCaso(
  tamizajePositivo: boolean,
  disfuncionCardiovascular: boolean,
  numeroOrganos: number
): ResultadoClasificacion {
  if (!tamizajePositivo) {
    return "baja_posibilidad";
  }

  if (disfuncionCardiovascular || numeroOrganos >= 2) {
    return "choque_dom";
  }

  return "sepsis";
}

/**
 * Vasoactive infusion calculator
 */
export interface CalculoVasoactivo {
  metodoAVelocidadMlHr: number; // 1 mg en 50 cc (20 mcg/ml)
  metodoBMgEn500cc: number;     // 0.3 * peso mg en 500 cc
  metodoBVelocidadCcHr: number; // 10 cc/hr = 0.1 mcg/kg/min
  alertaAccesoCentral: boolean; // True if dose > 0.25 mcg/kg/min
}

export function calcularVasoactivo(
  pesoKg: number,
  dosisMcgKgMin: number
): CalculoVasoactivo {
  if (pesoKg <= 0) {
    return {
      metodoAVelocidadMlHr: 0,
      metodoBMgEn500cc: 0,
      metodoBVelocidadCcHr: 0,
      alertaAccesoCentral: false,
    };
  }

  // Método A: Concentración fija (1 mg en 50 cc = 20 mcg/ml)
  // Velocidad (ml/hr) = (mcg/kg/min * peso * 60) / 20
  const mlHrA = (dosisMcgKgMin * pesoKg * 60) / 20;

  // Método B: Fórmula por peso (0.3 * kg mg en 500 cc)
  const mgEn500ccB = 0.3 * pesoKg;
  // 10 cc/hr = 0.1 mcg/kg/min => cc/hr = (dosis / 0.1) * 10 = dosis * 100
  const ccHrB = dosisMcgKgMin * 100;

  return {
    metodoAVelocidadMlHr: Math.round(mlHrA * 10) / 10,
    metodoBMgEn500cc: Math.round(mgEn500ccB * 10) / 10,
    metodoBVelocidadCcHr: Math.round(ccHrB * 10) / 10,
    alertaAccesoCentral: dosisMcgKgMin > 0.25,
  };
}

/**
 * Hydrocortisone dose calculator (100 mg/m2/day)
 */
export function calcularHidrocortisona(pesoKg: number): {
  dosisMgDia: number;
  dosisCada6h: number;
} {
  if (pesoKg <= 0) return { dosisMgDia: 0, dosisCada6h: 0 };
  // Approximate Body Surface Area for pediatrics (m2) = (peso * 4 + 7) / (peso + 90)
  const bsa = (pesoKg * 4 + 7) / (pesoKg + 90);
  const dosisMgDia = bsa * 100;
  const dosisCada6h = dosisMgDia / 4;

  return {
    dosisMgDia: Math.round(dosisMgDia),
    dosisCada6h: Math.round(dosisCada6h * 10) / 10,
  };
}

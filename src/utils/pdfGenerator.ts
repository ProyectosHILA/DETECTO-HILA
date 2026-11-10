import jsPDF from "jspdf";
import { CasoSepsis } from "../types";
import { ESCENARIOS_ATB, RANGOS_EDAD } from "../data/clinicalData";

export function descargarResumenPDF(caso: CasoSepsis): void {
  const doc = new jsPDF();
  let y = 18;

  // Header Bar / Brand
  doc.setFillColor(15, 43, 92); // Navy Blue
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DETECTO©", 14, 13);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sepsis en Oncología Pediátrica · Protocolo 2026", 14, 19);

  doc.setFontSize(9);
  doc.text(`Fecha informe: ${new Date().toLocaleString("es-ES")}`, 140, 19);

  y = 33;
  doc.setTextColor(0, 0, 0);

  // Section 1: Identificación del caso y paciente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y, 182, 7, "F");
  doc.text("1. IDENTIFICACIÓN DEL CASO Y PACIENTE", 16, y + 5);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Centro Hospitalario: ${caso.identificacion.centro || "No registrado"}`, 16, y);
  doc.text(`N° Historia Clínica: ${caso.identificacion.historiaClinica || "No registrado"}`, 110, y);
  y += 6;
  doc.text(`Iniciales Paciente: ${caso.identificacion.iniciales || "N/A"}`, 16, y);
  doc.text(`N° Caso: ${caso.identificacion.numeroCaso || "N/A"}`, 110, y);
  y += 6;

  const rangoInfo = RANGOS_EDAD.find((r) => r.id === caso.paciente.rangoEdad);
  doc.text(`Grupo de Edad: ${rangoInfo ? rangoInfo.label : "No seleccionado"}`, 16, y);
  doc.text(`Peso registrado: ${caso.paciente.pesoKg ? `${caso.paciente.pesoKg} kg` : "No registrado"}`, 110, y);
  y += 10;

  // Section 2: Tiempos y Respuesta
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y, 182, 7, "F");
  doc.text("2. REGISTRO DE TIEMPOS Y META ATB", 16, y + 5);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const inicioStr = caso.tiempos.inicioTamizaje
    ? new Date(caso.tiempos.inicioTamizaje).toLocaleTimeString("es-ES")
    : "Sin activar";
  const atbStr = caso.tiempos.administracionAntibiotico
    ? new Date(caso.tiempos.administracionAntibiotico).toLocaleTimeString("es-ES")
    : "No registrado";

  let deltaMin: string = "N/A";
  if (caso.tiempos.inicioTamizaje && caso.tiempos.administracionAntibiotico) {
    const diffMs = caso.tiempos.administracionAntibiotico - caso.tiempos.inicioTamizaje;
    deltaMin = `${Math.floor(diffMs / 60000)} min`;
  }

  doc.text(`Inicio Tamizaje Positivo: ${inicioStr}`, 16, y);
  doc.text(`Meta Antibiótico: ≤ ${caso.tiempos.metaAntibioticoMinutos} minutos`, 110, y);
  y += 6;
  doc.text(`Hora Admin. Antibiótico: ${atbStr}`, 16, y);
  doc.text(`Tiempo Transcurrido ATB: ${deltaMin}`, 110, y);
  y += 10;

  // Section 3: Tamizaje y Clasificación
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y, 182, 7, "F");
  doc.text("3. TAMIZAJE Y CLASIFICACIÓN CLÍNICA", 16, y + 5);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tamizaje EVAT: ${caso.tamizaje.usaEvat ? `Puntaje ${caso.tamizaje.puntajeEvat ?? 0}` : "No utilizado"}`, 16, y);
  doc.text(`Criterios PSSC-MOD Marcados: ${caso.tamizaje.criteriosPssc.length} / 8`, 110, y);
  y += 6;

  let clasifTxt = "Pendiente de clasificar";
  if (caso.clasificacion.resultado === "choque_dom") clasifTxt = "⚠️ ALERTA DE CHOQUE SÉPTICO / DOM";
  else if (caso.clasificacion.resultado === "sepsis") clasifTxt = "🔷 ALERTA DE SEPSIS";
  else if (caso.clasificacion.resultado === "baja_posibilidad") clasifTxt = "🟢 BAJA POSIBILIDAD DE SEPSIS";

  doc.setFont("helvetica", "bold");
  doc.text(`Clasificación Final: ${clasifTxt}`, 16, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  if (caso.clasificacion.criteriosDom.length > 0) {
    doc.text(`Sistemas DOM Afectados: ${caso.clasificacion.criteriosDom.join(", ")}`, 16, y);
    y += 6;
  }
  y += 4;

  // Section 4: Tratamiento Calculado
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y, 182, 7, "F");
  doc.text("4. TRATAMIENTO Y DOSIS CALCULADAS POR PESO", 16, y + 5);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const escInfo = ESCENARIOS_ATB.find((e) => e.id === caso.tratamiento.escenarioClinico);
  doc.text(`Escenario Clínico: ${escInfo ? escInfo.label : "Escenario A"}`, 16, y);
  y += 6;

  doc.text(
    `Antibiótico Principal: ${caso.tratamiento.antibioticoPrincipal} — Dosis: ${caso.tratamiento.dosisMgPrincipal ?? "0"} mg`,
    16,
    y
  );
  y += 6;

  if (caso.tratamiento.incluyeVancomicina) {
    doc.text(
      `Vancomicina IV: ${caso.tratamiento.dosisMgVancomicina ?? 0} mg (Indicación: ${caso.tratamiento.indicacionesVancomicina.join(", ") || "General"})`,
      16,
      y
    );
    y += 6;
  }

  doc.text(`Vasoactivo seleccionado: ${caso.tratamiento.vasoactivo}`, 16, y);
  doc.text(`Dosis objetivo: ${caso.tratamiento.dosisVasoactivoMcgKgMin} mcg/kg/min`, 110, y);
  y += 6;

  doc.text(`Infusión Método A (Fija 20 mcg/ml): ${caso.tratamiento.velocidadInfusionMetodoA ?? 0} ml/hr`, 16, y);
  doc.text(`Infusión Método B (0.3*kg mg/500cc): ${caso.tratamiento.velocidadInfusionMetodoB ?? 0} cc/hr`, 110, y);
  y += 10;

  // Section 5: Reevaluación y UCI
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 244, 250);
  doc.rect(14, y, 182, 7, "F");
  doc.text("5. REEVALUACIÓN Y TRASLADO A UCI", 16, y + 5);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const mejoraStr =
    caso.monitoreo.respuestaPrimerBolo === true
      ? "SÍ presenta mejoría"
      : caso.monitoreo.respuestaPrimerBolo === false
      ? "NO presenta mejoría (Requerió 2° bolo / vasoactivos)"
      : "No evaluado aún";

  doc.text(`Respuesta al 1er bolo de líquidos: ${mejoraStr}`, 16, y);
  y += 6;

  if (caso.monitoreo.criteriosUci.length > 0) {
    doc.text(`Criterios de traslado a UCI: ${caso.monitoreo.criteriosUci.join(", ")}`, 16, y);
    y += 6;
  }

  y += 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Aviso Legal: DETECTO© es una herramienta de soporte a la decisión clínica para sepsis oncopedriátrica.",
    14,
    y
  );
  doc.text(
    "No sustituye el juicio médico profesional. Protocolo institucional verificado 2026.",
    14,
    y + 4
  );

  doc.save(`resumen-sepsis-caso-${caso.identificacion.numeroCaso || "detecto"}.pdf`);
}

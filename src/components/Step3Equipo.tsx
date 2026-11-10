import React from "react";
import { CasoSepsis, EquipoChecklistData } from "../types";
import { Check, ArrowRight, Clock, Scale } from "lucide-react";

interface Step3EquipoProps {
  caso: CasoSepsis;
  onUpdateChecklist: (data: Partial<EquipoChecklistData>) => void;
  onUpdatePeso: (peso: number | null) => void;
  onSiguiente: () => void;
}

export const Step3Equipo: React.FC<Step3EquipoProps> = ({
  caso,
  onUpdateChecklist,
  onUpdatePeso,
  onSiguiente,
}) => {
  const { equipoChecklist, paciente } = caso;

  const toggleCheck = (key: keyof Omit<EquipoChecklistData, "pesoKg">) => {
    onUpdateChecklist({
      [key]: !equipoChecklist[key],
    });
  };

  const checklistItems: { key: keyof Omit<EquipoChecklistData, "pesoKg">; label: string; section: "A" | "B" | "C" }[] = [
    // Section A
    {
      key: "signosVitalesRegistrados",
      label: "Temperatura · FC · FR · PAS · PAM · SatO2 · FiO2 registradas",
      section: "A",
    },
    // Section B
    {
      key: "neurologicoGlasgow",
      label: "Neurológico: Glasgow evaluado",
      section: "B",
    },
    {
      key: "cardiovascularPerfusion",
      label: "Cardiovascular / perfusión: llenado capilar, color piel, pulsos",
      section: "B",
    },
    {
      key: "respiratorioDificultad",
      label: "Respiratorio: dificultad respiratoria, auscultación",
      section: "B",
    },
    {
      key: "abdomenGastoUrinario",
      label: "Abdomen · gasto urinario · extremidades",
      section: "B",
    },
    {
      key: "pielMucosasMucositis",
      label: "Piel y mucosas: palidez · ictericia · petequias/equimosis · mucositis (registrar grado) · región perianal (eritema, fisuras, signos de absceso)",
      section: "B",
    },
    {
      key: "cateteresInflamatorios",
      label: "Catéteres (CVC/PICC): signos inflamatorios evaluados",
      section: "B",
    },
    {
      key: "focoInfecciosoIdentificado",
      label: "Foco infeccioso: identificado o descartado",
      section: "B",
    },
    {
      key: "explicacionFiebreAlternativa",
      label: "Explicación alternativa a fiebre (medicamento, transfusión)",
      section: "B",
    },
    {
      key: "explicacionTaquicardiaAlternativa",
      label: "Explicación alternativa a taquicardia (dolor, ansiedad)",
      section: "B",
    },
    // Section C
    {
      key: "hemogramaCoagulacion",
      label: "Hemograma · coagulación (TP/INR, fibrinógeno, dímero D)",
      section: "C",
    },
    {
      key: "lactatoCreatininaGlicemia",
      label: "Lactato sérico · creatinina · glicemia",
      section: "C",
    },
    {
      key: "astAltGgtBiliPcr",
      label: "AST/ALT · GGT · bilirrubinas total y directa · PCR",
      section: "C",
    },
    {
      key: "gasesSaFiO2",
      label: "Gases arteriales / SaFiO2",
      section: "C",
    },
    {
      key: "aislamientosPreviosRevisados",
      label: "Aislamientos previos revisados",
      section: "C",
    },
  ];

  const totalCompletados = checklistItems.filter(
    (item) => equipoChecklist[item.key]
  ).length;

  const totalItems = checklistItems.length; // 15
  const porcentaje = Math.round((totalCompletados / totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">
          PASO 3 — CHECKLIST EQUIPO DE SEPSIS
        </span>
      </div>

      {/* Red/Orange Header Box */}
      <div className="bg-red-50/90 border-l-4 border-red-600 p-4 rounded-r-xl space-y-1">
        <h3 className="font-bold text-red-950 text-sm flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-red-600" />
          Evaluación en ≤ 10 min desde tamizaje positivo
        </h3>
        <p className="text-red-900 text-xs font-medium">
          Médico + Enfermero/a al pie de cama.
        </p>
      </div>

      {/* Weight Input (Crucial for dosage steps!) */}
      <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-sky-600" />
          Peso del paciente (kg) — se usa en pasos siguientes
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={paciente.pesoKg ?? ""}
          onChange={(e) =>
            onUpdatePeso(e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder="Ej: 18"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 font-bold text-lg text-sky-950 outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white"
        />
      </div>

      {/* Section A: Signos Vitales */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          A. Signos vitales
        </h4>
        {checklistItems
          .filter((i) => i.section === "A")
          .map((item) => (
            <div
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                equipoChecklist[item.key]
                  ? "bg-sky-50/90 border-sky-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  equipoChecklist[item.key]
                    ? "bg-[#1182a0] border-[#1182a0] text-white"
                    : "bg-white border-slate-300"
                }`}
              >
                {equipoChecklist[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-medium text-slate-800">
                {item.label}
              </span>
            </div>
          ))}
      </div>

      {/* Section B: Examen Físico */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          B. Examen físico
        </h4>
        {checklistItems
          .filter((i) => i.section === "B")
          .map((item) => (
            <div
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                equipoChecklist[item.key]
                  ? "bg-sky-50/90 border-sky-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  equipoChecklist[item.key]
                    ? "bg-[#1182a0] border-[#1182a0] text-white"
                    : "bg-white border-slate-300"
                }`}
              >
                {equipoChecklist[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-medium text-slate-800">
                {item.label}
              </span>
            </div>
          ))}
      </div>

      {/* Section C: Paraclínicos */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          C. Paraclínicos
        </h4>
        {checklistItems
          .filter((i) => i.section === "C")
          .map((item) => (
            <div
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                equipoChecklist[item.key]
                  ? "bg-sky-50/90 border-sky-500 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  equipoChecklist[item.key]
                    ? "bg-[#1182a0] border-[#1182a0] text-white"
                    : "bg-white border-slate-300"
                }`}
              >
                {equipoChecklist[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-xs font-medium text-slate-800">
                {item.label}
              </span>
            </div>
          ))}
      </div>

      {/* Progress Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">
            Progreso del checklist
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {totalCompletados} / {totalItems}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onSiguiente}
        className="w-full bg-[#1182a0] hover:bg-[#0e6f89] text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        <span>Continuar a clasificación</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

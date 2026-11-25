import React from "react";
import { LaboratoriosDOMData, ParaclinicoEntry } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import { AlertCircle, Calculator, FlaskConical, Table2, TestTube2, Wind } from "lucide-react";

interface FormularioLaboratoriosProps {
  data: LaboratoriosDOMData;
  categoriaValidada: 1 | 2 | 3;
  onChange?: (updated: LaboratoriosDOMData) => void;
  soloLectura?: boolean;
  onAbrirListaCups?: () => void;
}

export const FormularioLaboratorios: React.FC<FormularioLaboratoriosProps> = ({
  data,
  categoriaValidada,
  onChange,
  soloLectura = false,
  onAbrirListaCups,
}) => {
  const updateEntry = (
    key:
      | "hemograma"
      | "tpInr"
      | "fibrinogeno"
      | "dimeroD"
      | "pcr"
      | "astAlt"
      | "bilirrubina"
      | "creatinina"
      | "electrolitos"
      | "aislamientosPrevios"
      | "lactatoSerico"
      | "glucosa"
      | "monitoreoGastoUrinario",
    field: keyof ParaclinicoEntry,
    val: any
  ) => {
    if (soloLectura || !onChange) return;
    const prev = (data[key] as ParaclinicoEntry) || {};
    onChange({
      ...data,
      [key]: {
        ...prev,
        [field]: val,
      },
    });
  };

  // Calculadoras PaFiO2 y SpFiO2 / SaFiO2
  const calcPaFiO2 = (pao2Str: string, fio2Str: string) => {
    const pao2 = parseFloat(pao2Str);
    let fio2 = parseFloat(fio2Str);
    if (!isNaN(pao2) && !isNaN(fio2) && fio2 > 0) {
      if (fio2 > 1) fio2 = fio2 / 100; // Permite digitar 21% o 0.21
      return (pao2 / fio2).toFixed(1);
    }
    return "";
  };

  const calcSpFiO2 = (spo2Str: string, fio2Str: string) => {
    const spo2 = parseFloat(spo2Str);
    let fio2 = parseFloat(fio2Str);
    if (!isNaN(spo2) && !isNaN(fio2) && fio2 > 0) {
      if (fio2 > 1) fio2 = fio2 / 100;
      return (spo2 / fio2).toFixed(1);
    }
    return "";
  };

  const updateGases = (field: "checked" | "pao2" | "fio2" | "resultado" | "fechaHora", val: any) => {
    if (soloLectura || !onChange) return;
    const prev = data.gasesPaFiO2 || {};
    const next = { ...prev, [field]: val };
    if (field === "pao2" || field === "fio2") {
      const calc = calcPaFiO2(next.pao2 || "", next.fio2 || "");
      if (calc) next.resultado = calc;
    }
    onChange({ ...data, gasesPaFiO2: next });
  };

  const updateSpFi = (field: "checked" | "spo2" | "fio2" | "resultado" | "fechaHora", val: any) => {
    if (soloLectura || !onChange) return;
    const prev = data.spFiO2 || {};
    const next = { ...prev, [field]: val };
    if (field === "spo2" || field === "fio2") {
      const calc = calcSpFiO2(next.spo2 || "", next.fio2 || "");
      if (calc) next.resultado = calc;
    }
    onChange({ ...data, spFiO2: next });
  };

  const updateHemocultivosA3 = (field: "tomado" | "fechaHora" | "detalle", val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      hemocultivosA3: {
        ...data.hemocultivosA3,
        [field]: val,
      },
    });
  };

  const esRojo = categoriaValidada === 3;

  return (
    <div className="bg-white border-2 border-[#007b8f] rounded-2xl shadow-xl overflow-hidden text-slate-900 text-xs space-y-0">
      {/* HEADER */}
      <div className="bg-[#0b4d6c] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white text-[#0b4d6c] rounded-xl shadow">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
              Resultados de Laboratorio y Evaluación DOM
            </h3>
            <span className="text-[11px] text-sky-100 block">
              Paraclínicos de últimas 6 horas · Fórmulas PaFiO₂ / SpFiO₂ · Hemocultivos A3
              {esRojo && " · Sincronizado con Anexo 2 (Choque Séptico/DOM)"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onAbrirListaCups && (
            <button
              type="button"
              onClick={onAbrirListaCups}
              className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Lista Labs / CUPS · Exportar</span>
            </button>
          )}
          {esRojo && (
            <span className="bg-red-600 text-white font-black px-3 py-1 rounded-full text-[11px] animate-pulse border border-red-400">
              URGENTE &lt; 45 MIN (ROJO)
            </span>
          )}
        </div>
      </div>

      {/* 1. SECCIÓN D: PARACLÍNICOS DE LAS ÚLTIMAS 6 HORAS (DOM) */}
      <div className="p-4 border-b border-slate-300 bg-white space-y-3">
        <h4 className="font-black text-xs uppercase text-[#074c5d] tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007b8f]"></span>
          D. PARACLÍNICOS DE LAS ÚLTIMAS 6 HORAS (evaluación disfunción orgánica múltiple - DOM)
        </h4>

        <div className="border border-[#007b8f] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#0b4d6c] text-white font-black text-center divide-x divide-white/20">
                <th className="p-2 w-28 text-left pl-3">Sistema</th>
                <th className="p-2 text-left pl-3">Parámetros</th>
                <th className="p-2 w-32 sm:w-36">Fecha/Hora</th>
                <th className="p-2 w-32 sm:w-40">Valor / Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#007b8f]/30">
              {/* HEMATOLÓGICO */}
              <tr className="bg-white">
                <td rowSpan={5} className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30 align-top">
                  Hematológico
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.hemograma?.checked)}
                      onChange={(e) => updateEntry("hemograma", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">
                      Hemograma (Hemoglobina, plaquetas, neutrófilos, linfocitos)
                    </span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.hemograma?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("hemograma", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.hemograma?.valor || ""}
                    onChange={(e) => updateEntry("hemograma", "valor", e.target.value)}
                    placeholder="Hb, Plaq, RAN"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.tpInr?.checked)}
                      onChange={(e) => updateEntry("tpInr", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">TP/INR</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.tpInr?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("tpInr", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.tpInr?.valor || ""}
                    onChange={(e) => updateEntry("tpInr", "valor", e.target.value)}
                    placeholder="seg / INR"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.fibrinogeno?.checked)}
                      onChange={(e) => updateEntry("fibrinogeno", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Fibrinógeno</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.fibrinogeno?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("fibrinogeno", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.fibrinogeno?.valor || ""}
                    onChange={(e) => updateEntry("fibrinogeno", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.dimeroD?.checked)}
                      onChange={(e) => updateEntry("dimeroD", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Dímero D</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.dimeroD?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("dimeroD", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.dimeroD?.valor || ""}
                    onChange={(e) => updateEntry("dimeroD", "valor", e.target.value)}
                    placeholder="ng/mL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.pcr?.checked)}
                      onChange={(e) => updateEntry("pcr", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Proteína C Reactiva</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.pcr?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("pcr", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.pcr?.valor || ""}
                    onChange={(e) => updateEntry("pcr", "valor", e.target.value)}
                    placeholder="mg/L"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              {/* HEPÁTICO */}
              <tr className="bg-[#fbfdfd]">
                <td rowSpan={2} className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30 align-top">
                  Hepático
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.astAlt?.checked)}
                      onChange={(e) => updateEntry("astAlt", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">AST/ALT</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.astAlt?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("astAlt", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.astAlt?.valor || ""}
                    onChange={(e) => updateEntry("astAlt", "valor", e.target.value)}
                    placeholder="U/L"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-[#fbfdfd]">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.bilirrubina?.checked)}
                      onChange={(e) => updateEntry("bilirrubina", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Bilirrubina total / directa</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.bilirrubina?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("bilirrubina", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.bilirrubina?.valor || ""}
                    onChange={(e) => updateEntry("bilirrubina", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              {/* RENAL */}
              <tr className="bg-white">
                <td rowSpan={esRojo ? 3 : 2} className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30 align-top">
                  Renal
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.creatinina?.checked)}
                      onChange={(e) => updateEntry("creatinina", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Creatinina</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.creatinina?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("creatinina", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.creatinina?.valor || ""}
                    onChange={(e) => updateEntry("creatinina", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.electrolitos?.checked)}
                      onChange={(e) => updateEntry("electrolitos", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">
                      Electrolitos (calcio, sodio, potasio, magnesio, cloro)
                    </span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.electrolitos?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("electrolitos", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.electrolitos?.valor || ""}
                    onChange={(e) => updateEntry("electrolitos", "valor", e.target.value)}
                    placeholder="mEq/L"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              {esRojo && (
                <tr className="bg-rose-50/40">
                  <td className="p-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(data.monitoreoGastoUrinario?.checked)}
                        onChange={(e) => updateEntry("monitoreoGastoUrinario", "checked", e.target.checked)}
                        className="accent-[#007b8f]"
                      />
                      <span className="font-bold text-slate-900">Monitoreo de gasto urinario</span>
                    </label>
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <FormattedTimeInput
                      mode="time"
                      disabled={soloLectura}
                      value={data.monitoreoGastoUrinario?.fechaHora || ""}
                      onValueChange={(val) => updateEntry("monitoreoGastoUrinario", "fechaHora", val)}
                      placeholder="hh:mm"
                      className="w-full bg-white border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                    />
                  </td>
                  <td className="p-1.5 border-l border-[#007b8f]/20">
                    <input
                      type="text"
                      disabled={soloLectura}
                      value={data.monitoreoGastoUrinario?.valor || ""}
                      onChange={(e) => updateEntry("monitoreoGastoUrinario", "valor", e.target.value)}
                      placeholder="cc/kg/h"
                      className="w-full bg-white border border-slate-200 px-1.5 py-1 font-bold rounded"
                    />
                  </td>
                </tr>
              )}

              {/* CARDIOVASCULAR Y METABÓLICO (si es Rojo u opcional para completar DOM) */}
              <tr className="bg-[#fbfdfd]">
                <td className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30">
                  Cardiovascular
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.lactatoSerico?.checked)}
                      onChange={(e) => updateEntry("lactatoSerico", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Lactato sérico</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.lactatoSerico?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("lactatoSerico", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.lactatoSerico?.valor || ""}
                    onChange={(e) => updateEntry("lactatoSerico", "valor", e.target.value)}
                    placeholder="mmol/L"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              <tr className="bg-white">
                <td className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30">
                  Metabólico
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.glucosa?.checked)}
                      onChange={(e) => updateEntry("glucosa", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Glucosa / Glucometría</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.glucosa?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("glucosa", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.glucosa?.valor || ""}
                    onChange={(e) => updateEntry("glucosa", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>

              {/* MICROBIOLÓGICO */}
              <tr className="bg-[#fbfdfd]">
                <td className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30">
                  Microbiológico
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(data.aislamientosPrevios?.checked)}
                      onChange={(e) => updateEntry("aislamientosPrevios", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Aislamientos previos</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <FormattedTimeInput
                    mode="datetime"
                    disabled={soloLectura}
                    value={data.aislamientosPrevios?.fechaHora || ""}
                    onValueChange={(val) => updateEntry("aislamientosPrevios", "fechaHora", val)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 text-center font-mono rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={data.aislamientosPrevios?.valor || ""}
                    onChange={(e) => updateEntry("aislamientosPrevios", "valor", e.target.value)}
                    placeholder="ej. Germen / Sensibilidad"
                    className="w-full bg-white border border-slate-200 px-1.5 py-1 font-bold rounded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RECUADRO NARANJA DE ADVERTENCIA DEL PROTOCOLO */}
        <div className="bg-[#fff6e6] border-2 border-[#f5b041] p-3 rounded-xl text-xs font-semibold text-[#8a4b08] leading-relaxed shadow-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
          <p>
            <strong>En caso de no tener paraclínicos recientes (últimas 6 horas)</strong>, solicitarlos para descartar DOM y adicionar <strong>lactato, glucometría</strong> y clasificar el sistema respiratorio con la <strong>SaFiO2 o PaFiO2</strong> del paciente.
          </p>
        </div>
      </div>

      {/* 2. CALCULADORAS RESPIRATORIAS: PaFiO2 y SpFiO2 / SaFiO2 */}
      <div className="p-4 border-b border-slate-300 bg-[#f7fcfd] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-black text-xs uppercase text-[#074c5d] tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-[#007b8f]" />
            Clasificación Sistema Respiratorio · Cálculo Automático PaFiO₂ y SpFiO₂ (SaFiO₂)
          </h4>
          {esRojo && (
            <span className="text-[10px] font-black uppercase bg-cyan-100 text-cyan-950 border border-cyan-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-700" />
              <span>Gestionado en Módulo TERAPIAS (Cat 3)</span>
            </span>
          )}
        </div>

        {esRojo && !soloLectura && (
          <div className="bg-cyan-50 border-2 border-cyan-400 rounded-xl p-3 text-xs font-bold text-cyan-950 flex items-start gap-2">
            <Wind className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <span>
              Paciente en <strong>Categoría 3 (Alerta Choque Séptico)</strong>: los campos de{" "}
              <strong>PaFiO₂ y SpFiO₂ (SaFiO₂)</strong> son diligenciados por el equipo de{" "}
              <strong>TERAPIAS</strong> desde su módulo dedicado y se reflejan automáticamente aquí en tiempo real.
            </span>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${esRojo && !soloLectura ? "opacity-85" : ""}`}>
          {/* Calculadora PaFiO2 */}
          <div className="bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura || esRojo}
                  checked={Boolean(data.gasesPaFiO2?.checked)}
                  onChange={(e) => updateGases("checked", e.target.checked)}
                  className="accent-[#007b8f] w-4 h-4"
                />
                <span>Gases Arteriales: PaFiO₂ = PaO₂ / FiO₂</span>
              </label>
              <FormattedTimeInput
                mode="time"
                disabled={soloLectura || esRojo}
                value={data.gasesPaFiO2?.fechaHora || ""}
                onValueChange={(val) => updateGases("fechaHora", val)}
                placeholder="Hora (hh:mm)"
                className="w-24 bg-slate-50 border border-slate-300 px-2 py-0.5 text-center rounded font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">PaO₂ (mmHg)</span>
                <input
                  type="number"
                  step="any"
                  disabled={soloLectura || esRojo}
                  value={data.gasesPaFiO2?.pao2 || ""}
                  onChange={(e) => updateGases("pao2", e.target.value)}
                  placeholder="ej. 75"
                  className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-1.5 rounded font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">FiO₂ (0.21-1 o %)</span>
                <input
                  type="number"
                  step="any"
                  disabled={soloLectura || esRojo}
                  value={data.gasesPaFiO2?.fio2 || ""}
                  onChange={(e) => updateGases("fio2", e.target.value)}
                  placeholder="ej. 0.40 o 40"
                  className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-1.5 rounded font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#0b4d6c] block">Resultado PaFiO₂</span>
                <input
                  type="text"
                  disabled={soloLectura || esRojo}
                  value={data.gasesPaFiO2?.resultado || ""}
                  onChange={(e) => updateGases("resultado", e.target.value)}
                  placeholder="PaFiO₂"
                  className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-1.5 rounded font-black text-center text-emerald-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Calculadora SpFiO2 / SaFiO2 */}
          <div className="bg-white border-2 border-[#007b8f]/40 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="flex items-center gap-2 font-black text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura || esRojo}
                  checked={Boolean(data.spFiO2?.checked)}
                  onChange={(e) => updateSpFi("checked", e.target.checked)}
                  className="accent-[#007b8f] w-4 h-4"
                />
                <span>Oximetría: SpFiO₂ (SaFiO₂) = SpO₂ / FiO₂</span>
              </label>
              <FormattedTimeInput
                mode="time"
                disabled={soloLectura || esRojo}
                value={data.spFiO2?.fechaHora || ""}
                onValueChange={(val) => updateSpFi("fechaHora", val)}
                placeholder="Hora (hh:mm)"
                className="w-24 bg-slate-50 border border-slate-300 px-2 py-0.5 text-center rounded font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">SpO₂ / SatO₂ (%)</span>
                <input
                  type="number"
                  step="any"
                  disabled={soloLectura || esRojo}
                  value={data.spFiO2?.spo2 || ""}
                  onChange={(e) => updateSpFi("spo2", e.target.value)}
                  placeholder="ej. 94"
                  className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-1.5 rounded font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">FiO₂ (0.21-1 o %)</span>
                <input
                  type="number"
                  step="any"
                  disabled={soloLectura || esRojo}
                  value={data.spFiO2?.fio2 || ""}
                  onChange={(e) => updateSpFi("fio2", e.target.value)}
                  placeholder="ej. 0.21 o 21"
                  className="w-full bg-[#f0f9fa] border border-[#9fd5de] px-2 py-1.5 rounded font-bold text-center"
                />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#0b4d6c] block">Resultado SpFiO₂</span>
                <input
                  type="text"
                  disabled={soloLectura || esRojo}
                  value={data.spFiO2?.resultado || ""}
                  onChange={(e) => updateSpFi("resultado", e.target.value)}
                  placeholder="SpFiO₂"
                  className="w-full bg-emerald-50 border-2 border-emerald-400 px-2 py-1.5 rounded font-black text-center text-emerald-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. A3. HEMOCULTIVOS (TRASLADADO A RESULTADOS DE LABORATORIO) */}
      <div className="p-4 bg-white space-y-2.5">
        <h4 className="font-black text-xs uppercase text-[#074c5d] tracking-wider flex items-center gap-1.5">
          <TestTube2 className="w-4 h-4 text-[#007b8f]" />
          A3. Hemocultivos y Cultivos Microbiológicos
        </h4>

        <div className="bg-sky-50/70 border-2 border-sky-200 rounded-2xl p-3.5 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={soloLectura}
              checked={Boolean(data.hemocultivosA3?.tomado)}
              onChange={(e) => updateHemocultivosA3("tomado", e.target.checked)}
              className="accent-[#007b8f] w-4 h-4 mt-0.5 shrink-0"
            />
            <div>
              <span className="font-black text-slate-900 block">
                A3. Hemocultivos: Hemocultivos y cultivos microbiológicos según sospecha clínica y protocolo MAMUTTS
              </span>
              <span className="text-[11px] text-slate-600 block">
                (1 periférico + 1 de línea central si tiene CVC/PICC + cultivos según foco clínico)
              </span>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-bold text-slate-600 block mb-0.5">Hora de Toma:</span>
              <FormattedTimeInput
                mode="time"
                disabled={soloLectura}
                value={data.hemocultivosA3?.fechaHora || ""}
                onValueChange={(val) => updateHemocultivosA3("fechaHora", val)}
                placeholder="hh:mm"
                className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-600 block mb-0.5">
                Detalle / Resultado Preliminar:
              </span>
              <input
                type="text"
                disabled={soloLectura}
                value={data.hemocultivosA3?.detalle || ""}
                onChange={(e) => updateHemocultivosA3("detalle", e.target.value)}
                placeholder="Sitio de toma, microorganismo aislado o pendiente..."
                className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

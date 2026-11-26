import React, { useState } from "react";
import { VasopresoresData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import { calcularOrdenVasopresorPorPeso } from "../utils/clinicaGases";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  ClipboardList,
  Copy,
  Download,
  Info,
  Syringe,
} from "lucide-react";

interface FormularioVasopresoresProps {
  data: VasopresoresData;
  pesoIngresoDefault?: string;
  horaIngresoDefault?: string;
  onChange?: (updated: VasopresoresData) => void;
  soloLectura?: boolean;
}

export const FormularioVasopresores: React.FC<FormularioVasopresoresProps> = ({
  data,
  pesoIngresoDefault = "",
  horaIngresoDefault = "",
  onChange,
  soloLectura = false,
}) => {
  const [copiado, setCopiado] = useState(false);

  const pesoActivoStr = (data.pesoKg !== undefined && data.pesoKg !== "" ? data.pesoKg : pesoIngresoDefault) || "";
  const pesoNum = parseFloat(pesoActivoStr.replace(",", "."));
  const pesoValido = !isNaN(pesoNum) && pesoNum > 0;

  // Método B: 0.3 * peso(kg) = mg en 500 cc
  const mgMetodoB = pesoValido ? (0.3 * pesoNum).toFixed(2) : "";
  // Método A: 0.1 mcg/kg/min = 0.3 * peso ml/hr
  const mlHrMetodoA = pesoValido ? (0.3 * pesoNum).toFixed(2) : "";

  const calculoOrden = calcularOrdenVasopresorPorPeso(
    data,
    pesoIngresoDefault,
    horaIngresoDefault
  );

  const update = (patch: Partial<VasopresoresData>) => {
    if (soloLectura || !onChange) return;
    const merged: VasopresoresData = {
      ...data,
      ...patch,
    };
    const calc = calcularOrdenVasopresorPorPeso(
      merged,
      pesoIngresoDefault,
      horaIngresoDefault
    );
    if (calc.requiereHidrocortisonaPorDosis && patch.considerarHidrocortisona === undefined) {
      merged.considerarHidrocortisona = true;
      merged.segundoVasoactivoAccesoCentral = true;
    }
    const calcFinal = calcularOrdenVasopresorPorPeso(
      merged,
      pesoIngresoDefault,
      horaIngresoDefault
    );
    onChange({
      ...merged,
      metodo: calcFinal.metodoActivo,
      diluyente: calcFinal.diluyenteActivo,
      dosisMcgKgMin: merged.dosisMcgKgMin || "0.1",
      velocidadMlHr: calcFinal.velocidadMlHr,
      superficieCorporal: calcFinal.superficieCorporal,
      mgTotalesPreparacion: calcFinal.mgTotales,
      volumenTotalCc: calcFinal.volumenTotalCc,
      hidrocortisonaDosisMg: calcFinal.hidrocortisonaDiaMg,
      ordenMedicaTexto: calcFinal.ordenMedicaTexto,
    });
  };

  const copiarOrden = async () => {
    const txt = data.ordenMedicaTexto && soloLectura ? data.ordenMedicaTexto : calculoOrden.ordenMedicaTexto;
    try {
      await navigator.clipboard.writeText(txt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const descargarOrdenTxt = () => {
    const txt = data.ordenMedicaTexto && soloLectura ? data.ordenMedicaTexto : calculoOrden.ordenMedicaTexto;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Orden_Medica_Vasopresores_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-2 border-[#b92b27] rounded-2xl shadow-xl overflow-hidden text-slate-900 font-sans text-xs select-text">
      {/* HEADER ROJO EXACTO A GUÍA DE BOLSILLO PÁG. 9 */}
      <div className="bg-[#c0392b] text-white px-5 py-3.5">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
          <Syringe className="w-5 h-5 shrink-0" />
          <span>VASOPRESORES POR VENA PERIFÉRICA</span>
        </h2>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* SUBTÍTULO ROJO DESTACADO */}
        <p className="text-center text-sm sm:text-base font-black text-[#c0392b]">
          Iniciar TEMPRANO si no hay respuesta hemodinámica al primer bolo de líquidos (10 ml/kg)
        </p>

        {/* TABLA 1: MEDICAMENTO / PRESENTACIÓN / DOSIS / CONSIDERACIÓN */}
        <div className="border border-slate-400 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[600px]">
            <thead>
              <tr className="bg-[#0b2e59] text-white font-black">
                <th className="p-2.5 border-r border-white/20">Medicamento</th>
                <th className="p-2.5 border-r border-white/20">Presentación</th>
                <th className="p-2.5 border-r border-white/20">Dosis</th>
                <th className="p-2.5">Consideración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr className="bg-[#fdf0ef]">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Adrenalina
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">Ampolla 1 mg</td>
                <td className="p-2.5 font-bold font-mono border-r border-slate-300">
                  0.05–2 mcg/kg/min
                </td>
                <td className="p-2.5 font-semibold text-slate-900">
                  1ª línea en choque séptico pediátrico
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Noradrenalina
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">Ampolla 4 mg</td>
                <td className="p-2.5 font-bold font-mono border-r border-slate-300">
                  0.05–2 mcg/kg/min
                </td>
                <td className="p-2.5 font-semibold text-slate-900">
                  Dosis &gt;0.25 mcg/kg/min: agregar hidrocortisona + considerar 2º vasoactivo y acceso venoso central
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BARRA AZUL OSCURA: DILUCIÓN Y VELOCIDAD DE INFUSIÓN */}
        <div className="bg-[#0b2e59] text-white px-4 py-2.5 rounded-xl font-black uppercase text-sm tracking-wide">
          DILUCIÓN Y VELOCIDAD DE INFUSIÓN
        </div>

        {/* MÉTODO A: CONCENTRACIÓN FIJA */}
        <div className="border-2 border-[#0e7490] rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <div className="bg-[#e6f6f9] text-[#0e6b83] px-3 py-2 font-black text-xs border-b border-[#0e7490]/40 flex flex-wrap items-center justify-between gap-2">
            <span>MÉTODO A — Concentración fija: 1 mg / 50 cc = 20 mcg/ml</span>
            {pesoValido && (
              <span className="bg-[#0e7490] text-white px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                Peso {pesoNum} kg → 0.1 mcg/kg/min = {mlHrMetodoA} ml/hr
              </span>
            )}
          </div>
          <table className="w-full border-collapse text-left text-xs min-w-[600px]">
            <thead>
              <tr className="bg-[#0e7490] text-white font-black">
                <th className="p-2.5 border-r border-white/20">Medicamento</th>
                <th className="p-2.5 border-r border-white/20">Preparación</th>
                <th className="p-2.5 border-r border-white/20">Diluyente</th>
                <th className="p-2.5">Velocidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr className="bg-[#eef8fa]">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Adrenalina
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">1 mg en 50 cc</td>
                <td className="p-2.5 font-semibold border-r border-slate-300">SSN 0.9% o DAD 5%</td>
                <td className="p-2.5 font-bold font-mono">
                  0.1 mcg/kg/min = 0.3 ml/kg/hr
                  {pesoValido ? ` (${mlHrMetodoA} ml/hr)` : ""}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Noradrenalina
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">1 mg en 50 cc</td>
                <td className="p-2.5 font-semibold border-r border-slate-300">SSN 0.9% o DAD 5%</td>
                <td className="p-2.5 font-bold font-mono">
                  0.1 mcg/kg/min = 0.3 ml/kg/hr
                  {pesoValido ? ` (${mlHrMetodoA} ml/hr)` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MÉTODO B: FÓRMULA POR PESO */}
        <div className="border-2 border-[#e0a800] rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <div className="bg-[#fef7dc] text-[#926200] px-3 py-2 font-black text-xs border-b border-[#e0a800]/50 flex flex-wrap items-center justify-between gap-2">
            <span>MÉTODO B — Fórmula por peso: 0.3 × peso(kg) mg / 500 cc</span>
            {pesoValido && (
              <span className="bg-[#e0a800] text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black">
                Cálculo automático: 0.3 × {pesoNum} kg = {mgMetodoB} mg/500cc
              </span>
            )}
          </div>
          <table className="w-full border-collapse text-left text-xs min-w-[600px]">
            <thead>
              <tr className="bg-[#f4b400] text-slate-950 font-black">
                <th className="p-2.5 border-r border-amber-700/20">Medicamento</th>
                <th className="p-2.5 border-r border-amber-700/20">Preparación</th>
                <th className="p-2.5 border-r border-amber-700/20">Diluyente</th>
                <th className="p-2.5">Velocidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr className="bg-[#fffbee]">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Adrenalina
                </td>
                <td className="p-2.5 font-bold font-mono border-r border-slate-300">
                  0.3 × <span className="underline px-1 text-[#0b2e59]">{pesoValido ? pesoNum : "___"}</span> kg ={" "}
                  <span className="underline px-1 text-[#c0392b] font-black">
                    {mgMetodoB || "___"}
                  </span>{" "}
                  mg/500cc
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">SSN 0.9% o DAD 5%</td>
                <td className="p-2.5 font-bold font-mono">10 cc/hr = 0.1 mcg/kg/min</td>
              </tr>
              <tr className="bg-white">
                <td className="p-2.5 font-black text-slate-950 border-r border-slate-300">
                  Noradrenalina
                </td>
                <td className="p-2.5 font-bold font-mono border-r border-slate-300">
                  0.3 × <span className="underline px-1 text-[#0b2e59]">{pesoValido ? pesoNum : "___"}</span> kg ={" "}
                  <span className="underline px-1 text-[#c0392b] font-black">
                    {mgMetodoB || "___"}
                  </span>{" "}
                  mg/500cc
                </td>
                <td className="p-2.5 font-semibold border-r border-slate-300">SSN 0.9% o DAD 5%</td>
                <td className="p-2.5 font-bold font-mono">10 cc/hr = 0.1 mcg/kg/min</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RECUADRO FINAL HIDROCORTISONA */}
        <div className="border-2 border-[#0b2e59] bg-[#eef5ff] rounded-xl p-3.5 text-xs text-slate-900 leading-relaxed">
          <span className="font-black text-[#0b2e59]">
            ■ HIDROCORTISONA (100 mg/m²/día):
          </span>{" "}
          Considerar en choque refractario a vasoactivos, sospecha de insuficiencia suprarrenal (hipoglicemia + uso reciente de esteroides) o dosis vasoactivo &gt;0.25 mcg/kg/min.
        </div>

        {/* GENERADOR DE ORDEN MÉDICA DE VASOPRESORES POR PESO (CON FÓRMULAS Y ALERTAS) */}
        <div className="border-2 border-[#0b2e59] rounded-2xl p-4 sm:p-5 bg-[#f7fafd] space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase text-[#0b2e59] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#c0392b]" />
                <span>Generador de Orden Médica de Vasopresores (Fórmula por Peso y Alertas)</span>
              </h3>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Calcula automáticamente dilución por peso, volumen de ampolla, velocidad en bomba (cc/hr), Hidrocortisona por SC (100 mg/m²/día) y emite alertas clínicas.
              </p>
            </div>

            {pesoIngresoDefault && (
              <span className="text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-1 rounded-full">
                Peso ingreso Fase 1: {pesoIngresoDefault} kg
              </span>
            )}
          </div>

          {/* ALERTAS CLÍNICAS AUTOMÁTICAS */}
          {calculoOrden.alertas.length > 0 && (
            <div className="space-y-2">
              {calculoOrden.alertas.map((alerta, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border-2 px-3.5 py-2.5 flex items-start gap-2.5 text-xs ${
                    alerta.nivel === "critica"
                      ? "bg-red-50 border-red-500 text-red-950"
                      : alerta.nivel === "advertencia"
                      ? "bg-amber-50 border-amber-400 text-amber-950"
                      : "bg-sky-50 border-sky-300 text-sky-950"
                  }`}
                >
                  {alerta.nivel === "critica" ? (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : alerta.nivel === "advertencia" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-black block">{alerta.titulo}</span>
                    <span className="font-semibold text-[11px]">{alerta.detalle}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PARÁMETROS PARA CONSTRUIR LA ORDEN MÉDICA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Conducta médica:
              </label>
              <select
                disabled={soloLectura}
                value={data.iniciado || ""}
                onChange={(e) =>
                  update({ iniciado: e.target.value as VasopresoresData["iniciado"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="">Seleccione conducta...</option>
                <option value="si">Sí — Iniciar Orden Médica de Vasopresor</option>
                <option value="pendiente_respuesta_bolo">
                  Evaluado — Respondió al 1er bolo / Orden de respaldo
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Medicamento vasoactivo:
              </label>
              <select
                disabled={soloLectura}
                value={data.medicamento || ""}
                onChange={(e) =>
                  update({ medicamento: e.target.value as VasopresoresData["medicamento"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="">Seleccione medicamento...</option>
                <option value="adrenalina">Adrenalina (Ampolla 1 mg / 1 ml — 1ª línea)</option>
                <option value="noradrenalina">Noradrenalina (Ampolla 4 mg / 4 ml)</option>
                <option value="ambos">Adrenalina + Noradrenalina (2º vasoactivo)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Vía de administración:
              </label>
              <select
                disabled={soloLectura}
                value={data.viaAcceso || "vena_periferica"}
                onChange={(e) =>
                  update({ viaAcceso: e.target.value as VasopresoresData["viaAcceso"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="vena_periferica">Vena periférica (Temprano)</option>
                <option value="intraosea">Aguja intraósea</option>
                <option value="acceso_central">Catéter venoso central</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Peso (kg):
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={pesoActivoStr}
                onChange={(e) => update({ pesoKg: e.target.value })}
                placeholder="ej. 18"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-center outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Método dilución:
              </label>
              <select
                disabled={soloLectura}
                value={calculoOrden.metodoActivo}
                onChange={(e) =>
                  update({ metodo: e.target.value as VasopresoresData["metodo"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="metodo_a">Método A (1 mg/50 cc)</option>
                <option value="metodo_b">Método B (0.3×peso / 500 cc)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Diluyente:
              </label>
              <select
                disabled={soloLectura}
                value={calculoOrden.diluyenteActivo}
                onChange={(e) =>
                  update({ diluyente: e.target.value as VasopresoresData["diluyente"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="SSN 0.9%">SSN 0.9%</option>
                <option value="DAD 5%">DAD 5%</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Dosis (mcg/kg/min):
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.dosisMcgKgMin ?? "0.1"}
                onChange={(e) => update({ dosisMcgKgMin: e.target.value })}
                placeholder="0.05 - 2"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#0b2e59] mb-1">
                Velocidad Calc. (cc/hr):
              </label>
              <input
                type="text"
                readOnly
                value={calculoOrden.velocidadMlHr ? `${calculoOrden.velocidadMlHr}` : ""}
                placeholder="Auto"
                className="w-full bg-emerald-50 border-2 border-emerald-400 rounded-xl px-3 py-2 font-mono font-black text-center text-emerald-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Hora inicio:
              </label>
              <FormattedTimeInput
                mode="time"
                disabled={soloLectura}
                value={data.horaInicio ?? horaIngresoDefault}
                onValueChange={(val) => update({ horaInicio: val })}
                placeholder="hh:mm"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>
          </div>

          {/* TARJETA RESUMEN DE FÓRMULA CALCULADA POR PESO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-slate-300 rounded-xl p-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Fórmula Dilución Aplicada
              </span>
              <span className="text-xs font-black text-[#0b2e59] font-mono">
                {calculoOrden.mgTotales
                  ? `${calculoOrden.mgTotales} mg en ${calculoOrden.volumenTotalCc} cc`
                  : "Pendiente peso"}
              </span>
              {calculoOrden.ampollasRequeridas && (
                <span className="text-[10px] text-slate-600 block">
                  {calculoOrden.ampollasRequeridas}
                </span>
              )}
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Concentración / Velocidad
              </span>
              <span className="text-xs font-black text-emerald-800 font-mono">
                {calculoOrden.velocidadMlHr ? `${calculoOrden.velocidadMlHr} cc/hr` : "— cc/hr"}
              </span>
              <span className="text-[10px] text-slate-600 block font-mono">
                {calculoOrden.concentracionMcgMl
                  ? `Conc: ${calculoOrden.concentracionMcgMl} mcg/ml`
                  : ""}
              </span>
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                SC Estimada (4P+7)/(P+90)
              </span>
              <span className="text-xs font-black text-slate-900 font-mono">
                {calculoOrden.superficieCorporal ? `${calculoOrden.superficieCorporal} m²` : "—"}
              </span>
              <span className="text-[10px] text-slate-600 block">
                Base para Hidrocortisona
              </span>
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Hidrocortisona (100 mg/m²/día)
              </span>
              <span className="text-xs font-black text-[#c0392b] font-mono">
                {calculoOrden.hidrocortisonaDosisC6hMg
                  ? `${calculoOrden.hidrocortisonaDosisC6hMg} mg IV c/6h`
                  : "—"}
              </span>
              <span className="text-[10px] text-slate-600 block font-mono">
                {calculoOrden.hidrocortisonaDiaMg
                  ? `Total: ${calculoOrden.hidrocortisonaDiaMg} mg/día`
                  : ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-start gap-2.5 bg-white border border-slate-300 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={
                  Boolean(data.considerarHidrocortisona) ||
                  calculoOrden.requiereHidrocortisonaPorDosis
                }
                onChange={(e) => update({ considerarHidrocortisona: e.target.checked })}
                className="accent-[#0b2e59] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-black text-slate-900 block">
                  Incluir Hidrocortisona en Orden (100 mg/m²/día)
                </span>
                <span className="text-[11px] text-slate-600">
                  Choque refractario, sospecha insuficiencia suprarrenal o dosis &gt;0.25 mcg/kg/min
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 bg-white border border-slate-300 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={
                  Boolean(data.segundoVasoactivoAccesoCentral) ||
                  calculoOrden.requiereHidrocortisonaPorDosis
                }
                onChange={(e) =>
                  update({ segundoVasoactivoAccesoCentral: e.target.checked })
                }
                className="accent-[#c0392b] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-black text-slate-900 block">
                  Ordenar evaluación de 2º vasoactivo y acceso venoso central
                </span>
                <span className="text-[11px] text-slate-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#c0392b]" />
                  <span>Obligatorio si dosis supera 0.25 mcg/kg/min</span>
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Médico que ordena / Responsable:
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.responsable || ""}
                onChange={(e) => update({ responsable: e.target.value })}
                placeholder="Nombre y registro del médico..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Observaciones adicionales para enfermería / orden médica:
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.observaciones || ""}
                onChange={(e) => update({ observaciones: e.target.value })}
                placeholder="Titulación según metas de PAM/perfusión, cuidados de acceso..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>
          </div>

          {/* VISTA PREVIA FORMAL DE LA ORDEN MÉDICA GENERADA */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3 border border-slate-700 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                <span>Orden Médica Generada (Lista para Historia Clínica y Enfermería)</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copiarOrden}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? "Orden Copiada" : "Copiar Orden Médica"}</span>
                </button>
                <button
                  type="button"
                  onClick={descargarOrdenTxt}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Orden (.txt)</span>
                </button>
              </div>
            </div>

            <pre className="text-[11px] sm:text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-100 bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
              {soloLectura && data.ordenMedicaTexto
                ? data.ordenMedicaTexto
                : calculoOrden.ordenMedicaTexto}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

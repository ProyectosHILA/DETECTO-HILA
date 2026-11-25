import React from "react";
import { VasopresoresData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import { Activity, AlertTriangle, Syringe } from "lucide-react";

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
  const pesoActivoStr = (data.pesoKg !== undefined && data.pesoKg !== "" ? data.pesoKg : pesoIngresoDefault) || "";
  const pesoNum = parseFloat(pesoActivoStr.replace(",", "."));
  const pesoValido = !isNaN(pesoNum) && pesoNum > 0;

  // Método B: 0.3 * peso(kg) = mg en 500 cc
  const mgMetodoB = pesoValido ? (0.3 * pesoNum).toFixed(2) : "";
  // Método A: 0.1 mcg/kg/min = 0.3 * peso ml/hr
  const mlHrMetodoA = pesoValido ? (0.3 * pesoNum).toFixed(2) : "";

  const update = (patch: Partial<VasopresoresData>) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      ...patch,
    });
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

        {/* REGISTRO CLÍNICO DEL PACIENTE (INTERACTIVO) */}
        <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#0b2e59] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#c0392b]" />
              <span>Registro de Conducta e Infusión de Vasopresores en el Paciente</span>
            </h3>
            {pesoIngresoDefault && (
              <span className="text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full">
                Peso autollenado desde Fase 1: {pesoIngresoDefault} kg
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Estado de inicio de vasopresor:
              </label>
              <select
                disabled={soloLectura}
                value={data.iniciado || ""}
                onChange={(e) =>
                  update({ iniciado: e.target.value as VasopresoresData["iniciado"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#c0392b]"
              >
                <option value="">Seleccione conducta...</option>
                <option value="si">Sí — Vasopresor iniciado</option>
                <option value="pendiente_respuesta_bolo">
                  Evaluado — Respondió al 1er bolo / En observación
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#c0392b]"
              >
                <option value="">Seleccione medicamento...</option>
                <option value="adrenalina">Adrenalina (Ampolla 1 mg — 1ª línea)</option>
                <option value="noradrenalina">Noradrenalina (Ampolla 4 mg)</option>
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
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#c0392b]"
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
                value={data.metodo || ""}
                onChange={(e) =>
                  update({ metodo: e.target.value as VasopresoresData["metodo"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="">Seleccione...</option>
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
                value={data.diluyente || ""}
                onChange={(e) =>
                  update({ diluyente: e.target.value as VasopresoresData["diluyente"] })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              >
                <option value="">Seleccione...</option>
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
                value={data.dosisMcgKgMin || ""}
                onChange={(e) => update({ dosisMcgKgMin: e.target.value })}
                placeholder="0.05 - 2"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Velocidad (cc/hr):
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.velocidadMlHr || ""}
                onChange={(e) => update({ velocidadMlHr: e.target.value })}
                placeholder="cc/hr"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-[#0b2e59]"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-start gap-2.5 bg-white border border-slate-300 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(data.considerarHidrocortisona)}
                onChange={(e) => update({ considerarHidrocortisona: e.target.checked })}
                className="accent-[#0b2e59] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-black text-slate-900 block">
                  Hidrocortisona indicada (100 mg/m²/día)
                </span>
                <span className="text-[11px] text-slate-600">
                  Choque refractario a vasoactivos, sospecha de insuficiencia suprarrenal o dosis &gt;0.25 mcg/kg/min
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 bg-white border border-slate-300 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(data.segundoVasoactivoAccesoCentral)}
                onChange={(e) => update({ segundoVasoactivoAccesoCentral: e.target.checked })}
                className="accent-[#c0392b] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-black text-slate-900 block">
                  Considerado 2º vasoactivo y acceso venoso central
                </span>
                <span className="text-[11px] text-slate-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#c0392b]" />
                  <span>Obligatorio evaluar si dosis de vasoactivo supera 0.25 mcg/kg/min</span>
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Responsable / Médico o Enfermero:
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.responsable || ""}
                onChange={(e) => update({ responsable: e.target.value })}
                placeholder="Nombre del profesional..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                Observaciones de infusión / respuesta hemodinámica:
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={data.observaciones || ""}
                onChange={(e) => update({ observaciones: e.target.value })}
                placeholder="Respuesta clínica, titulación, vía periférica permeable..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium outline-none focus:ring-2 focus:ring-[#0b2e59]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

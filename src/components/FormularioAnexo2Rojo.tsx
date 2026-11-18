import React from "react";
import { Anexo2ChoqueData, LaboratoriosDOMData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";
import { CheckCircle2, FlaskConical } from "lucide-react";

interface FormularioAnexo2RojoProps {
  data: Anexo2ChoqueData;
  laboratorios?: LaboratoriosDOMData;
  onChange?: (updated: Anexo2ChoqueData) => void;
  soloLectura?: boolean;
}

export const FormularioAnexo2Rojo: React.FC<FormularioAnexo2RojoProps> = ({
  data,
  laboratorios = {} as LaboratoriosDOMData,
  onChange,
  soloLectura = false,
}) => {
  const update = (patch: Partial<Anexo2ChoqueData>) => {
    if (soloLectura || !onChange) return;
    onChange({ ...data, ...patch });
  };

  const updateUci = (field: keyof NonNullable<Anexo2ChoqueData["criteriosUci"]>, val: boolean) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      criteriosUci: { ...data.criteriosUci, [field]: val },
    });
  };

  const updateOrden = (field: keyof NonNullable<Anexo2ChoqueData["ordenesInmediatas"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      ordenesInmediatas: { ...data.ordenesInmediatas, [field]: val },
    });
  };

  const updateAtb = (field: keyof NonNullable<Anexo2ChoqueData["antibiotico"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      antibiotico: { ...data.antibiotico, [field]: val },
    });
  };

  const updateMon = (field: keyof NonNullable<Anexo2ChoqueData["monitoreo"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      monitoreo: { ...data.monitoreo, [field]: val },
    });
  };

  const uci = data.criteriosUci || {};
  const orden = data.ordenesInmediatas || {};
  const atb = data.antibiotico || {};
  const mon = data.monitoreo || {};

  return (
    <div className="bg-white border-2 border-[#b92b27] rounded-2xl shadow-xl overflow-hidden text-slate-900 font-sans text-xs select-text">
      {/* HEADER ROJO ANEXO 2 */}
      <div className="bg-[#b92b27] text-white px-4 py-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
          Anexo 2. LISTA DE CHEQUEO – ALERTA DE CHOQUE SÉPTICO/DOM
        </h2>
      </div>

      {/* IDENTIFICACIÓN BÁSICA DEL FORMULARIO */}
      <div className="bg-[#f4f4f4] border-b border-slate-400 px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
          <span>Paciente:</span>
          <input
            type="text"
            disabled={soloLectura}
            value={data.pacienteNombre || ""}
            onChange={(e) => update({ pacienteNombre: e.target.value })}
            className="flex-1 bg-white border-b border-slate-500 px-2 py-0.5 rounded outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span>Edad:</span>
          <input
            type="text"
            disabled={soloLectura}
            value={data.edadAnos || ""}
            onChange={(e) => update({ edadAnos: e.target.value })}
            className="w-12 bg-white border-b border-slate-500 px-1 py-0.5 text-center rounded outline-none"
          />
          <span>años</span>
          <input
            type="text"
            disabled={soloLectura}
            value={data.edadMeses || ""}
            onChange={(e) => update({ edadMeses: e.target.value })}
            className="w-12 bg-white border-b border-slate-500 px-1 py-0.5 text-center rounded outline-none"
          />
          <span>meses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Peso:</span>
          <input
            type="text"
            disabled={soloLectura}
            value={data.pesoKg || ""}
            onChange={(e) => update({ pesoKg: e.target.value })}
            className="w-14 bg-white border-b border-slate-500 px-1 py-0.5 text-center rounded outline-none"
          />
          <span>kg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Hora inicio:</span>
          <FormattedTimeInput
            mode="time"
            disabled={soloLectura}
            value={data.horaInicio || ""}
            onValueChange={(val) => update({ horaInicio: val })}
            placeholder="hh:mm"
            className="w-16 bg-white border-b border-slate-500 px-1 py-0.5 text-center font-mono rounded outline-none"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* CRITERIOS DE INGRESO A UCI */}
        <div className="border-2 border-[#b92b27] rounded-xl overflow-hidden">
          <div className="bg-[#b92b27] text-white px-3 py-1.5 font-black uppercase text-xs">
            CRITERIOS DE INGRESO A UCI (evaluar desde el inicio)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#b92b27]/40 bg-white">
            <div className="divide-y divide-[#b92b27]/30">
              <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.alteracionSensorio)}
                  onChange={(e) => updateUci("alteracionSensorio", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4"
                />
                <span className="font-semibold">Alteración del sensorio</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.hipotensionArterial)}
                  onChange={(e) => updateUci("hipotensionArterial", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4"
                />
                <span className="font-semibold">Hipotensión arterial (PAS o PAM &lt; -2DS para la edad)</span>
              </label>
              <label className="flex items-start gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.signosMalaPerfusion)}
                  onChange={(e) => updateUci("signosMalaPerfusion", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4 mt-0.5"
                />
                <span className="font-semibold">
                  Signos de mala perfusión: llenado capilar rápido o ≥3 seg, piel moteada, rubicundez, piel fría, pulsos débiles o saltones
                </span>
              </label>
            </div>

            <div className="divide-y divide-[#b92b27]/30">
              <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.sobrecargaVolumen)}
                  onChange={(e) => updateUci("sobrecargaVolumen", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4"
                />
                <span className="font-semibold">Sobrecarga de volumen</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.disfuncionMiocardica)}
                  onChange={(e) => updateUci("disfuncionMiocardica", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4"
                />
                <span className="font-semibold">Disfunción miocárdica</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(uci.dificultadRespiratoria)}
                  onChange={(e) => updateUci("dificultadRespiratoria", e.target.checked)}
                  className="accent-[#b92b27] w-4 h-4"
                />
                <span className="font-semibold">Dificultad respiratoria</span>
              </label>
            </div>
          </div>
        </div>

        {/* A. ÓRDENES INMEDIATAS — PRIMEROS 45 MINUTOS */}
        <div className="border-2 border-[#0b2e59] rounded-xl overflow-hidden">
          <div className="bg-[#0b2e59] text-white px-3 py-1.5 font-black uppercase text-xs">
            A. ÓRDENES INMEDIATAS — PRIMEROS 45 MINUTOS
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <div className="p-2.5 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-black text-[#0b2e59] cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(orden.oxigenoFio2100)}
                  onChange={(e) => updateOrden("oxigenoFio2100", e.target.checked)}
                  className="accent-[#0b2e59] w-4 h-4"
                />
                <span>A1. Soporte respiratorio:</span>
              </label>
              <span className="font-semibold">Oxígeno FiO2 100%</span>
            </div>

            <div className="p-2.5 space-y-1.5">
              <span className="font-black text-[#0b2e59] block">A2. Reanimación líquidos</span>
              <div className="flex flex-wrap items-center gap-3 pl-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(orden.boloIv10)}
                    onChange={(e) => updateOrden("boloIv10", e.target.checked)}
                    className="accent-[#0b2e59] w-4 h-4"
                  />
                  <span>■ Bolo IV: 10 ml/kg en 5-10 min</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="anexo2TipoLiquido"
                    disabled={soloLectura}
                    checked={orden.tipoLiquido === "lactato_ringer"}
                    onChange={() => updateOrden("tipoLiquido", "lactato_ringer")}
                    className="accent-[#0b2e59]"
                  />
                  <span>Lactato de Ringer</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="anexo2TipoLiquido"
                    disabled={soloLectura}
                    checked={orden.tipoLiquido === "ssn_09"}
                    onChange={() => updateOrden("tipoLiquido", "ssn_09")}
                    className="accent-[#0b2e59]"
                  />
                  <span>Solución salina 0.9%</span>
                </label>
              </div>

              <label className="flex items-center gap-2 pl-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(orden.canalizarCateter)}
                  onChange={(e) => updateOrden("canalizarCateter", e.target.checked)}
                  className="accent-[#0b2e59] w-4 h-4"
                />
                <span>■ Canalizar si no tiene acceso venoso — si tiene catéter implantable: activar catéter implantable</span>
              </label>
            </div>

            {/* A3 HEMOCULTIVOS SINCRONIZADO DESDE LABORATORIOS (SOLO LECTURA) */}
            <div className="p-2.5 bg-sky-50/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0b2e59]">A3. Hemocultivos:</span>
                <span className="text-slate-700 font-medium">
                  Diligenciado en módulo <strong>Resultados de Laboratorio</strong>
                </span>
              </div>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  laboratorios.hemocultivosA3?.tomado
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {laboratorios.hemocultivosA3?.tomado
                  ? `✓ Tomado ${laboratorios.hemocultivosA3.fechaHora ? `(${laboratorios.hemocultivosA3.fechaHora})` : ""}`
                  : "Pendiente en Laboratorios"}
              </span>
            </div>
          </div>
        </div>

        {/* LABORATORIOS DOM (SINCRONIZADO DESDE MÓDULO DE LABORATORIOS - SOLO LECTURA) */}
        <div className="border-2 border-[#007b8f] rounded-xl overflow-hidden">
          <div className="bg-[#007b8f] text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-black uppercase text-xs">
              LABORATORIOS DOM (procesar como URGENTES — resultados en &lt; 45 min)
            </span>
            <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              Autocompletado desde Resultados de Laboratorio (Solo lectura)
            </span>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b4d6c] text-white font-bold divide-x divide-white/20">
                <th className="p-1.5 text-left pl-3 w-28">Sistema</th>
                <th className="p-1.5 text-left pl-3">Laboratorios</th>
                <th className="p-1.5 w-28 text-center">Hora</th>
                <th className="p-1.5 w-36 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#007b8f]/30 bg-slate-50/60">
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Cardiovascular</td>
                <td className="p-2 font-semibold">
                  {laboratorios.lactatoSerico?.checked ? "☑" : "☐"} Lactato sérico
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.lactatoSerico?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {laboratorios.lactatoSerico?.valor || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Respiratorio</td>
                <td className="p-2 font-semibold">
                  {laboratorios.gasesPaFiO2?.checked ? "☑" : "☐"} Gases arteriales (PaFiO₂){" "}
                  <span className="mx-1">ó</span>{" "}
                  {laboratorios.spFiO2?.checked ? "☑" : "☐"} SaFiO₂ (SpFiO₂)
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.gasesPaFiO2?.fechaHora || laboratorios.spFiO2?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {[
                    laboratorios.gasesPaFiO2?.resultado ? `PaFi: ${laboratorios.gasesPaFiO2.resultado}` : "",
                    laboratorios.spFiO2?.resultado ? `SaFi: ${laboratorios.spFiO2.resultado}` : "",
                  ]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Renal</td>
                <td className="p-2 font-semibold">
                  {laboratorios.creatinina?.checked ? "☑" : "☐"} Creatinina &nbsp;&nbsp;
                  {laboratorios.monitoreoGastoUrinario?.checked ? "☑" : "☐"} Monitoreo de gasto urinario
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.creatinina?.fechaHora || laboratorios.monitoreoGastoUrinario?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {[
                    laboratorios.creatinina?.valor ? `Cr: ${laboratorios.creatinina.valor}` : "",
                    laboratorios.monitoreoGastoUrinario?.valor ? `GU: ${laboratorios.monitoreoGastoUrinario.valor}` : "",
                  ]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Hematológico</td>
                <td className="p-2 font-semibold space-y-0.5">
                  <div>{laboratorios.hemograma?.checked ? "☑" : "☐"} Hemograma</div>
                  <div>{laboratorios.tpInr?.checked ? "☑" : "☐"} TP/INR</div>
                  <div>
                    {laboratorios.fibrinogeno?.checked ? "☑" : "☐"} Fibrinógeno &nbsp;&nbsp;
                    {laboratorios.dimeroD?.checked ? "☑" : "☐"} Dímero D
                  </div>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono text-[11px]">
                  {laboratorios.hemograma?.fechaHora || laboratorios.tpInr?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c] text-[11px]">
                  {[
                    laboratorios.hemograma?.valor ? `Hb/Plq: ${laboratorios.hemograma.valor}` : "",
                    laboratorios.tpInr?.valor ? `INR: ${laboratorios.tpInr.valor}` : "",
                    laboratorios.fibrinogeno?.valor ? `Fib: ${laboratorios.fibrinogeno.valor}` : "",
                    laboratorios.dimeroD?.valor ? `DD: ${laboratorios.dimeroD.valor}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Hepático</td>
                <td className="p-2 font-semibold">
                  {laboratorios.astAlt?.checked ? "☑" : "☐"} AST/ALT &nbsp;&nbsp;
                  {laboratorios.bilirrubina?.checked ? "☑" : "☐"} Bilirrubina total/directa
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.astAlt?.fechaHora || laboratorios.bilirrubina?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {[
                    laboratorios.astAlt?.valor ? `AST/ALT: ${laboratorios.astAlt.valor}` : "",
                    laboratorios.bilirrubina?.valor ? `Bili: ${laboratorios.bilirrubina.valor}` : "",
                  ]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Metabólico</td>
                <td className="p-2 font-semibold">
                  {laboratorios.glucosa?.checked ? "☑" : "☐"} Glucosa &nbsp;&nbsp;
                  {laboratorios.electrolitos?.checked ? "☑" : "☐"} Electrolitos (calcio, sodio, potasio, magnesio)
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.glucosa?.fechaHora || laboratorios.electrolitos?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {[
                    laboratorios.glucosa?.valor ? `Glu: ${laboratorios.glucosa.valor}` : "",
                    laboratorios.electrolitos?.valor ? `Elec: ${laboratorios.electrolitos.valor}` : "",
                  ]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-black text-[#074c5d] bg-[#e9f7f9] border-r border-[#007b8f]/30">Otros</td>
                <td className="p-2 font-semibold">
                  {laboratorios.pcr?.checked ? "☑" : "☐"} Proteína C reactiva
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-mono">
                  {laboratorios.pcr?.fechaHora || "—"}
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20 text-center font-bold text-[#0b4d6c]">
                  {laboratorios.pcr?.valor || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* B. TERAPIA ANTIBIÓTICA — META ≤ 45 MINUTOS */}
        <div className="border-2 border-[#b92b27] rounded-xl overflow-hidden">
          <div className="bg-[#b92b27] text-white px-3 py-1.5 font-black uppercase text-xs">
            B. TERAPIA ANTIBIÓTICA — META ≤ 45 MINUTOS
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-black text-slate-900 bg-rose-50/40">
                1. MEROPENEM (primera línea)
              </div>
              <div className="md:col-span-2 p-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.meropenem)}
                    onChange={(e) => updateAtb("meropenem", e.target.checked)}
                    className="accent-[#b92b27] w-4 h-4"
                  />
                  <span>Meropenem 40 mg/kg/dosis IV c/8h · Dosis máxima: 2g</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-slate-800 bg-amber-50/50">
                ■ Si Meropenem NO disponible (alternativa transitoria)
              </div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.cefepime)}
                    onChange={(e) => updateAtb("cefepime", e.target.checked)}
                    className="accent-[#b92b27] w-4 h-4"
                  />
                  <span>Cefepime 50 mg/kg IV (Máx. 2g) o</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.pipTazo)}
                    onChange={(e) => updateAtb("pipTazo", e.target.checked)}
                    className="accent-[#b92b27] w-4 h-4"
                  />
                  <span>Pip/Tazo 100 mg/kg IV (según disponibilidad) (Máx. 4gr) → Escalar a Meropenem cuando esté disponible</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-black text-slate-900 bg-rose-50/40">
                2. VANCOMICINA (siempre)
              </div>
              <div className="md:col-span-2 p-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.vancomicina)}
                    onChange={(e) => updateAtb("vancomicina", e.target.checked)}
                    className="accent-[#b92b27] w-4 h-4"
                  />
                  <span>Vancomicina 15 mg/kg/dosis IV c/6h (Máx. 500 mg)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-slate-800 bg-slate-50">
                Registro administración
              </div>
              <div className="md:col-span-2 p-2.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">Meropenem/Cefepime/Pip-Tazo:</span>
                  <span>Hora:</span>
                  <FormattedTimeInput
                    mode="time"
                    disabled={soloLectura}
                    value={atb.meropenemHora || ""}
                    onValueChange={(val) => updateAtb("meropenemHora", val)}
                    placeholder="hh:mm"
                    className="w-16 bg-slate-50 border border-slate-300 px-1.5 py-0.5 text-center font-mono rounded"
                  />
                  <span>Enfermero/a:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={atb.meropenemEnfermero || ""}
                    onChange={(e) => updateAtb("meropenemEnfermero", e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-[140px] bg-slate-50 border border-slate-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">Vancomicina:</span>
                  <span>Hora:</span>
                  <FormattedTimeInput
                    mode="time"
                    disabled={soloLectura}
                    value={atb.vancomicinaHora || ""}
                    onValueChange={(val) => updateAtb("vancomicinaHora", val)}
                    placeholder="hh:mm"
                    className="w-16 bg-slate-50 border border-slate-300 px-1.5 py-0.5 text-center font-mono rounded"
                  />
                  <span>Enfermero/a:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={atb.vancomicinaEnfermero || ""}
                    onChange={(e) => updateAtb("vancomicinaEnfermero", e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-[140px] bg-slate-50 border border-slate-300 px-2 py-0.5 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* C. MONITOREO Y REEVALUACIÓN */}
        <div className="border-2 border-[#0b2e59] rounded-xl overflow-hidden">
          <div className="bg-[#0b2e59] text-white px-3 py-1.5 font-black uppercase text-xs">
            C. MONITOREO Y REEVALUACIÓN
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-[#0b2e59]">C1. Monitoreo continuo signos vitales</div>
              <div className="md:col-span-2 p-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(mon.monitorizacionContinua)}
                    onChange={(e) => updateMon("monitorizacionContinua", e.target.checked)}
                    className="accent-[#0b2e59] w-4 h-4"
                  />
                  <span>Monitorización continua iniciada</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-[#0b2e59]">
                C2. Respuesta al 1er bolo (evaluar a los 10 min)
              </div>
              <div className="md:col-span-2 p-2.5 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="anexo2RespuestaBolo"
                    disabled={soloLectura}
                    checked={mon.respuestaBolo === "si_mejoria"}
                    onChange={() => updateMon("respuestaBolo", "si_mejoria")}
                    className="accent-[#0b2e59]"
                  />
                  <span>SÍ hay mejoría hemodinámica → Continuar monitoreo</span>
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="anexo2RespuestaBolo"
                      disabled={soloLectura}
                      checked={mon.respuestaBolo === "no_mejoria"}
                      onChange={() => updateMon("respuestaBolo", "no_mejoria")}
                      className="accent-[#0b2e59]"
                    />
                    <span>NO hay mejoría:</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3 pl-5">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(mon.segundoBolo)}
                        onChange={(e) => updateMon("segundoBolo", e.target.checked)}
                        className="accent-[#0b2e59]"
                      />
                      <span>2° bolo líquidos 10 ml/kg (máximo 2 bolos)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(mon.vasoactivosPeriferica)}
                        onChange={(e) => updateMon("vasoactivosPeriferica", e.target.checked)}
                        className="accent-[#0b2e59]"
                      />
                      <span>Inicio TEMPRANO de vasoactivos por vena periférica</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(mon.considerarHidrocortisona)}
                        onChange={(e) => updateMon("considerarHidrocortisona", e.target.checked)}
                        className="accent-[#0b2e59]"
                      />
                      <span>Considerar hidrocortisona</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-[#0b2e59]">C3. Manejo adicional</div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(mon.insuficienciaSuprarrenal)}
                    onChange={(e) => updateMon("insuficienciaSuprarrenal", e.target.checked)}
                    className="accent-[#0b2e59]"
                  />
                  <span>Evaluar insuficiencia suprarrenal (esteroides recientes + hipoglicemia + compromiso CV)</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(mon.corregirHipoglicemia)}
                      onChange={(e) => updateMon("corregirHipoglicemia", e.target.checked)}
                      className="accent-[#0b2e59]"
                    />
                    <span>Corregir hipoglicemia</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(mon.corregirHipocalcemia)}
                      onChange={(e) => updateMon("corregirHipocalcemia", e.target.checked)}
                      className="accent-[#0b2e59]"
                    />
                    <span>Corregir hipocalcemia</span>
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(mon.considerarIntubacion)}
                    onChange={(e) => updateMon("considerarIntubacion", e.target.checked)}
                    className="accent-[#0b2e59]"
                  />
                  <span>Considerar intubación / VM no invasiva según compromiso respiratorio o del sensorio</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-bold text-[#0b2e59]">C4. UCI</div>
              <div className="md:col-span-2 p-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(mon.notificarUci)}
                    onChange={(e) => updateMon("notificarUci", e.target.checked)}
                    className="accent-[#b92b27] w-4 h-4"
                  />
                  <span>Notificar UCI Según criterios</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#0b2e59] text-white px-4 py-2 text-[11px] font-bold flex items-center justify-between">
        <span>DETECTO© • Detección Temprana de Sepsis en Cáncer y Tratamiento Dirigido</span>
        <span className="font-black text-xs bg-white text-[#0b2e59] px-2 rounded font-mono">11</span>
      </div>
    </div>
  );
};

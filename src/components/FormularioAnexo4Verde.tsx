import React from "react";
import { Anexo4BajaProbabilidadData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";

interface FormularioAnexo4VerdeProps {
  data: Anexo4BajaProbabilidadData;
  onChange?: (updated: Anexo4BajaProbabilidadData) => void;
  soloLectura?: boolean;
}

export const FormularioAnexo4Verde: React.FC<FormularioAnexo4VerdeProps> = ({
  data,
  onChange,
  soloLectura = false,
}) => {
  const update = (patch: Partial<Anexo4BajaProbabilidadData>) => {
    if (soloLectura || !onChange) return;
    onChange({ ...data, ...patch });
  };

  const updateAtb = (field: keyof NonNullable<Anexo4BajaProbabilidadData["antibiotico"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      antibiotico: { ...data.antibiotico, [field]: val },
    });
  };

  const updateVancoInd = (
    field: keyof NonNullable<NonNullable<Anexo4BajaProbabilidadData["antibiotico"]>["vancomicinaIndicaciones"]>,
    val: boolean
  ) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      antibiotico: {
        ...data.antibiotico,
        vancomicinaIndicaciones: {
          ...data.antibiotico?.vancomicinaIndicaciones,
          [field]: val,
        },
      },
    });
  };

  const updateParaclinicos = (
    field: keyof NonNullable<Anexo4BajaProbabilidadData["paraclinicosIniciales"]>,
    val: boolean
  ) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      paraclinicosIniciales: { ...data.paraclinicosIniciales, [field]: val },
    });
  };

  const updateImagenes = (field: keyof NonNullable<Anexo4BajaProbabilidadData["imagenes"]>, val: boolean) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      imagenes: { ...data.imagenes, [field]: val },
    });
  };

  const updateMon = (val: "deterioro_activar" | "no_deterioro") => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      monitoreo: { resultado: val },
    });
  };

  const atb = data.antibiotico || {};
  const vanco = atb.vancomicinaIndicaciones || {};
  const para = data.paraclinicosIniciales || {};
  const img = data.imagenes || {};
  const mon = data.monitoreo || {};

  return (
    <div className="bg-white border-2 border-[#2e7d19] rounded-2xl shadow-xl overflow-hidden text-slate-900 font-sans text-xs select-text">
      {/* HEADER VERDE ANEXO 4 */}
      <div className="bg-[#2e7d19] text-white px-4 py-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
          Anexo 4. LISTA DE CHEQUEO – BAJA PROBABILIDAD DE SEPSIS
        </h2>
      </div>

      {/* IDENTIFICACIÓN */}
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
        {/* BANNER RECORDATORIO MAMUTTS */}
        <div className="border-2 border-[#2e7d19] bg-[#eef7eb] px-3 py-2 rounded-lg font-bold text-slate-900">
          ■ Aplicar Algoritmo de Neutropenia Febril <span className="text-[#007b8f]">MAMUTTS</span> ■ No retrasar inicio de antibióticos por toma de paraclínicos
        </div>

        {/* A1. TERAPIA ANTIBIÓTICA */}
        <div className="border-2 border-[#0b2e59] rounded-xl overflow-hidden">
          <div className="bg-[#2e7d19] text-white px-3 py-1.5 font-black uppercase text-xs">
            A1. TERAPIA ANTIBIÓTICA — META ≤ 60 MINUTOS
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-black text-slate-900 bg-emerald-50/50">
                Escenario A Fiebre + Estabilidad clínica
              </div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.escenarioA_cefepime)}
                    onChange={(e) => updateAtb("escenarioA_cefepime", e.target.checked)}
                    className="accent-[#2e7d19] w-4 h-4"
                  />
                  <span>CEFEPIME 50 mg/kg/dosis IV c/8h (Máx. 2gr).</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <span>Hora:</span>
                  <FormattedTimeInput
                    mode="time"
                    disabled={soloLectura}
                    value={atb.escenarioA_hora || ""}
                    onValueChange={(val) => updateAtb("escenarioA_hora", val)}
                    placeholder="hh:mm"
                    className="w-16 bg-slate-50 border border-slate-300 px-1.5 py-0.5 font-mono text-center rounded"
                  />
                  <span>Enfermero/a:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={atb.escenarioA_enfermero || ""}
                    onChange={(e) => updateAtb("escenarioA_enfermero", e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-[140px] bg-slate-50 border border-slate-300 px-2 py-0.5 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-black text-slate-900 bg-emerald-50/50">
                Escenario B Mucositis ≥grado 3 o compromiso GI
              </div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.escenarioB_piptazo)}
                    onChange={(e) => updateAtb("escenarioB_piptazo", e.target.checked)}
                    className="accent-[#2e7d19] w-4 h-4"
                  />
                  <span>PIPERACILINA/TAZOBACTAM 100 mg/kg/dosis IV c/6h (Máx. 4gr)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <span>Hora:</span>
                  <FormattedTimeInput
                    mode="time"
                    disabled={soloLectura}
                    value={atb.escenarioB_hora || ""}
                    onValueChange={(val) => updateAtb("escenarioB_hora", val)}
                    placeholder="hh:mm"
                    className="w-16 bg-slate-50 border border-slate-300 px-1.5 py-0.5 font-mono text-center rounded"
                  />
                  <span>Enfermero/a:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={atb.escenarioB_enfermero || ""}
                    onChange={(e) => updateAtb("escenarioB_enfermero", e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-[140px] bg-slate-50 border border-slate-300 px-2 py-0.5 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0b2e59] text-white px-3 py-1.5 font-black uppercase text-[11px]">
              + VANCOMICINA 15 mg/kg/dosis IV c/6h (máx. 500 mg/dosis) — SOLO SI TIENE INDICACIÓN
            </div>

            <div className="divide-y divide-slate-200">
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(vanco.alertaChoque)}
                  onChange={(e) => updateVancoInd("alertaChoque", e.target.checked)}
                  className="accent-[#0b2e59]"
                />
                <span>Alerta de choque séptico/DOM o choque diagnosticado</span>
              </label>
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(vanco.bacteriemiaCocos)}
                  onChange={(e) => updateVancoInd("bacteriemiaCocos", e.target.checked)}
                  className="accent-[#0b2e59]"
                />
                <span>Bacteriemia por cocos gram positivos</span>
              </label>
              <div className="flex flex-wrap gap-6 p-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(vanco.infeccionOsteoarticular)}
                    onChange={(e) => updateVancoInd("infeccionOsteoarticular", e.target.checked)}
                    className="accent-[#0b2e59]"
                  />
                  <span>Infección osteoarticular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(vanco.infeccionPiel)}
                    onChange={(e) => updateVancoInd("infeccionPiel", e.target.checked)}
                    className="accent-[#0b2e59]"
                  />
                  <span>Infección de piel</span>
                </label>
              </div>
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(vanco.neumoniaComplicada)}
                  onChange={(e) => updateVancoInd("neumoniaComplicada", e.target.checked)}
                  className="accent-[#0b2e59]"
                />
                <span>Neumonía lobar complicada</span>
              </label>
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(vanco.sospechaCateter)}
                  onChange={(e) => updateVancoInd("sospechaCateter", e.target.checked)}
                  className="accent-[#0b2e59]"
                />
                <span>Sospecha de infección asociada a catéter</span>
              </label>
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(vanco.sospechaCocos)}
                  onChange={(e) => updateVancoInd("sospechaCocos", e.target.checked)}
                  className="accent-[#0b2e59]"
                />
                <span>Sospecha de infección por cocos gram positivos</span>
              </label>
            </div>
          </div>
        </div>

        {/* A2. PARACLÍNICOS INICIALES */}
        <div className="border-2 border-[#2e7d19] rounded-xl overflow-hidden">
          <div className="bg-[#2e7d19] text-white px-3 py-1.5 font-black uppercase text-xs">
            A2. PARACLÍNICOS INICIALES
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(para.hemocultivos2Sets)}
                onChange={(e) => updateParaclinicos("hemocultivos2Sets", e.target.checked)}
                className="accent-[#2e7d19]"
              />
              <span>2 sets de hemocultivos (1 periférico + 1 de línea central si tiene CVC o PICC)</span>
            </label>
            <div className="flex flex-wrap gap-6 p-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.hemograma)}
                  onChange={(e) => updateParaclinicos("hemograma", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>Hemograma</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.pcr)}
                  onChange={(e) => updateParaclinicos("pcr", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>Proteína C reactiva (PCR)</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-5 p-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.lactatoSerico)}
                  onChange={(e) => updateParaclinicos("lactatoSerico", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>Lactato sérico</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.bunCreatinina)}
                  onChange={(e) => updateParaclinicos("bunCreatinina", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>BUN, creatinina</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.electrolitos)}
                  onChange={(e) => updateParaclinicos("electrolitos", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>Electrolitos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(para.astAlt)}
                  onChange={(e) => updateParaclinicos("astAlt", e.target.checked)}
                  className="accent-[#2e7d19]"
                />
                <span>AST/ALT</span>
              </label>
            </div>
            <label className="flex items-center gap-2 p-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(para.procalcitonina)}
                onChange={(e) => updateParaclinicos("procalcitonina", e.target.checked)}
                className="accent-[#2e7d19]"
              />
              <span>Procalcitonina (si disponible según protocolo institucional)</span>
            </label>
            <label className="flex items-start gap-2 p-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(para.otrosSegunFoco)}
                onChange={(e) => updateParaclinicos("otrosSegunFoco", e.target.checked)}
                className="accent-[#2e7d19] mt-0.5"
              />
              <span>
                Otros según foco: uroanálisis/urocultivo • coprocultivo/toxina C. difficile • RCP virus respiratorios • Punción lumbar si síntomas neurológicos
              </span>
            </label>
          </div>
        </div>

        {/* B. IMÁGENES */}
        <div className="border-2 border-[#2e7d19] rounded-xl overflow-hidden">
          <div className="bg-[#2e7d19] text-white px-3 py-1.5 font-black uppercase text-xs">
            B. IMÁGENES (según indicación clínica)
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            <label className="flex items-center gap-2 p-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(img.rxTorax)}
                onChange={(e) => updateImagenes("rxTorax", e.target.checked)}
                className="accent-[#2e7d19]"
              />
              <span>Radiografía de tórax — si hay signos o síntomas respiratorios bajos</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(img.ecografiaAbdominal)}
                onChange={(e) => updateImagenes("ecografiaAbdominal", e.target.checked)}
                className="accent-[#2e7d19]"
              />
              <span>Ecografía abdominal — si sospecha de enterocolitis neutropénica (dolor abdominal, diarrea o sangrado GI)</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(img.rnmCerebral)}
                onChange={(e) => updateImagenes("rnmCerebral", e.target.checked)}
                className="accent-[#2e7d19]"
              />
              <span>RNM cerebral contrastada — si sospecha de neuroinfección (preferir gadolinio; si no disponible: TAC con contraste)</span>
            </label>
          </div>
        </div>

        {/* C. MONITOREO — Mínimo 1 hora */}
        <div className="border-2 border-[#2e7d19] rounded-xl overflow-hidden">
          <div className="bg-[#2e7d19] text-white px-3 py-1.5 font-black uppercase text-xs">
            C. MONITOREO — Mínimo 1 hora
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-white">
            <div className="p-3 flex items-center font-semibold">
              <span>Continuar valoración según algoritmo <span className="text-[#007b8f] font-black">MAMUTTS</span></span>
            </div>
            <div className="p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#b92b27]">
                <input
                  type="radio"
                  name="anexo4Mon"
                  disabled={soloLectura}
                  checked={mon.resultado === "deterioro_activar"}
                  onChange={() => updateMon("deterioro_activar")}
                  className="accent-[#b92b27]"
                />
                <span>■ SÍ hay deterioro → Activar equipo de sepsis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#007b8f]">
                <input
                  type="radio"
                  name="anexo4Mon"
                  disabled={soloLectura}
                  checked={mon.resultado === "no_deterioro"}
                  onChange={() => updateMon("no_deterioro")}
                  className="accent-[#007b8f]"
                />
                <span>■ NO → Continuar observación protocolo MAMUTTS</span>
              </label>
            </div>
          </div>
          <div className="bg-[#eef7eb] border-t border-[#2e7d19] px-3 py-2 font-black text-[#1d560e]">
            NOTA: Mantener vigilancia estrecha. Ante cualquier deterioro, activar equipo de sepsis.
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#0b2e59] text-white px-4 py-2 text-[11px] font-bold flex items-center justify-between">
        <span>DETECTO© • Detección Temprana de Sepsis en Cáncer y Tratamiento Dirigido</span>
        <span className="font-black text-xs bg-white text-[#0b2e59] px-2 rounded font-mono">13</span>
      </div>
    </div>
  );
};

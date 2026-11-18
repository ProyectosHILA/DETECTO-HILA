import React from "react";
import { Anexo3AlertaSepsisData } from "../types";
import { FormattedTimeInput } from "./FormattedTimeInput";

interface FormularioAnexo3AmarilloProps {
  data: Anexo3AlertaSepsisData;
  onChange?: (updated: Anexo3AlertaSepsisData) => void;
  soloLectura?: boolean;
}

export const FormularioAnexo3Amarillo: React.FC<FormularioAnexo3AmarilloProps> = ({
  data,
  onChange,
  soloLectura = false,
}) => {
  const update = (patch: Partial<Anexo3AlertaSepsisData>) => {
    if (soloLectura || !onChange) return;
    onChange({ ...data, ...patch });
  };

  const updateOrden = (field: keyof NonNullable<Anexo3AlertaSepsisData["ordenesInmediatas"]>, val: boolean) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      ordenesInmediatas: { ...data.ordenesInmediatas, [field]: val },
    });
  };

  const updateAtb = (field: keyof NonNullable<Anexo3AlertaSepsisData["antibiotico"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      antibiotico: { ...data.antibiotico, [field]: val },
    });
  };

  const updateVancoInd = (
    field: keyof NonNullable<NonNullable<Anexo3AlertaSepsisData["antibiotico"]>["vancomicinaIndicaciones"]>,
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

  const updateReev = (field: keyof NonNullable<Anexo3AlertaSepsisData["reevaluacionHora"]>, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      reevaluacionHora: { ...data.reevaluacionHora, [field]: val },
    });
  };

  const updateNotif = (field: keyof NonNullable<Anexo3AlertaSepsisData["notificacionesUcip"]>, val: boolean) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      notificacionesUcip: { ...data.notificacionesUcip, [field]: val },
    });
  };

  const orden = data.ordenesInmediatas || {};
  const atb = data.antibiotico || {};
  const vanco = atb.vancomicinaIndicaciones || {};
  const reev = data.reevaluacionHora || {};
  const notif = data.notificacionesUcip || {};

  return (
    <div className="bg-white border-2 border-[#f4b400] rounded-2xl shadow-xl overflow-hidden text-slate-900 font-sans text-xs select-text">
      {/* HEADER AMARILLO ANEXO 3 */}
      <div className="bg-[#f4b400] text-slate-950 px-4 py-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
          Anexo 3. LISTA DE CHEQUEO – ALERTA DE SEPSIS (SIN DOM)
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
        {/* A. ÓRDENES INMEDIATAS */}
        <div className="border-2 border-[#a86400] rounded-xl overflow-hidden">
          <div className="bg-[#a86400] text-white px-3 py-1.5 font-black uppercase text-xs">
            A. ÓRDENES INMEDIATAS
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-amber-50/40 font-semibold">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(orden.identificarFoco)}
                onChange={(e) => updateOrden("identificarFoco", e.target.checked)}
                className="accent-[#a86400] w-4 h-4"
              />
              <span>Identificar foco clínico de infección activo</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-amber-50/40 font-semibold">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(orden.clasificarRiesgoMamutts)}
                onChange={(e) => updateOrden("clasificarRiesgoMamutts", e.target.checked)}
                className="accent-[#a86400] w-4 h-4"
              />
              <span>Clasificar al paciente como riesgo alto o estándar según protocolo MAMUTTS</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-amber-50/40 font-semibold">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(orden.hemocultivos)}
                onChange={(e) => updateOrden("hemocultivos", e.target.checked)}
                className="accent-[#a86400] w-4 h-4"
              />
              <span>Hemocultivos (periférico + central si tiene CVC o PICC) y otros estudios microbiológicos según foco</span>
            </label>
            <label className="flex items-start gap-2 p-2.5 cursor-pointer hover:bg-amber-50/40 font-semibold">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={Boolean(orden.laboratoriosDom)}
                onChange={(e) => updateOrden("laboratoriosDom", e.target.checked)}
                className="accent-[#a86400] w-4 h-4 mt-0.5"
              />
              <span>
                Laboratorios DOM (Resultado en ≤ 2 horas): <strong>Lactato</strong>, hemograma, TP/INR, Fibrinógeno, Dímero D, PCR, creatinina, AST/ALT, bilirrubina total y directa, electrolitos (calcio, sodio, potasio, magnesio), gases, glucosa.
              </span>
            </label>
          </div>
        </div>

        {/* B. TERAPIA ANTIBIÓTICA — META ≤ 60 MINUTOS */}
        <div className="border-2 border-[#0b2e59] rounded-xl overflow-hidden">
          <div className="bg-[#a86400] text-white px-3 py-1.5 font-black uppercase text-xs">
            B. TERAPIA ANTIBIÓTICA — META ≤ 60 MINUTOS
          </div>
          <div className="divide-y divide-slate-300 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300">
              <div className="p-2.5 font-black text-slate-900 bg-amber-50/60">
                Escenario A<br />Fiebre + Estabilidad clínica
              </div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.escenarioA_cefepime)}
                    onChange={(e) => updateAtb("escenarioA_cefepime", e.target.checked)}
                    className="accent-[#0b2e59] w-4 h-4"
                  />
                  <span>CEFEPIME 50 mg/kg/dosis IV c/8h (Máx. 2g)</span>
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
              <div className="p-2.5 font-black text-slate-900 bg-amber-50/60">
                Escenario B<br />Mucositis ≥grado 3 o compromiso GI
              </div>
              <div className="md:col-span-2 p-2.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean(atb.escenarioB_piptazo)}
                    onChange={(e) => updateAtb("escenarioB_piptazo", e.target.checked)}
                    className="accent-[#0b2e59] w-4 h-4"
                  />
                  <span>PIPERACILINA/TAZOBACTAM 100 mg/kg/dosis IV c/6h (Máx. 4g)</span>
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
              INDICACIONES DE USO DE VANCOMICINA 15 mg/kg/dosis IV c/6h (Máx. 500 mg/dosis):
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

        {/* C. REEVALUACIÓN A LA HORA */}
        <div className="border-2 border-[#a86400] rounded-xl overflow-hidden">
          <div className="bg-[#a86400] text-white px-3 py-1.5 font-black uppercase text-xs">
            C. REEVALUACIÓN A LA HORA — ¿Presenta alguno de estos criterios?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-white">
            <div className="p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(reev.hipotension)}
                  onChange={(e) => updateReev("hipotension", e.target.checked)}
                  className="accent-[#a86400]"
                />
                <span>Hipotensión (PAS o PAM &lt; -2DS) · ■ Lactato &gt;2 mmol/L</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(reev.malaPerfusion)}
                  onChange={(e) => updateReev("malaPerfusion", e.target.checked)}
                  className="accent-[#a86400] mt-0.5"
                />
                <span>Mala perfusión (llenado capilar rápido o ≥3 seg, piel moteada, piel fría, pulsos anormales)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(reev.compromisoOrganos)}
                  onChange={(e) => updateReev("compromisoOrganos", e.target.checked)}
                  className="accent-[#a86400]"
                />
                <span>Compromiso de ≥ 2 órganos</span>
              </label>
            </div>

            <div className="p-3 space-y-2.5 flex flex-col justify-center">
              <label className="flex items-start gap-2 cursor-pointer font-bold text-[#a83800]">
                <input
                  type="radio"
                  name="anexo3Reeval"
                  disabled={soloLectura}
                  checked={reev.resultado === "reclasificar_choque"}
                  onChange={() => updateReev("resultado", "reclasificar_choque")}
                  className="accent-[#a83800] mt-0.5"
                />
                <span>SÍ → Reclasificar como Alerta de CHOQUE SÉPTICO/DOM → Aplicar Lista de Chequeo 2 (Anexo 2)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="radio"
                  name="anexo3Reeval"
                  disabled={soloLectura}
                  checked={reev.resultado === "continuar_actual"}
                  onChange={() => updateReev("resultado", "continuar_actual")}
                  className="accent-[#0b2e59]"
                />
                <span>NO → Continuar manejo actual</span>
              </label>
            </div>
          </div>
        </div>

        {/* D. NOTIFICACIONES */}
        <div className="border-2 border-[#0b2e59] rounded-xl overflow-hidden">
          <div className="bg-[#0b2e59] text-white px-3 py-1.5 font-black uppercase text-xs">
            D. NOTIFICACIONES: Notificar a la UCIP, si
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {[
              { id: "disfuncionCardiovascular", label: "Disfunción cardiovascular o choque" },
              { id: "disfuncionMiocardica", label: "Disfunción miocárdica" },
              { id: "dificultadRespiratoria", label: "Dificultad respiratoria" },
              { id: "alteracionSensorio", label: "Alteración del sensorio" },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-slate-50 font-semibold">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean((notif as any)[item.id])}
                  onChange={(e) => updateNotif(item.id as any, e.target.checked)}
                  className="accent-[#0b2e59] w-4 h-4"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#0b2e59] text-white px-4 py-2 text-[11px] font-bold flex items-center justify-between">
        <span>DETECTO© • Detección Temprana de Sepsis en Cáncer y Tratamiento Dirigido</span>
        <span className="font-black text-xs bg-white text-[#0b2e59] px-2 rounded font-mono">12</span>
      </div>
    </div>
  );
};

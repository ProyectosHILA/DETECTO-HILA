import React from "react";
import { FormularioEquipoSepsis } from "../types";
import { AlertCircle, Clock, ShieldCheck, Check } from "lucide-react";

interface FormularioEquipoSepsisPdfProps {
  data: FormularioEquipoSepsis;
  onChange?: (updated: FormularioEquipoSepsis) => void;
  soloLectura?: boolean;
}

export const FormularioEquipoSepsisPdf: React.FC<FormularioEquipoSepsisPdfProps> = ({
  data,
  onChange,
  soloLectura = false,
}) => {
  const update = (patch: Partial<FormularioEquipoSepsis>) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      ...patch,
    });
  };

  const updateSignos = (field: string, val: string) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      signosVitales: {
        ...data.signosVitales,
        [field]: val,
      },
    });
  };

  const updateExamen = (field: string, val: any) => {
    if (soloLectura || !onChange) return;
    onChange({
      ...data,
      examenFisico: {
        ...data.examenFisico,
        [field]: val,
      },
    });
  };

  const updateParaclinico = (
    key:
      | "hemograma"
      | "tpInr"
      | "fibrinogenoDimeroD"
      | "pcr"
      | "astAlt"
      | "bilirrubina"
      | "creatinina"
      | "electrolitos"
      | "aislamientosPrevios",
    field: "checked" | "fechaHora" | "valor",
    val: any
  ) => {
    if (soloLectura || !onChange) return;
    const current = data.paraclinicos?.[key] || {};
    onChange({
      ...data,
      paraclinicos: {
        ...data.paraclinicos,
        [key]: {
          ...current,
          [field]: val,
        },
      },
    });
  };

  const signos = data.signosVitales || {};
  const evat = data.evat || {};
  const examen = data.examenFisico || {};
  const paraclinicos = data.paraclinicos || {};

  return (
    <div className="bg-white border-2 border-[#007b8f] rounded-2xl shadow-xl overflow-hidden text-slate-900 font-sans text-xs select-text">
      {/* 1. HEADER: ACTIVACIÓN DEL EQUIPO DE SEPSIS */}
      <div className="bg-[#007b8f] text-white p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#007b8f] font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-sm">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase leading-tight">
              ACTIVACIÓN DEL EQUIPO DE SEPSIS
            </h2>
            <span className="text-xs sm:text-sm font-medium opacity-95 block">
              Médico + Enfermero • ≤ 10 minutos desde tamizaje positivo
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUBHEADER BANNER: LISTA DE CHEQUEO 1 */}
      <div className="bg-[#0b4d6c] text-white px-4 py-2 font-black text-xs sm:text-sm tracking-wide flex items-center justify-between">
        <span>LISTA DE CHEQUEO 1 — EVALUACIÓN POR EQUIPO DE SEPSIS</span>
        <span className="flex items-center gap-1 font-mono font-bold text-xs bg-[#07364d] px-2.5 py-0.5 rounded">
          ■ ≤ 10 MIN
        </span>
      </div>

      {/* 3. MÉDICO/RESIDENTE + ENFERMERO + DX ONCOLÓGICO */}
      <div className="bg-[#e4f4f7] border-b border-[#007b8f]/40 px-4 py-2.5 flex flex-wrap items-center gap-4 text-xs font-bold text-[#074c5d]">
        <span className="font-extrabold uppercase text-[11px] bg-white/80 px-2 py-0.5 rounded border border-[#007b8f]/30">
          Médico/Residente + Enfermero
        </span>

        <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
          <label className="shrink-0 text-slate-800">Dx oncológico:</label>
          <input
            type="text"
            disabled={soloLectura}
            value={data.dxOncologico || ""}
            onChange={(e) => update({ dxOncologico: e.target.value })}
            placeholder="ej. Leucemia LLA / Linfoma / Tumor sólido..."
            className="flex-1 bg-white border-b-2 border-[#007b8f] px-2 py-0.5 text-xs text-slate-900 font-bold outline-none rounded"
          />
        </div>

        <div className="flex-1 min-w-[180px] flex items-center gap-1.5">
          <label className="shrink-0 text-slate-800">Fase quimioterapia:</label>
          <input
            type="text"
            disabled={soloLectura}
            value={data.faseQuimioterapia || ""}
            onChange={(e) => update({ faseQuimioterapia: e.target.value })}
            placeholder="ej. Inducción / Consolidación / Mantenimiento..."
            className="flex-1 bg-white border-b-2 border-[#007b8f] px-2 py-0.5 text-xs text-slate-900 font-bold outline-none rounded"
          />
        </div>
      </div>

      {/* 4. SECCIÓN A: SIGNOS VITALES */}
      <div className="p-4 border-b border-slate-300 bg-white">
        <h3 className="font-black text-xs uppercase text-[#074c5d] tracking-wider mb-2.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007b8f]"></span>
          A. SIGNOS VITALES
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Temperatura */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Temperatura</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.temperatura || ""}
                onChange={(e) => updateSignos("temperatura", e.target.value)}
                placeholder="38.5"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">°C</span>
            </div>
          </div>

          {/* FC */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">FC</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.fc || ""}
                onChange={(e) => updateSignos("fc", e.target.value)}
                placeholder="145"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">lpm</span>
            </div>
          </div>

          {/* FR */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">FR</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.fr || ""}
                onChange={(e) => updateSignos("fr", e.target.value)}
                placeholder="42"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">rpm</span>
            </div>
          </div>

          {/* PAS */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">PAS</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.pas || ""}
                onChange={(e) => updateSignos("pas", e.target.value)}
                placeholder="85"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">mmHg</span>
            </div>
          </div>

          {/* PAM */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">PAM</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.pam || ""}
                onChange={(e) => updateSignos("pam", e.target.value)}
                placeholder="60"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">mmHg</span>
            </div>
          </div>

          {/* SatO2 */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">SatO2</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.satO2 || ""}
                onChange={(e) => updateSignos("satO2", e.target.value)}
                placeholder="94"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
              <span className="text-[11px] font-bold text-slate-700">%</span>
            </div>
          </div>

          {/* FiO2 */}
          <div className="bg-[#f0f9fa] border border-[#b2e2e9] p-2 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">FiO2</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="text"
                disabled={soloLectura}
                value={signos.fio2 || ""}
                onChange={(e) => updateSignos("fio2", e.target.value)}
                placeholder="21% / 0.28"
                className="w-full bg-white border border-[#9fd5de] px-1.5 py-1 text-center font-bold text-xs rounded outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN B: EVAT (si el centro está avalado) */}
      <div className="p-4 border-b border-slate-300 bg-[#fbfdfd]">
        <h3 className="font-black text-xs uppercase text-[#074c5d] tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007b8f]"></span>
          B. EVAT (si el centro está avalado)
        </h3>

        <div className="flex flex-wrap items-center gap-6 text-xs bg-white p-3 rounded-xl border border-[#b2e2e9]">
          <span className="font-bold text-slate-800">¿El centro está avalado por EVAT?</span>

          {/* Opción SÍ */}
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
            <input
              type="radio"
              name="evatAvalado"
              disabled={soloLectura}
              checked={evat.centroAvalado === true}
              onChange={() => update({ evat: { ...evat, centroAvalado: true } })}
              className="accent-[#007b8f] w-4 h-4"
            />
            <span>SÍ → Puntaje EVAT:</span>
            <input
              type="text"
              disabled={soloLectura || evat.centroAvalado !== true}
              value={evat.puntaje || ""}
              onChange={(e) => update({ evat: { ...evat, puntaje: e.target.value } })}
              placeholder="puntos"
              className="w-20 bg-[#f0f9fa] border border-[#9fd5de] px-2 py-0.5 text-center font-bold text-xs rounded outline-none"
            />
            <span>puntos</span>
          </label>

          {/* Opción NO */}
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
            <input
              type="radio"
              name="evatAvalado"
              disabled={soloLectura}
              checked={evat.centroAvalado === false}
              onChange={() => update({ evat: { ...evat, centroAvalado: false, puntaje: "" } })}
              className="accent-[#007b8f] w-4 h-4"
            />
            <span>NO → Continuar</span>
          </label>
        </div>
      </div>

      {/* 6. SECCIÓN C: EXAMEN FÍSICO AL PIE DE CAMA */}
      <div className="p-4 border-b border-slate-300 bg-white space-y-2">
        <h3 className="font-black text-xs uppercase text-[#074c5d] tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007b8f]"></span>
          C. EXAMEN FÍSICO AL PIE DE CAMA
        </h3>

        <div className="border border-[#007b8f] rounded-xl overflow-hidden divide-y divide-[#007b8f]/30">
          {/* C.1 Neurológico */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-[#f7fcfd] gap-2">
            <span className="font-black text-[#074c5d] text-xs">Neurológico</span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Glasgow:</span>
              <input
                type="text"
                disabled={soloLectura}
                value={examen.glasgowTotal || ""}
                onChange={(e) => updateExamen("glasgowTotal", e.target.value)}
                placeholder="15"
                className="w-12 bg-white border border-slate-300 px-1 py-0.5 text-center font-bold rounded"
              />
              <span>/ 15</span>
              <span className="text-slate-500 text-[11px] ml-2">
                (O:{" "}
                <input
                  type="text"
                  disabled={soloLectura}
                  value={examen.glasgowO || ""}
                  onChange={(e) => updateExamen("glasgowO", e.target.value)}
                  placeholder="4"
                  className="w-8 bg-white border border-slate-300 px-1 py-0.5 text-center font-bold rounded"
                />
                , V:{" "}
                <input
                  type="text"
                  disabled={soloLectura}
                  value={examen.glasgowV || ""}
                  onChange={(e) => updateExamen("glasgowV", e.target.value)}
                  placeholder="5"
                  className="w-8 bg-white border border-slate-300 px-1 py-0.5 text-center font-bold rounded"
                />
                , M:{" "}
                <input
                  type="text"
                  disabled={soloLectura}
                  value={examen.glasgowM || ""}
                  onChange={(e) => updateExamen("glasgowM", e.target.value)}
                  placeholder="6"
                  className="w-8 bg-white border border-slate-300 px-1 py-0.5 text-center font-bold rounded"
                />
                )
              </span>
            </div>
          </div>

          {/* C.2 Cardiovascular / Perfusión */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-start bg-white gap-2">
            <span className="font-black text-[#074c5d] text-xs">Cardiovascular / Perfusión</span>
            <div className="md:col-span-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700">Llenado capilar:</span>
                {[
                  { id: "normal", label: "Normal (<3 seg)" },
                  { id: "prolongado", label: "Prolongado (≥3 seg)" },
                  { id: "rapido_flash", label: "Rápido/Flash" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="llenadoCapilar"
                      disabled={soloLectura}
                      checked={examen.llenadoCapilar === opt.id}
                      onChange={() => updateExamen("llenadoCapilar", opt.id)}
                      className="accent-[#007b8f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-700">Color piel:</span>
                {[
                  { id: "rosada", label: "Rosada" },
                  { id: "moteada", label: "Moteada" },
                  { id: "rubicundez", label: "Rubicundez" },
                  { id: "cianotico", label: "Cianótico" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="colorPiel"
                      disabled={soloLectura}
                      checked={examen.colorPiel === opt.id}
                      onChange={() => updateExamen("colorPiel", opt.id)}
                      className="accent-[#007b8f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* C.3 Respiratorio */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-start bg-[#f7fcfd] gap-2">
            <span className="font-black text-[#074c5d] text-xs">Respiratorio</span>
            <div className="md:col-span-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700">Dificultad respiratoria:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="dificultadResp"
                    disabled={soloLectura}
                    checked={examen.dificultadRespiratoria === "no"}
                    onChange={() => updateExamen("dificultadRespiratoria", "no")}
                    className="accent-[#007b8f]"
                  />
                  <span>No</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="dificultadResp"
                    disabled={soloLectura}
                    checked={examen.dificultadRespiratoria === "si"}
                    onChange={() => updateExamen("dificultadRespiratoria", "si")}
                    className="accent-[#007b8f]"
                  />
                  <span className="font-bold">Sí:</span>
                </label>

                {examen.dificultadRespiratoria === "si" && (
                  <div className="flex flex-wrap items-center gap-2 bg-white px-2 py-0.5 rounded border border-[#9fd5de]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(examen.signosDificultad?.aleteoNasal)}
                        onChange={(e) =>
                          updateExamen("signosDificultad", {
                            ...examen.signosDificultad,
                            aleteoNasal: e.target.checked,
                          })
                        }
                        className="accent-[#007b8f]"
                      />
                      <span>Aleteo nasal</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(examen.signosDificultad?.tirajesIntercostales)}
                        onChange={(e) =>
                          updateExamen("signosDificultad", {
                            ...examen.signosDificultad,
                            tirajesIntercostales: e.target.checked,
                          })
                        }
                        className="accent-[#007b8f]"
                      />
                      <span>Tirajes intercostales</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={soloLectura}
                        checked={Boolean(examen.signosDificultad?.quejido)}
                        onChange={(e) =>
                          updateExamen("signosDificultad", {
                            ...examen.signosDificultad,
                            quejido: e.target.checked,
                          })
                        }
                        className="accent-[#007b8f]"
                      />
                      <span>Quejido</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Auscultación:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="auscultacion"
                    disabled={soloLectura}
                    checked={examen.auscultacion === "normal"}
                    onChange={() => updateExamen("auscultacion", "normal")}
                    className="accent-[#007b8f]"
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="auscultacion"
                    disabled={soloLectura}
                    checked={examen.auscultacion === "anormal"}
                    onChange={() => updateExamen("auscultacion", "anormal")}
                    className="accent-[#007b8f]"
                  />
                  <span className="text-red-700 font-bold">Anormal</span>
                </label>
              </div>
            </div>
          </div>

          {/* C.4 Abdominal */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-white gap-2">
            <span className="font-black text-[#074c5d] text-xs">Abdominal</span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(examen.abdominal?.normal)}
                  onChange={(e) =>
                    updateExamen("abdominal", { ...examen.abdominal, normal: e.target.checked })
                  }
                  className="accent-[#007b8f]"
                />
                <span>Normal</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(examen.abdominal?.distension)}
                  onChange={(e) =>
                    updateExamen("abdominal", { ...examen.abdominal, distension: e.target.checked })
                  }
                  className="accent-[#007b8f]"
                />
                <span>Distensión</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(examen.abdominal?.dolor)}
                  onChange={(e) =>
                    updateExamen("abdominal", { ...examen.abdominal, dolor: e.target.checked })
                  }
                  className="accent-[#007b8f]"
                />
                <span>Dolor</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={soloLectura}
                  checked={Boolean(examen.abdominal?.visceromegalias)}
                  onChange={(e) =>
                    updateExamen("abdominal", {
                      ...examen.abdominal,
                      visceromegalias: e.target.checked,
                    })
                  }
                  className="accent-[#007b8f]"
                />
                <span>Visceromegalias</span>
              </label>
            </div>
          </div>

          {/* C.5 Genitourinario */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-[#f7fcfd] gap-2">
            <span className="font-black text-[#074c5d] text-xs">Genitourinario</span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-700">Gasto urinario:</span>
              <label className="flex items-center gap-1 cursor-pointer font-bold text-amber-900">
                <input
                  type="radio"
                  name="gastoUrinario"
                  disabled={soloLectura}
                  checked={examen.gastoUrinario === "menor_igual_05"}
                  onChange={() => updateExamen("gastoUrinario", "menor_igual_05")}
                  className="accent-[#007b8f]"
                />
                <span>≤0.5 cc/kg/h</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="gastoUrinario"
                  disabled={soloLectura}
                  checked={examen.gastoUrinario === "mayor_05"}
                  onChange={() => updateExamen("gastoUrinario", "mayor_05")}
                  className="accent-[#007b8f]"
                />
                <span>&gt;0.5 cc/kg/h</span>
              </label>
            </div>
          </div>

          {/* C.6 Extremidades */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-white gap-2">
            <span className="font-black text-[#074c5d] text-xs">Extremidades</span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="extremidadesCalor"
                    disabled={soloLectura}
                    checked={examen.extremidades === "calientes"}
                    onChange={() => updateExamen("extremidades", "calientes")}
                    className="accent-[#007b8f]"
                  />
                  <span>Calientes</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="extremidadesCalor"
                    disabled={soloLectura}
                    checked={examen.extremidades === "frias"}
                    onChange={() => updateExamen("extremidades", "frias")}
                    className="accent-[#007b8f]"
                  />
                  <span>Frías</span>
                </label>
              </div>

              <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">Pulsos:</span>
                {[
                  { id: "normales", label: "Normales" },
                  { id: "saltones", label: "Saltones" },
                  { id: "debiles", label: "Débiles" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="pulsos"
                      disabled={soloLectura}
                      checked={examen.pulsos === opt.id}
                      onChange={() => updateExamen("pulsos", opt.id)}
                      className="accent-[#007b8f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* C.7 Piel / Mucosas */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-start bg-[#f7fcfd] gap-2">
            <span className="font-black text-[#074c5d] text-xs">Piel / Mucosas</span>
            <div className="md:col-span-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: "normal", label: "Normal" },
                  { id: "palidez", label: "Palidez" },
                  { id: "ictericia", label: "Ictericia" },
                  { id: "petequias", label: "Petequias" },
                  { id: "equimosis", label: "Equimosis" },
                  { id: "livideces", label: "Livideces" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean((examen.pielMucosas as any)?.[opt.id])}
                      onChange={(e) =>
                        updateExamen("pielMucosas", {
                          ...examen.pielMucosas,
                          [opt.id]: e.target.checked,
                        })
                      }
                      className="accent-[#007b8f]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700">Mucositis grado:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={examen.pielMucosas?.mucositisGrado || ""}
                    onChange={(e) =>
                      updateExamen("pielMucosas", {
                        ...examen.pielMucosas,
                        mucositisGrado: e.target.value,
                      })
                    }
                    placeholder="0-4"
                    className="w-12 bg-white border border-slate-300 px-1 py-0.5 text-center font-bold rounded"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700">Otro:</span>
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={examen.pielMucosas?.otro || ""}
                    onChange={(e) =>
                      updateExamen("pielMucosas", {
                        ...examen.pielMucosas,
                        otro: e.target.value,
                      })
                    }
                    placeholder="especificar..."
                    className="w-32 bg-white border border-slate-300 px-1.5 py-0.5 font-bold rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* C.8 Catéteres */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-white gap-2">
            <span className="font-black text-[#074c5d] text-xs">Catéteres</span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Periférico:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="cateterPeriferico"
                    disabled={soloLectura}
                    checked={examen.cateteres?.periferico === "normal"}
                    onChange={() =>
                      updateExamen("cateteres", {
                        ...examen.cateteres,
                        periferico: "normal",
                      })
                    }
                    className="accent-[#007b8f]"
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-amber-900 font-bold">
                  <input
                    type="radio"
                    name="cateterPeriferico"
                    disabled={soloLectura}
                    checked={examen.cateteres?.periferico === "cambios_inflamatorios"}
                    onChange={() =>
                      updateExamen("cateteres", {
                        ...examen.cateteres,
                        periferico: "cambios_inflamatorios",
                      })
                    }
                    className="accent-[#007b8f]"
                  />
                  <span>Cambios inflamatorios</span>
                </label>
              </div>

              <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Central (CVC/PICC):</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="cateterCentral"
                    disabled={soloLectura}
                    checked={examen.cateteres?.central === "normal"}
                    onChange={() =>
                      updateExamen("cateteres", {
                        ...examen.cateteres,
                        central: "normal",
                      })
                    }
                    className="accent-[#007b8f]"
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-amber-900 font-bold">
                  <input
                    type="radio"
                    name="cateterCentral"
                    disabled={soloLectura}
                    checked={examen.cateteres?.central === "cambios_inflamatorios"}
                    onChange={() =>
                      updateExamen("cateteres", {
                        ...examen.cateteres,
                        central: "cambios_inflamatorios",
                      })
                    }
                    className="accent-[#007b8f]"
                  />
                  <span>Cambios inflamatorios</span>
                </label>
              </div>
            </div>
          </div>

          {/* C.9 Foco infeccioso por examen físico */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-[#f7fcfd] gap-2">
            <span className="font-black text-[#074c5d] text-xs">
              Foco infeccioso por examen físico
            </span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1 cursor-pointer font-bold text-red-900">
                <input
                  type="radio"
                  name="focoInfeccioso"
                  disabled={soloLectura}
                  checked={examen.focoInfeccioso?.presente === true}
                  onChange={() =>
                    updateExamen("focoInfeccioso", {
                      ...examen.focoInfeccioso,
                      presente: true,
                    })
                  }
                  className="accent-[#007b8f]"
                />
                <span>SÍ. Especificar:</span>
              </label>

              {examen.focoInfeccioso?.presente === true && (
                <input
                  type="text"
                  disabled={soloLectura}
                  value={examen.focoInfeccioso?.especificar || ""}
                  onChange={(e) =>
                    updateExamen("focoInfeccioso", {
                      ...examen.focoInfeccioso,
                      especificar: e.target.value,
                    })
                  }
                  placeholder="ej. Pulmonar, Abdominal, Tejidos blandos, Neutropenia febril..."
                  className="flex-1 min-w-[200px] bg-white border-b-2 border-red-500 px-2 py-0.5 font-bold rounded"
                />
              )}

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="focoInfeccioso"
                  disabled={soloLectura}
                  checked={examen.focoInfeccioso?.presente === false}
                  onChange={() =>
                    updateExamen("focoInfeccioso", {
                      ...examen.focoInfeccioso,
                      presente: false,
                      especificar: "",
                    })
                  }
                  className="accent-[#007b8f]"
                />
                <span>NO</span>
              </label>
            </div>
          </div>

          {/* C.10 Explicación alternativa fiebre */}
          <div className="grid grid-cols-1 md:grid-cols-4 p-2.5 items-center bg-white gap-2">
            <span className="font-black text-[#074c5d] text-xs">
              Explicación alternativa fiebre
            </span>
            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              {[
                { id: "infusionMedicamento", label: "Infusión medicamento" },
                { id: "reaccionTransfusional", label: "Reacción transfusional" },
                { id: "dolor", label: "Dolor" },
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={soloLectura}
                    checked={Boolean((examen.explicacionFiebre as any)?.[opt.id])}
                    onChange={(e) =>
                      updateExamen("explicacionFiebre", {
                        ...examen.explicacionFiebre,
                        [opt.id]: e.target.checked,
                      })
                    }
                    className="accent-[#007b8f]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}

              <div className="flex items-center gap-1">
                <span>Otro:</span>
                <input
                  type="text"
                  disabled={soloLectura}
                  value={examen.explicacionFiebre?.otro || ""}
                  onChange={(e) =>
                    updateExamen("explicacionFiebre", {
                      ...examen.explicacionFiebre,
                      otro: e.target.value,
                    })
                  }
                  placeholder="especificar..."
                  className="w-28 bg-white border border-slate-300 px-1 py-0.5 rounded font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SECCIÓN D: PARACLÍNICOS DE LAS ÚLTIMAS 6 HORAS (DOM) */}
      <div className="p-4 border-b border-slate-300 bg-white space-y-2">
        <h3 className="font-black text-xs uppercase text-[#074c5d] tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007b8f]"></span>
          D. PARACLÍNICOS DE LAS ÚLTIMAS 6 HORAS (evaluación disfunción orgánica múltiple - DOM)
        </h3>

        <div className="border border-[#007b8f] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#0b4d6c] text-white font-black text-center divide-x divide-white/20">
                <th className="p-2 w-28 text-left pl-3">Sistema</th>
                <th className="p-2 text-left pl-3">Parámetros</th>
                <th className="p-2 w-32 sm:w-36">Fecha/Hora</th>
                <th className="p-2 w-28 sm:w-36">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#007b8f]/30">
              {/* HEMATOLÓGICO */}
              <tr className="bg-white">
                <td rowSpan={4} className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30 align-top">
                  Hematológico
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.hemograma?.checked)}
                      onChange={(e) => updateParaclinico("hemograma", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">
                      Hemograma (Hemoglobina, plaquetas, neutrófilos, linfocitos)
                    </span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.hemograma?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("hemograma", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.hemograma?.valor || ""}
                    onChange={(e) => updateParaclinico("hemograma", "valor", e.target.value)}
                    placeholder="Hb, Plaq, RAN"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.tpInr?.checked)}
                      onChange={(e) => updateParaclinico("tpInr", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">TP/INR</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.tpInr?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("tpInr", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.tpInr?.valor || ""}
                    onChange={(e) => updateParaclinico("tpInr", "valor", e.target.value)}
                    placeholder="seg / INR"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.fibrinogenoDimeroD?.checked)}
                      onChange={(e) => updateParaclinico("fibrinogenoDimeroD", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Fibrinógeno/Dímero D</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.fibrinogenoDimeroD?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("fibrinogenoDimeroD", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.fibrinogenoDimeroD?.valor || ""}
                    onChange={(e) => updateParaclinico("fibrinogenoDimeroD", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.pcr?.checked)}
                      onChange={(e) => updateParaclinico("pcr", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Proteína C Reactiva</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.pcr?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("pcr", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.pcr?.valor || ""}
                    onChange={(e) => updateParaclinico("pcr", "valor", e.target.value)}
                    placeholder="mg/L"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
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
                      checked={Boolean(paraclinicos.astAlt?.checked)}
                      onChange={(e) => updateParaclinico("astAlt", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">AST/ALT</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.astAlt?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("astAlt", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.astAlt?.valor || ""}
                    onChange={(e) => updateParaclinico("astAlt", "valor", e.target.value)}
                    placeholder="U/L"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
              <tr className="bg-[#fbfdfd]">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.bilirrubina?.checked)}
                      onChange={(e) => updateParaclinico("bilirrubina", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Bilirrubina total /directa</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.bilirrubina?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("bilirrubina", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.bilirrubina?.valor || ""}
                    onChange={(e) => updateParaclinico("bilirrubina", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>

              {/* RENAL */}
              <tr className="bg-white">
                <td rowSpan={2} className="p-2.5 font-black text-[#074c5d] bg-[#f0f9fa] border-r border-[#007b8f]/30 align-top">
                  Renal
                </td>
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.creatinina?.checked)}
                      onChange={(e) => updateParaclinico("creatinina", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Creatinina</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.creatinina?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("creatinina", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.creatinina?.valor || ""}
                    onChange={(e) => updateParaclinico("creatinina", "valor", e.target.value)}
                    placeholder="mg/dL"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
              <tr className="bg-white">
                <td className="p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={soloLectura}
                      checked={Boolean(paraclinicos.electrolitos?.checked)}
                      onChange={(e) => updateParaclinico("electrolitos", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">
                      Electrolitos (calcio, sodio, potasio, magnesio, cloro)
                    </span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.electrolitos?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("electrolitos", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.electrolitos?.valor || ""}
                    onChange={(e) => updateParaclinico("electrolitos", "valor", e.target.value)}
                    placeholder="mEq/L"
                    className="w-full bg-[#f9fbfb] border border-slate-200 px-1.5 py-0.5 font-bold rounded"
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
                      checked={Boolean(paraclinicos.aislamientosPrevios?.checked)}
                      onChange={(e) => updateParaclinico("aislamientosPrevios", "checked", e.target.checked)}
                      className="accent-[#007b8f]"
                    />
                    <span className="font-bold text-slate-800">Aislamientos previos</span>
                  </label>
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.aislamientosPrevios?.fechaHora || ""}
                    onChange={(e) => updateParaclinico("aislamientosPrevios", "fechaHora", e.target.value)}
                    placeholder="dd/mm hh:mm"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 text-center rounded"
                  />
                </td>
                <td className="p-1.5 border-l border-[#007b8f]/20">
                  <input
                    type="text"
                    disabled={soloLectura}
                    value={paraclinicos.aislamientosPrevios?.valor || ""}
                    onChange={(e) => updateParaclinico("aislamientosPrevios", "valor", e.target.value)}
                    placeholder="ej. Germen / Sensibilidad"
                    className="w-full bg-white border border-slate-200 px-1.5 py-0.5 font-bold rounded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RECUADRO NARANJA DE ADVERTENCIA DEL PROTOCOLO */}
        <div className="bg-[#fff6e6] border-2 border-[#f5b041] p-3 rounded-xl text-xs font-semibold text-[#8a4b08] leading-relaxed shadow-sm flex items-start gap-2.5 mt-3">
          <AlertCircle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
          <p>
            <strong>En caso de no tener paraclínicos recientes (últimas 6 horas)</strong>, solicitarlos para descartar DOM y adicionar <strong>lactato, glucometría</strong> y clasificar el sistema respiratorio con la <strong>SaFiO2 o PaFiO2</strong> del paciente.
          </p>
        </div>
      </div>

      {/* 8. HORAS Y FIRMAS */}
      <div className="p-4 bg-[#fbfdfd] border-b border-slate-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 shrink-0">Hora inicio:</span>
            <input
              type="text"
              disabled={soloLectura}
              value={data.horaInicio || ""}
              onChange={(e) => update({ horaInicio: e.target.value })}
              placeholder="08:30"
              className="w-full font-mono font-bold text-center bg-[#f0f9fa] border border-[#9fd5de] py-0.5 rounded outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 shrink-0">Hora clasificación:</span>
            <input
              type="text"
              disabled={soloLectura}
              value={data.horaClasificacion || ""}
              onChange={(e) => update({ horaClasificacion: e.target.value })}
              placeholder="08:38"
              className="w-full font-mono font-bold text-center bg-[#f0f9fa] border border-[#9fd5de] py-0.5 rounded outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 shrink-0">Médico:</span>
            <input
              type="text"
              disabled={soloLectura}
              value={data.medicoFirma || ""}
              onChange={(e) => update({ medicoFirma: e.target.value })}
              placeholder="Dr. Nombre y Registro"
              className="w-full font-bold bg-[#f0f9fa] border border-[#9fd5de] px-2 py-0.5 rounded outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 shrink-0">Enfermero/a:</span>
            <input
              type="text"
              disabled={soloLectura}
              value={data.enfermeroFirma || ""}
              onChange={(e) => update({ enfermeroFirma: e.target.value })}
              placeholder="Enf. Nombre"
              className="w-full font-bold bg-[#f0f9fa] border border-[#9fd5de] px-2 py-0.5 rounded outline-none"
            />
          </div>
        </div>
      </div>

      {/* 9. DOCUMENT FOOTER (IDÉNTICO AL PDF) */}
      <div className="bg-[#0b4d6c] text-white px-4 py-2 text-[11px] font-bold flex items-center justify-between">
        <span className="tracking-wide">
          DETECTO© • Detección Temprana de Sepsis en Cáncer y Tratamiento Dirigido
        </span>
        <span className="font-black text-xs bg-white text-[#0b4d6c] px-2 py-0.2 rounded font-mono">
          5
        </span>
      </div>
    </div>
  );
};

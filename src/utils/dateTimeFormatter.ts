/**
 * Auto-formatea entradas de fecha y hora médicas en tiempo real mientras se digita:
 * - formatFechaHoraInput:
 *   - Al digitar paso a paso: "18" -> "18/", "1811" -> "18/11 ", "181109" -> "18/11 09:", "18110907" -> "18/11 09:07"
 *   - Al pegar fecha completa con año: "18112026 0907" / "181120260907" / "18/11/2026 09:07" -> "18/11 09:07"
 * - formatHoraInput:
 *   - Al digitar paso a paso: "09" -> "09:", "0907" -> "09:07"
 *   - Al pegar fecha completa + hora: "18112026 0907" -> "09:07"
 */

export function formatFechaHoraInput(
  raw: string,
  onBlur = false,
  prevValue = ""
): string {
  if (!raw || !raw.trim()) return "";

  const trimmed = raw.trim();
  const isDeleting = prevValue.length > 0 && raw.length < prevValue.length;

  // Si ya cumple exactamente el formato dd/mm hh:mm, mantenerlo intacto
  if (/^\d{2}\/\d{2}\s\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Formato flexible con / o - y hora, ej: "18/11/2026 9:07" o "8/11 0907"
  const matchFlex = trimmed.match(
    /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-]\d{2,4})?\s+(\d{1,2}):?(\d{2})$/
  );
  if (matchFlex && (onBlur || trimmed.includes(":"))) {
    const d = matchFlex[1].padStart(2, "0");
    const m = matchFlex[2].padStart(2, "0");
    const hh = matchFlex[3].padStart(2, "0");
    const mm = matchFlex[4].padStart(2, "0");
    return `${d}/${m} ${hh}:${mm}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // 12+ dígitos pegados: ddmmyyyyhhmm (ej. "18112026 0907", "181120260907", "18/11/2026 09:07")
  if (digits.length >= 12) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const hh = digits.slice(8, 10);
    const mm = digits.slice(10, 12);
    return `${d}/${m} ${hh}:${mm}`;
  }

  // 10 dígitos con separador explícito o al perder foco: ddmmyyhhmm (ej. "181126 0907")
  if (digits.length === 10 && (onBlur || /[\s/:\-]/.test(trimmed))) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const hh = digits.slice(6, 8);
    const mm = digits.slice(8, 10);
    return `${d}/${m} ${hh}:${mm}`;
  }

  // Si el usuario presiona manualmente '/' tras 1 dígito (ej: "8/"), autocompletar "08/"
  if (!isDeleting && /^(\d)\/$/.test(trimmed)) {
    return `0${trimmed[0]}/`;
  }
  // Si presiona espacio o '/' tras 1 dígito de mes (ej: "18/5 " -> "18/05 ")
  const singleMonthMatch = trimmed.match(/^(\d{2})\/(\d)[\s\/:]$/);
  if (!isDeleting && singleMonthMatch) {
    return `${singleMonthMatch[1]}/0${singleMonthMatch[2]} `;
  }
  // Si presiona ':' tras 1 dígito de hora (ej: "18/11 9:" -> "18/11 09:")
  const singleHourMatch = trimmed.match(/^(\d{2})\/(\d{2})\s(\d):$/);
  if (!isDeleting && singleHourMatch) {
    return `${singleHourMatch[1]}/${singleHourMatch[2]} 0${singleHourMatch[3]}:`;
  }

  // Al perder foco con formato casi completo, normalizar si hay 7-8 dígitos
  if (onBlur) {
    if (digits.length === 8) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)} ${digits.slice(4, 6)}:${digits.slice(6, 8)}`;
    }
  }

  // Máscara progresiva en vivo dd/mm hh:mm (máximo 8 dígitos para dd mm hh mm)
  const capped = digits.slice(0, 8);
  const d = capped.slice(0, 2);
  const m = capped.slice(2, 4);
  const hh = capped.slice(4, 6);
  const mm = capped.slice(6, 8);

  if (capped.length === 1) {
    return d;
  }
  if (capped.length === 2) {
    return isDeleting ? d : `${d}/`;
  }
  if (capped.length === 3) {
    return `${d}/${m}`;
  }
  if (capped.length === 4) {
    return isDeleting ? `${d}/${m}` : `${d}/${m} `;
  }
  if (capped.length === 5) {
    return `${d}/${m} ${hh}`;
  }
  if (capped.length === 6) {
    return isDeleting ? `${d}/${m} ${hh}` : `${d}/${m} ${hh}:`;
  }
  return `${d}/${m} ${hh}:${mm}`;
}

export function formatHoraInput(
  raw: string,
  onBlur = false,
  prevValue = ""
): string {
  if (!raw || !raw.trim()) return "";

  const trimmed = raw.trim();
  const isDeleting = prevValue.length > 0 && raw.length < prevValue.length;

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // Si pegaron fecha completa + hora (12+ dígitos), extraer las últimas 4 cifras (hhmm)
  if (digits.length >= 12) {
    const hh = digits.slice(-4, -2);
    const mm = digits.slice(-2);
    return `${hh}:${mm}`;
  }

  // Si digitan "9:" -> "09:"
  if (!isDeleting && /^(\d):$/.test(trimmed)) {
    return `0${trimmed[0]}:`;
  }

  if (onBlur) {
    if (digits.length === 3) {
      return `0${digits[0]}:${digits.slice(1, 3)}`;
    }
    const m = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
    if (m) {
      return `${m[1].padStart(2, "0")}:${m[2].padStart(2, "0")}`;
    }
  }

  // Máscara progresiva en vivo hh:mm
  const capped = digits.slice(0, 4);
  if (capped.length === 1) {
    return capped;
  }
  if (capped.length === 2) {
    return isDeleting ? capped : `${capped}:`;
  }
  return `${capped.slice(0, 2)}:${capped.slice(2, 4)}`;
}

/**
 * Auto-formatea entradas de fecha y hora médicas en Colombia:
 * - formatFechaHoraInput: convierte "18112026 0907", "181120260907", "1811 0907", "18/11/2026 09:07" -> "18/11 09:07"
 * - formatHoraInput: convierte "0907", "0838", "907" (onBlur), "18112026 0907" -> "09:07" / "08:38"
 */

export function formatFechaHoraInput(raw: string, onBlur = false): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Si ya cumple exactamente el formato dd/mm hh:mm, mantenerlo intacto
  if (/^\d{2}\/\d{2}\s\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  // 12+ dígitos: ddmmyyyyhhmm (ej. "18112026 0907", "181120260907", "18/11/2026 09:07")
  if (digits.length >= 12) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const hh = digits.slice(8, 10);
    const mm = digits.slice(10, 12);
    return `${d}/${m} ${hh}:${mm}`;
  }

  // 10 dígitos con separador o al perder foco: ddmmyyhhmm (ej. "181126 0907")
  if (digits.length === 10 && (onBlur || /[\s/:\-]/.test(trimmed))) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const hh = digits.slice(6, 8);
    const mm = digits.slice(8, 10);
    return `${d}/${m} ${hh}:${mm}`;
  }

  // 8 dígitos con separador explícito entre fecha y hora (ej. "1811 0907" o "18/11 0907")
  if (digits.length === 8 && (/\s/.test(trimmed) || trimmed.includes("/") || trimmed.includes(":"))) {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const hh = digits.slice(4, 6);
    const mm = digits.slice(6, 8);
    return `${d}/${m} ${hh}:${mm}`;
  }

  // Al perder foco con 8 dígitos seguidos (ej. "18110907"), evitar confundir con fecha sin hora tipo "18112026"
  if (onBlur && digits.length === 8) {
    const posibleAnio = digits.slice(4, 8);
    if (!/^(19|20)\d{2}$/.test(posibleAnio)) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const hh = digits.slice(4, 6);
      const mm = digits.slice(6, 8);
      return `${d}/${m} ${hh}:${mm}`;
    }
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

  return raw;
}

export function formatHoraInput(raw: string, onBlur = false): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  // Si pegaron fecha completa + hora (12+ dígitos), extraer las últimas 4 cifras (hhmm)
  if (digits.length >= 12) {
    const hh = digits.slice(-4, -2);
    const mm = digits.slice(-2);
    return `${hh}:${mm}`;
  }

  // 4 dígitos directos sin dos puntos (ej. "0907" -> "09:07", "0838" -> "08:38")
  if (digits.length === 4 && !trimmed.includes(":")) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }

  if (onBlur) {
    if (digits.length === 3) {
      return `0${digits[0]}:${digits.slice(1, 3)}`;
    }
    if (digits.length === 4) {
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    const m = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
    if (m) {
      return `${m[1].padStart(2, "0")}:${m[2].padStart(2, "0")}`;
    }
  }

  return raw;
}

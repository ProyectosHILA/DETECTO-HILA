import React from "react";
import { formatFechaHoraInput, formatHoraInput } from "../utils/dateTimeFormatter";

interface FormattedTimeInputProps {
  mode: "datetime" | "time";
  value: string;
  onValueChange: (formattedOrRaw: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const FormattedTimeInput: React.FC<FormattedTimeInputProps> = ({
  mode,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  className = "",
}) => {
  const formatter = mode === "datetime" ? formatFechaHoraInput : formatHoraInput;

  return (
    <input
      type="text"
      disabled={disabled}
      value={value}
      onChange={(e) => {
        const formatted = formatter(e.target.value, false);
        onValueChange(formatted);
      }}
      onBlur={(e) => {
        const formatted = formatter(e.target.value, true);
        if (formatted !== value) {
          onValueChange(formatted);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const formatted = formatter((e.target as HTMLInputElement).value, true);
          if (formatted !== value) {
            onValueChange(formatted);
          }
        }
      }}
      placeholder={placeholder || (mode === "datetime" ? "dd/mm hh:mm" : "hh:mm")}
      className={className}
    />
  );
};

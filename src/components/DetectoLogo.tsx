import React, { useState } from "react";
import { ShieldCheck, Activity } from "lucide-react";

interface DetectoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "dark" | "light"; // "dark" = Azul oscuro para fondo claro (default), "light" = Blanco para header azul
}

export const DetectoLogo: React.FC<DetectoLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
  textColor = "dark",
}) => {
  const [imageError, setImageError] = useState(false);

  // Drive image URLs
  const driveImgUrl = "https://lh3.googleusercontent.com/d/1XcbmPp2b5r709OYg5fMEsI-BX7Ri1kEx";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const isDarkText = textColor === "dark";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-600 via-sky-800 to-indigo-950 flex items-center justify-center p-1 shadow-lg border border-sky-400/40 shrink-0`}
      >
        {!imageError ? (
          <img
            src={driveImgUrl}
            alt="Logo DETECTO - Hospital Infantil Los Ángeles"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6 text-sky-300" />
            <Activity className="w-3.5 h-3.5 text-red-400 -mt-1" />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight flex items-center ${
                isDarkText ? "text-[#0c2340]" : "text-white"
              }`}
            >
              DETECTO
              <span
                className={`text-xs font-normal ml-0.5 ${
                  isDarkText ? "text-sky-700 font-bold" : "text-sky-300"
                }`}
              >
                ©
              </span>
            </span>
            <span
              className={`text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                isDarkText
                  ? "bg-[#0c2340] text-sky-200 border border-sky-900"
                  : "bg-sky-900/90 text-sky-200 border border-sky-700/60"
              }`}
            >
              HILA
            </span>
          </div>
          <span
            className={`text-[11px] font-bold tracking-wide ${
              isDarkText ? "text-[#0c2340]" : "text-sky-200/90"
            }`}
          >
            Hospital Infantil Los Ángeles · Sepsis Pediátrica
          </span>
        </div>
      )}
    </div>
  );
};

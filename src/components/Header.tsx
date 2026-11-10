import React from "react";
import { UsuarioSesion } from "../types";
import { DetectoLogo } from "./DetectoLogo";
import { Home, LogOut, ShieldCheck } from "lucide-react";

interface HeaderProps {
  onVolverAlMenu?: () => void;
  onCerrarSesion?: () => void;
  usuarioActual?: UsuarioSesion | null;
}

export const Header: React.FC<HeaderProps> = ({
  onVolverAlMenu,
  onCerrarSesion,
  usuarioActual,
}) => {
  return (
    <header className="bg-[#0c2340] border-b border-sky-900/60 text-white shadow-md sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onVolverAlMenu && (
            <button
              onClick={onVolverAlMenu}
              className="bg-sky-900/80 hover:bg-sky-800 text-sky-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-sky-700/60 transition-colors shadow-sm"
              title="Volver al menú principal"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menú Principal</span>
            </button>
          )}

          <DetectoLogo size="md" showText={true} textColor="light" />
        </div>

        <div className="flex items-center gap-3">
          {usuarioActual && (
            <div className="flex items-center gap-2 bg-sky-950/90 px-3 py-1.5 rounded-xl border border-sky-700/60 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-black text-sky-200">
                {usuarioActual.rol === "triage" && "Fase 1: Triage"}
                {usuarioActual.rol === "medico_urgencias" && "Fase 2: Equipo de Sepsis"}
                {usuarioActual.rol === "grupo_detecto" && "Fase 3: Equipo DETECTO"}
                {usuarioActual.rol === "super_usuario" && "Super Usuario"}
              </span>
            </div>
          )}

          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="bg-rose-900/40 hover:bg-rose-800 text-rose-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-rose-700/60 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

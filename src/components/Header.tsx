import React from 'react';
import { Menu, Building2, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-[#142d59] border-b border-[#0f2347] sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 text-white shadow-xs">
      {/* Botão Hamburger (Mobile) e Título Institucional */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none shrink-0 cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-9 bg-[#084734] rounded-md flex items-center justify-center text-fia-lime font-bold text-[11px] shrink-0 lg:hidden border border-white/15">
            FIA
          </div>
          <Building2 className="w-4 h-4 text-fia-lime hidden sm:block shrink-0" />
          <span className="text-xs font-semibold text-white truncate tracking-tight">
            Talent Hub • FIA Business School
          </span>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-fia-lime border border-white/15 backdrop-blur-xs">
            Visão Global & Solidez
          </span>
        </div>
      </div>

      {/* Canto superior direito: Usuário e Sair */}
      {user && (
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 text-right">
            <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-fia-lime" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-white max-w-[110px] sm:max-w-[180px] md:max-w-[240px] truncate leading-tight">
                {user.nome}
              </p>
              <p className="text-[10px] text-slate-300 capitalize leading-tight hidden xs:block">
                {user.tipo === 'admin' ? 'Administrador' : 'Aluno'} • FIA
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/15 border border-white/20 hover:border-white/40 transition-all cursor-pointer"
            title="Encerrar sessão"
            aria-label="Sair da plataforma"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      )}
    </header>
  );
};

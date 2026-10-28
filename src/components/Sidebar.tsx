import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import fiaLogoDarkImg from '../assets/fia-logo-dark.png';
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  PlusCircle, 
  UserCheck, 
  Layers,
  Building2,
  GraduationCap,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const cadastroVagaRoute = role === 'admin' ? '/admin/nova-vaga' : '/aluno/cadastrar-vaga';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-fia-deep text-white shadow-xs font-semibold'
        : 'text-slate-600 hover:text-fia-deep hover:bg-fia-sereno/40'
    }`;

  return (
    <>
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group" onClick={onClose}>
            <img
              src={fiaLogoDarkImg}
              alt="FIA Business School"
              className="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left justify-center pl-2 border-l border-slate-200">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                Talent Hub
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#142d59] font-semibold mt-1">
                Business School
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CTA Rápido de Cadastrar Vaga */}
        <div className="p-3">
          <Link
            to={cadastroVagaRoute}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-fia-deep hover:bg-fia-navy text-white transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-fia-lime" />
            <span>Cadastrar Vaga</span>
          </Link>
          <span className="text-[10px] text-slate-400 mt-1 block text-center">
            {role === 'admin' ? 'Painel de publicação central' : 'Compartilhar oportunidade'}
          </span>
        </div>

        {/* Links de Navegação conforme Papel do Usuário */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {/* Navegação ALUNO */}
          {role === 'aluno' && (
            <div className="space-y-1">
              <span className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">
                Oportunidades
              </span>
              <NavLink to="/aluno/recomendacoes" className={navItemClass} onClick={onClose}>
                <Sparkles className="w-4 h-4 shrink-0 text-fia-tea" />
                Vagas Recomendadas
              </NavLink>
              <NavLink to="/aluno/vagas" className={navItemClass} onClick={onClose}>
                <Briefcase className="w-4 h-4 shrink-0" />
                Todas as Vagas
              </NavLink>
              <NavLink to="/aluno/candidaturas" className={navItemClass} onClick={onClose}>
                <UserCheck className="w-4 h-4 shrink-0" />
                Minhas Candidaturas
              </NavLink>

              <span className="px-3 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">
                Meu Perfil
              </span>
              <NavLink to="/aluno/curriculo" className={navItemClass} onClick={onClose}>
                <FileText className="w-4 h-4 shrink-0" />
                Currículo & Competências
              </NavLink>
            </div>
          )}

          {/* Navegação ADMIN */}
          {role === 'admin' && (
            <div className="space-y-1">
              <span className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">
                Administração
              </span>
              <NavLink to="/admin/dashboard" end className={navItemClass} onClick={onClose}>
                <Layers className="w-4 h-4 shrink-0" />
                Gestão Geral de Vagas
              </NavLink>
              <NavLink to="/admin/alunos" className={navItemClass} onClick={onClose}>
                <GraduationCap className="w-4 h-4 shrink-0" />
                Alunos Cadastrados
              </NavLink>

              <span className="px-3 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">
                Visualização Pública
              </span>
              <NavLink to="/aluno/vagas" className={navItemClass} onClick={onClose}>
                <Building2 className="w-4 h-4 shrink-0" />
                Mural de Vagas
              </NavLink>
            </div>
          )}
        </div>

        {/* Footer da Sidebar com Tagline Oficial da FIA */}
        <div className="p-3.5 border-t border-slate-100 bg-white text-left">
          <span className="text-xs font-bold text-fia-deep block">
            FIA Business School
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Quem sabe lidera.
          </span>
        </div>
      </aside>
    </>
  );
};

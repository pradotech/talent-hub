import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  PlusCircle, 
  UserCheck, 
  LogOut,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Identidade Institucional */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-9 w-12 bg-fia-navy rounded flex items-center justify-center text-white font-bold tracking-wider text-sm shadow-xs">
                FIA
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-slate-900 group-hover:text-fia-navy transition-colors">
                  Talent Hub
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Business School
                </span>
              </div>
            </Link>

            {/* Links de navegação para Aluno */}
            {role === 'aluno' && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/aluno/recomendacoes"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/aluno/recomendacoes')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  Recomendadas
                </Link>
                <Link
                  to="/aluno/vagas"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/aluno/vagas')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Todas as Vagas
                </Link>
                <Link
                  to="/aluno/candidaturas"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/aluno/candidaturas')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Minhas Candidaturas
                </Link>
                <Link
                  to="/aluno/curriculo"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/aluno/curriculo')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Currículo & Skills
                </Link>
                <Link
                  to="/aluno/indicar-vaga"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/aluno/indicar-vaga')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  Compartilhar Vaga
                </Link>
              </nav>
            )}

            {/* Links de navegação para Administrador */}
            {role === 'admin' && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/admin/dashboard"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Gestão de Vagas
                </Link>
                <Link
                  to="/admin/nova-vaga"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive('/admin/nova-vaga')
                      ? 'bg-slate-100 text-fia-navy font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  Cadastrar Vaga
                </Link>
              </nav>
            )}
          </div>

          {/* Área de usuário e alternador de perfil */}
          <div className="flex items-center gap-3">
            {/* Seletor de simulação de perfil */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  role === 'admin'
                    ? 'bg-white text-fia-navy shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Trocar para visão de Administrador"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => switchRole('aluno')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  role === 'aluno'
                    ? 'bg-white text-fia-navy shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Trocar para visão de Aluno"
              >
                Aluno
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-800 leading-tight">{user.nome}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.tipo} FIA</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  title="Sair da conta"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Acessar Plataforma
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

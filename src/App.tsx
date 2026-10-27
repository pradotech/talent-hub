import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminNovaVagaPage } from './pages/AdminNovaVagaPage';
import { AlunoRecomendacoesPage } from './pages/AlunoRecomendacoesPage';
import { AlunoVagasPage } from './pages/AlunoVagasPage';
import { AlunoCurriculoPage } from './pages/AlunoCurriculoPage';
import { AlunoCandidaturasPage } from './pages/AlunoCandidaturasPage';
import { AlunoCadastrarVagaPage } from './pages/AlunoCadastrarVagaPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
        Carregando Talent Hub FIA...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.tipo === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/aluno/recomendacoes" replace />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Fecha a gaveta lateral automaticamente em telas mobile ao trocar de rota
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Na página de login não renderizamos a sidebar lateral
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <div className="h-screen w-full overflow-hidden bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Lateral */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Conteúdo Principal à Direita da Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar / Header Minimalista */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Conteúdo da Rota */}
        <main className="flex-1 pb-10 sm:pb-12">{children}</main>

        {/* Rodapé Institucional Oficial */}
        <footer className="border-t border-slate-200 bg-white py-4 sm:py-5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs text-slate-500 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <span className="font-bold text-fia-deep">FIA Business School</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Quem sabe lidera.</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline text-slate-400">Saber para agir, agir para impactar</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Talent Hub Institucional
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'admin') {
    return <Navigate to="/aluno/vagas" replace />;
  }
  return <>{children}</>;
};

const AlunoOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

const VagasRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/aluno/vagas${location.search}`} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas Exclusivas de Administrador */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="vagas" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/alunos"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="alunos" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/nova-vaga"
              element={
                <AdminRoute>
                  <AdminNovaVagaPage />
                </AdminRoute>
              }
            />
            <Route path="/professor/*" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Rotas Exclusivas de Aluno (Admin não acessa) */}
            <Route
              path="/aluno/recomendacoes"
              element={
                <AlunoOnlyRoute>
                  <AlunoRecomendacoesPage />
                </AlunoOnlyRoute>
              }
            />
            <Route
              path="/aluno/curriculo"
              element={
                <AlunoOnlyRoute>
                  <AlunoCurriculoPage />
                </AlunoOnlyRoute>
              }
            />
            <Route
              path="/aluno/candidaturas"
              element={
                <AlunoOnlyRoute>
                  <AlunoCandidaturasPage />
                </AlunoOnlyRoute>
              }
            />
            <Route
              path="/aluno/cadastrar-vaga"
              element={
                <AlunoOnlyRoute>
                  <AlunoCadastrarVagaPage />
                </AlunoOnlyRoute>
              }
            />
            <Route path="/aluno/indicar-vaga" element={<Navigate to="/aluno/cadastrar-vaga" replace />} />

            {/* Mural de Vagas (Acesso Geral / Aluno, com visualização adaptada para Admin) */}
            <Route
              path="/aluno/vagas"
              element={
                <ProtectedRoute>
                  <AlunoVagasPage />
                </ProtectedRoute>
              }
            />
            <Route path="/vagas" element={<VagasRedirect />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vagasService } from '../services/vagasService';
import { candidaturasService } from '../services/candidaturasService';
import { alunosService } from '../services/alunosService';
import type { Vaga, Candidatura, StatusCandidatura, Aluno } from '../types';
import { VagaCard } from '../components/VagaCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Tag } from '../components/Tag';
import { Card, CardBody } from '../components/Card';
import { formatDate } from '../lib/utils';
import { 
  PlusCircle, 
  Layers, 
  Users, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  ShieldCheck, 
  GraduationCap,
  Search
} from 'lucide-react';

interface AdminDashboardPageProps {
  initialTab?: 'vagas' | 'alunos';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ initialTab = 'vagas' }) => {
  const navigate = useNavigate();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'vagas' | 'alunos'>(initialTab);
  const [searchAluno, setSearchAluno] = useState<string>('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: 'vagas' | 'alunos') => {
    setActiveTab(tab);
    if (tab === 'vagas') {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/alunos');
    }
  };

  // Estado do Modal de Candidatos da Vaga
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [candidatos, setCandidatos] = useState<Candidatura[]>([]);
  const [isLoadingCandidatos, setIsLoadingCandidatos] = useState<boolean>(false);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [vagasData, alunosData] = await Promise.all([
        vagasService.getAllVagas(),
        alunosService.getTodosAlunos(),
      ]);
      setVagas(vagasData);
      setAlunos(alunosData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleToggleStatus = async (vaga: Vaga) => {
    const novoStatus = vaga.status === 'aberta' ? 'encerrada' : 'aberta';
    await vagasService.toggleStatusVaga(vaga.id, novoStatus);
    const updated = await vagasService.getAllVagas();
    setVagas(updated);
  };

  const handleOpenCandidatosModal = async (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setIsLoadingCandidatos(true);
    try {
      const data = await candidaturasService.getCandidaturasByVaga(vaga.id);
      setCandidatos(data);
    } finally {
      setIsLoadingCandidatos(false);
    }
  };

  const handleUpdateStatusCandidatura = async (
    candidaturaId: string,
    novoStatus: StatusCandidatura
  ) => {
    await candidaturasService.updateStatusCandidatura(candidaturaId, novoStatus);
    if (selectedVaga) {
      const data = await candidaturasService.getCandidaturasByVaga(selectedVaga.id);
      setCandidatos(data);
    }
  };

  const vagasAtivas = vagas.filter((v) => v.status === 'aberta').length;
  const vagasEncerradas = vagas.filter((v) => v.status === 'encerrada').length;

  const filteredAlunos = alunos.filter((aluno) => {
    const term = searchAluno.toLowerCase();
    const matchNome = aluno.nome.toLowerCase().includes(term);
    const matchEmail = aluno.email.toLowerCase().includes(term);
    const matchCurso = aluno.curso?.toLowerCase().includes(term);
    const matchSkill = aluno.competencias?.some((c) => c.toLowerCase().includes(term));
    return matchNome || matchEmail || matchCurso || matchSkill;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-fia-deep" />
            Coordenação & Administração
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-slate-900 text-left">
            Gestão Geral de Vagas & Talentos FIA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-left">
            Controle de oportunidades, métricas e base de alunos cadastrados na plataforma.
          </p>
        </div>

        <Link to="/admin/nova-vaga" className="w-full sm:w-auto">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4 text-fia-lime" />} className="w-full sm:w-auto">
            Cadastrar Nova Vaga
          </Button>
        </Link>
      </div>

      {/* Métricas e Indicadores Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
        {/* Card Alunos Cadastrados (Azul FIA) */}
        <div
          onClick={() => handleTabChange('alunos')}
          className={`p-5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeTab === 'alunos'
              ? 'bg-[#142d59] text-white border-[#142d59] ring-2 ring-fia-lime/40'
              : 'bg-white border-slate-200 hover:border-[#142d59]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                activeTab === 'alunos' ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              Alunos Cadastrados
            </span>
            <GraduationCap
              className={`w-4 h-4 ${
                activeTab === 'alunos' ? 'text-fia-lime' : 'text-[#142d59]'
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              activeTab === 'alunos' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {alunos.length}
          </p>
          <span
            className={`text-[11px] block mt-1 ${
              activeTab === 'alunos' ? 'text-slate-300' : 'text-slate-400'
            }`}
          >
            Total de contas criadas
          </span>
        </div>

        {/* Card Vagas Ativas */}
        <div
          onClick={() => handleTabChange('vagas')}
          className={`p-5 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeTab === 'vagas'
              ? 'bg-fia-deep text-white border-fia-deep ring-2 ring-fia-lime/40'
              : 'bg-white border-slate-200 hover:border-fia-solido/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                activeTab === 'vagas' ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              Vagas Ativas
            </span>
            <Layers
              className={`w-4 h-4 ${
                activeTab === 'vagas' ? 'text-fia-lime' : 'text-emerald-700'
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              activeTab === 'vagas' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {vagasAtivas}
          </p>
          <span
            className={`text-[11px] block mt-1 ${
              activeTab === 'vagas' ? 'text-emerald-200/80' : 'text-slate-400'
            }`}
          >
            Disponíveis no mural
          </span>
        </div>

        {/* Card Total de Vagas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total de Oportunidades</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{vagas.length}</p>
          <span className="text-[11px] text-slate-400 block mt-1">Histórico completo</span>
        </div>

        {/* Card Vagas Encerradas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Vagas Encerradas</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{vagasEncerradas}</p>
          <span className="text-[11px] text-slate-400 block mt-1">Processos finalizados</span>
        </div>
      </div>

      {/* Navegação por Abas: Vagas vs Alunos */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('vagas')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'vagas'
              ? 'border-fia-deep text-fia-deep'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Todas as Vagas ({vagas.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('alunos')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'alunos'
              ? 'border-[#142d59] text-[#142d59]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Alunos Cadastrados ({alunos.length})
        </button>
      </div>

      {/* Conteúdo da Aba Vagas */}
      {activeTab === 'vagas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Mural de Vagas da Plataforma ({vagas.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
              Carregando oportunidades da plataforma...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vagas.map((vaga) => (
                <VagaCard
                  key={vaga.id}
                  vaga={vaga}
                  showAdminView={true}
                  onManageCandidates={handleOpenCandidatosModal}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba Alunos Cadastrados */}
      {activeTab === 'alunos' && (
        <div className="space-y-4">
          {/* Barra de Filtro de Alunos */}
          <div className="bg-white p-4 rounded border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchAluno}
                onChange={(e) => setSearchAluno(e.target.value)}
                placeholder="Buscar aluno por nome, e-mail, curso ou competência (ex: Python, SQL)..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium shrink-0">
              {filteredAlunos.length} aluno(s) encontrado(s)
            </span>
          </div>

          {/* Tabela / Lista de Alunos */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
              Carregando dados dos alunos...
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
              Nenhum aluno encontrado para os critérios de busca.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlunos.map((alunoItem) => (
                <Card key={alunoItem.id} className="border-slate-200">
                  <CardBody className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Dados Básicos */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {alunoItem.nome}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Aluno FIA
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{alunoItem.email}</p>
                        {alunoItem.curso && (
                          <p className="text-xs text-slate-600 font-medium pt-0.5">
                            {alunoItem.curso} {alunoItem.periodo ? `• ${alunoItem.periodo}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Status de Currículo */}
                      <div className="flex sm:flex-col items-end gap-1.5 shrink-0">
                        {alunoItem.curriculoUrl ? (
                          <a
                            href={alunoItem.curriculoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Ver Currículo PDF
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                            Currículo não anexado
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {alunoItem.competencias?.length || 0} competência(s) mapeada(s)
                        </span>
                      </div>
                    </div>

                    {/* Competências / Skills Mapeadas */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                        Competências Registradas no Perfil:
                      </span>
                      {alunoItem.competencias && alunoItem.competencias.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {alunoItem.competencias.map((comp) => (
                            <Tag key={comp} label={comp} variant="matched" size="sm" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Nenhuma competência cadastrada ainda pelo aluno.
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Gestão de Candidatos da Vaga */}
      <Modal
        isOpen={!!selectedVaga}
        onClose={() => setSelectedVaga(null)}
        title={selectedVaga ? `Inscritos: ${selectedVaga.titulo}` : 'Inscritos'}
        subtitle={selectedVaga?.empresa}
        maxWidth="2xl"
      >
        {isLoadingCandidatos ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Carregando inscrições...
          </div>
        ) : candidatos.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs">Nenhum aluno se candidatou a esta vaga até o momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidatos.map((candidato) => (
              <div
                key={candidato.id}
                className="p-3.5 sm:p-4 border border-slate-200 rounded bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {candidato.alunoNome}
                    </h4>
                    <p className="text-xs text-slate-500">{candidato.alunoEmail}</p>
                    <span className="text-[11px] text-slate-400">
                      Inscrito em: {formatDate(candidato.criadaEm)}
                    </span>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end gap-1.5 sm:gap-1">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 text-white">
                      {candidato.compatibilidadeScore ?? 0}% de Aderência
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Status: {candidato.status}
                    </span>
                  </div>
                </div>

                {/* Competências do Aluno */}
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                    Competências do Aluno:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {candidato.alunoCompetencias.map((comp) => (
                      <Tag key={comp} label={comp} size="sm" variant="matched" />
                    ))}
                  </div>
                </div>

                {/* Ações e Mudança de Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200 text-xs">
                  <a
                    href={candidato.alunoCurriculoUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-fia-accent hover:underline font-medium self-start"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver Currículo PDF
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusCandidatura(candidato.id, 'em_analise')}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                        candidato.status === 'em_analise'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Em Análise
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusCandidatura(candidato.id, 'aprovado')}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                        candidato.status === 'aprovado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusCandidatura(candidato.id, 'rejeitado')}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                        candidato.status === 'rejeitado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { vagasService } from '../services/vagasService';
import { alunosService } from '../services/alunosService';
import { candidaturasService } from '../services/candidaturasService';
import type { Vaga, Aluno, Candidatura } from '../types';
import { VagaCard } from '../components/VagaCard';
import { Modal } from '../components/Modal';
import { formatDate, calculateAdherence } from '../lib/utils';
import { getWhatsAppShareUrl, getVagaSystemUrl } from '../lib/shareUtils';
import { Search, MapPin, Calendar, DollarSign, CheckCircle2, Building2, Copy } from 'lucide-react';

export const AlunoVagasPage: React.FC = () => {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModalidade, setFilterModalidade] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const usuarioId = user?.id || 'user-aluno-1';
  const urlVagaId = searchParams.get('vagaId');

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const alunoData = role === 'aluno' ? await alunosService.getAlunoByUsuarioId(usuarioId) : null;
      setAluno(alunoData);

      const [vagasData, candsData] = await Promise.all([
        vagasService.getVagas(),
        alunoData ? candidaturasService.getCandidaturasByAluno(alunoData.id) : [],
      ]);

      const processedVagas = alunoData && alunoData.competencias && alunoData.competencias.length > 0
        ? vagasData.map((vaga) => {
            const { aderenciaPorcentagem, competenciasEmComum, competenciasFaltantes } =
              calculateAdherence(alunoData.competencias, vaga.competenciasNecessarias);
            return {
              ...vaga,
              aderenciaPorcentagem,
              competenciasEmComum,
              competenciasFaltantes,
            };
          })
        : vagasData;

      setVagas(processedVagas as Vaga[]);
      setCandidaturas(candsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [usuarioId, role]);

  // Abre automaticamente a vaga referenciada pelo link compartilhado na URL
  useEffect(() => {
    if (urlVagaId && vagas.length > 0) {
      const found = vagas.find((v) => v.id === urlVagaId);
      if (found) {
        setSelectedVaga(found);
      }
    }
  }, [urlVagaId, vagas]);

  const handleOpenVagaDetails = (vaga: Vaga) => {
    setSelectedVaga(vaga);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('vagaId', vaga.id);
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseModal = () => {
    setSelectedVaga(null);
    if (searchParams.has('vagaId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('vagaId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleApply = async (vaga: Vaga) => {
    if (role !== 'aluno') {
      setFeedbackMessage('Apenas alunos cadastrados podem se candidatar a vagas.');
      return;
    }
    if (!aluno) return;
    setIsApplying(true);
    try {
      await candidaturasService.createCandidatura(vaga, aluno);
      setFeedbackMessage(`Candidatura para "${vaga.titulo}" enviada com sucesso!`);
      const cands = await candidaturasService.getCandidaturasByAluno(aluno.id);
      setCandidaturas(cands);
      handleCloseModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedbackMessage(err.message);
      } else {
        setFeedbackMessage('Erro ao registrar candidatura.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const isVagaApplied = (vagaId: string) => {
    return candidaturas.some((c) => c.vagaId === vagaId);
  };

  const filteredVagas = vagas.filter((vaga) => {
    const matchSearch =
      vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaga.competenciasNecessarias.some((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchModalidade =
      filterModalidade === 'todos' || vaga.modalidade === filterModalidade;

    return matchSearch && matchModalidade;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            {role === 'admin' ? 'Módulo Institucional' : 'Oportunidades Abertas'}
          </span>
          <h1 className="text-2xl font-bold text-fia-navy">
            Mural de Vagas
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {role === 'admin'
              ? 'Visualização institucional de todas as vagas ativas disponíveis para os alunos'
              : 'Explore as vagas de mercado e oportunidades abertas compartilhadas pela comunidade FIA'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = role === 'admin' ? '/admin/nova-vaga' : '/aluno/cadastrar-vaga'}
          className="inline-flex items-center justify-center font-medium transition-colors rounded text-xs px-3.5 py-2.5 sm:py-2 gap-2 bg-fia-navy text-white hover:bg-fia-navy-800 shadow-xs border border-fia-navy w-full sm:w-auto"
        >
          {role === 'admin' ? '+ Cadastrar Nova Vaga' : 'Compartilhar Vaga com Colegas'}
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-slate-900 text-white text-xs rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cargo, competência (ex: SQL, Python) ou palavras-chave..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterModalidade}
            onChange={(e) => setFilterModalidade(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
          >
            <option value="todos">Todas as Modalidades</option>
            <option value="Híbrido">Híbrido</option>
            <option value="Presencial">Presencial</option>
            <option value="Remoto">Remoto</option>
          </select>
        </div>
      </div>

      {/* Grid de Vagas */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
          Carregando oportunidades institucionais...
        </div>
      ) : filteredVagas.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
          Nenhuma vaga encontrada com os critérios informados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVagas.map((vaga) => (
            <VagaCard
              key={vaga.id}
              vaga={vaga}
              isApplied={role === 'aluno' ? isVagaApplied(vaga.id) : false}
              onApply={role === 'aluno' ? () => handleApply(vaga) : undefined}
              onViewDetails={() => handleOpenVagaDetails(vaga)}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalhes da Vaga */}
      <Modal
        isOpen={!!selectedVaga}
        onClose={handleCloseModal}
        title={selectedVaga?.titulo || 'Detalhes da Oportunidade'}
        subtitle={selectedVaga?.empresa}
        maxWidth="xl"
        hideHeader={true}
      >
        {selectedVaga && (
          <div className="space-y-6 text-left">
            {/* Cabeçalho Visual da Oportunidade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#142d59]/5 border border-[#142d59]/15 flex items-center justify-center shrink-0 text-[#142d59] font-bold text-lg">
                  {selectedVaga.empresa ? selectedVaga.empresa.charAt(0).toUpperCase() : 'V'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight capitalize leading-snug">
                    {selectedVaga.titulo}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVaga.empresa}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVaga.modalidade}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      {selectedVaga.remuneracao || 'A combinar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag de prazo */}
              <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Inscrições até <strong>{formatDate(selectedVaga.dataLimite)}</strong></span>
              </div>
            </div>

            {/* Compatibilidade de Competências (para alunos com perfil) */}
            {'aderenciaPorcentagem' in selectedVaga && typeof (selectedVaga as any).aderenciaPorcentagem === 'number' && (
              <div className="p-4 bg-[#084734]/5 border border-[#084734]/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#084734] text-fia-lime flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedVaga as any).aderenciaPorcentagem}%
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#084734] uppercase tracking-wider">
                      Aderência de Competências
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Compatibilidade calculada automaticamente com base nas competências extraídas do seu currículo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Descrição das Atividades */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sobre a Oportunidade & Atividades
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedVaga.descricao}
              </p>
            </div>

            {/* Competências Requeridas */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Requisitos & Competências ({selectedVaga.competenciasNecessarias.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedVaga.competenciasNecessarias.map((skill) => {
                  const isMatched =
                    'competenciasEmComum' in selectedVaga &&
                    Array.isArray((selectedVaga as any).competenciasEmComum) &&
                    (selectedVaga as any).competenciasEmComum.some(
                      (c: string) => c.toLowerCase() === skill.toLowerCase()
                    );

                  return (
                    <span
                      key={skill}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isMatched
                          ? 'bg-[#084734]/10 text-[#084734] border-[#084734]/30 font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-[#084734]" />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Mensagem de Feedback de Cópia */}
            {feedbackMessage && (
              <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-center animate-fade-in">
                {feedbackMessage}
              </div>
            )}

            {/* Rodapé Elegante e Limpo */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Compartilhamento à esquerda */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const link = getVagaSystemUrl(selectedVaga.id);
                    await navigator.clipboard.writeText(link);
                    setFeedbackMessage('Link direto copiado!');
                    setTimeout(() => setFeedbackMessage(null), 3000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Copiar link direto para esta vaga"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Link</span>
                </button>

                <a
                  href={getWhatsAppShareUrl(selectedVaga)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg transition-colors"
                  title="Compartilhar oportunidade no WhatsApp"
                >
                  <span>WhatsApp ↗</span>
                </a>
              </div>

              {/* Ações de Decisão à direita */}
              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>

                {selectedVaga.linkInscricao && (
                  <a
                    href={selectedVaga.linkInscricao.startsWith('http') ? selectedVaga.linkInscricao : `https://${selectedVaga.linkInscricao}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
                  >
                    <span>Página Externa ↗</span>
                  </a>
                )}

                {role === 'aluno' && (
                  <button
                    type="button"
                    disabled={isVagaApplied(selectedVaga.id) || isApplying}
                    onClick={() => handleApply(selectedVaga)}
                    className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
                      isVagaApplied(selectedVaga.id)
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-[#142d59] hover:bg-[#0d1e3c] text-white border border-[#142d59]'
                    }`}
                  >
                    <span>{isVagaApplied(selectedVaga.id) ? 'Candidatura Enviada' : 'Candidatar-se à Vaga'}</span>
                    {!isVagaApplied(selectedVaga.id) && <CheckCircle2 className="w-3.5 h-3.5 text-fia-lime" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

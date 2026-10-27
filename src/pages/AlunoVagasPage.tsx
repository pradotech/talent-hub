import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { vagasService } from '../services/vagasService';
import { alunosService } from '../services/alunosService';
import { candidaturasService } from '../services/candidaturasService';
import type { Vaga, Aluno, Candidatura } from '../types';
import { VagaCard } from '../components/VagaCard';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { formatDate } from '../lib/utils';
import { formatVagaForSharing, getWhatsAppShareUrl, getVagaSystemUrl } from '../lib/shareUtils';
import { Search, MapPin, Calendar, DollarSign, CheckCircle2, Building2, Link as LinkIcon, Copy } from 'lucide-react';

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

      setVagas(vagasData);
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
        title={selectedVaga?.titulo || 'Detalhes da Vaga'}
        subtitle={selectedVaga?.empresa}
        maxWidth="lg"
      >
        {selectedVaga && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Modalidade: {selectedVaga.modalidade}</span>
              </div>
              {selectedVaga.remuneracao && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Bolsa: {selectedVaga.remuneracao}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Empresa: {selectedVaga.empresa}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Prazo: {formatDate(selectedVaga.dataLimite)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Descrição da Vaga / Atividades
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                {selectedVaga.descricao}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Competências Requeridas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedVaga.competenciasNecessarias.map((c) => (
                  <Tag key={c} label={c} variant="default" size="sm" />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const text = formatVagaForSharing(selectedVaga);
                    await navigator.clipboard.writeText(text);
                    setFeedbackMessage('Dados e link da vaga copiados para a área de transferência!');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex-1 sm:flex-initial"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Copiar Vaga
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const link = getVagaSystemUrl(selectedVaga.id);
                    await navigator.clipboard.writeText(link);
                    setFeedbackMessage('Link direto da vaga copiado com sucesso!');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex-1 sm:flex-initial"
                  title="Copiar link direto para esta vaga"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  Copiar Link
                </button>
                <a
                  href={getWhatsAppShareUrl(selectedVaga)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors flex-1 sm:flex-initial"
                >
                  Enviar no WhatsApp ↗
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCloseModal} className="w-full sm:w-auto">
                  Fechar
                </Button>
                {selectedVaga.linkInscricao && (
                  <a
                    href={selectedVaga.linkInscricao.startsWith('http') ? selectedVaga.linkInscricao : `https://${selectedVaga.linkInscricao}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center font-medium text-xs px-3.5 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 transition-colors w-full sm:w-auto text-center"
                  >
                    Página da Vaga ↗
                  </a>
                )}
                {role === 'aluno' ? (
                  <Button
                    variant={isVagaApplied(selectedVaga.id) ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={isVagaApplied(selectedVaga.id) || isApplying}
                    onClick={() => handleApply(selectedVaga)}
                    className="w-full sm:w-auto"
                  >
                    {isVagaApplied(selectedVaga.id) ? 'Candidatura já enviada' : 'Candidatar-se Internamente'}
                  </Button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium px-2 py-1.5 bg-slate-100 rounded border border-slate-200 text-center">
                    Visualização Institucional (Candidatura restrita a alunos)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

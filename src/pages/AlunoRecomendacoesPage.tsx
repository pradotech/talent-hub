import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import { recomendacoesService } from '../services/recomendacoesService';
import { candidaturasService } from '../services/candidaturasService';
import type { VagaRecomendada, Aluno, Candidatura } from '../types';
import { VagaCard } from '../components/VagaCard';
import { Modal } from '../components/Modal';
import { Tag } from '../components/Tag';
import { Button } from '../components/Button';
import { formatDate } from '../lib/utils';
import { formatVagaForSharing, getWhatsAppShareUrl, getVagaSystemUrl } from '../lib/shareUtils';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  DollarSign,
  Building2,
  Link as LinkIcon,
  Copy
} from 'lucide-react';

export const AlunoRecomendacoesPage: React.FC = () => {
  const { user, role } = useAuth();

  // O administrador não possui perfil de competências nem recomendações
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [vagasRecomendadas, setVagasRecomendadas] = useState<VagaRecomendada[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal de Detalhes e Candidatura
  const [selectedVaga, setSelectedVaga] = useState<VagaRecomendada | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const usuarioId = user?.id || 'user-aluno-1';

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const alunoData = await alunosService.getAlunoByUsuarioId(usuarioId);
      setAluno(alunoData);

      if (alunoData) {
        const [recomendadas, cands] = await Promise.all([
          recomendacoesService.getVagasRecomendadas(alunoData.competencias),
          candidaturasService.getCandidaturasByAluno(alunoData.id),
        ]);
        setVagasRecomendadas(recomendadas);
        setCandidaturas(cands);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [usuarioId]);

  const handleApply = async (vaga: VagaRecomendada) => {
    if (!aluno) return;
    setIsApplying(true);
    try {
      await candidaturasService.createCandidatura(vaga, aluno);
      setFeedbackMessage(`Candidatura para "${vaga.titulo}" enviada com sucesso!`);
      const cands = await candidaturasService.getCandidaturasByAluno(aluno.id);
      setCandidaturas(cands);
      setSelectedVaga(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedbackMessage(err.message);
      } else {
        setFeedbackMessage('Erro ao enviar candidatura.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const isVagaApplied = (vagaId: string) => {
    return candidaturas.some((c) => c.vagaId === vagaId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 text-left">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e9f2dc] text-[#084734] border border-[#abbd88]/40">
              <Sparkles className="w-3 h-3 text-fia-deep" />
              Saber para agir • Matching Inteligente
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-slate-900 flex items-center gap-2 text-left">
            Vagas Recomendadas para o seu Perfil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-left">
            Motor de matching que compara suas competências do currículo com as exigências das vagas abertas.
          </p>
        </div>

        <Link to="/aluno/curriculo">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Gerenciar Competências ({aluno?.competencias.length || 0})
          </Button>
        </Link>
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

      {/* Grid de Recomendações */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
          Calculando índice de aderência de competências...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vagasRecomendadas.map((vaga) => (
            <VagaCard
              key={vaga.id}
              vaga={vaga}
              isApplied={isVagaApplied(vaga.id)}
              onApply={() => handleApply(vaga)}
              onViewDetails={() => setSelectedVaga(vaga)}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalhes da Vaga com Análise de Compatibilidade */}
      <Modal
        isOpen={!!selectedVaga}
        onClose={() => setSelectedVaga(null)}
        title={selectedVaga?.titulo || 'Detalhes da Oportunidade'}
        subtitle={selectedVaga?.empresa}
        maxWidth="lg"
      >
        {selectedVaga && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Bloco de Aderência */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Índice de Compatibilidade
                </span>
                <span className="text-xl font-bold text-fia-navy">
                  {selectedVaga.aderenciaPorcentagem}% de Aderência
                </span>
              </div>
              <span className="text-[11px] text-slate-500 max-w-[180px] text-right">
                Calculado com base em {selectedVaga.competenciasNecessarias.length} requisitos técnicos da vaga.
              </span>
            </div>

            {/* Metadados */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-100 rounded text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Modalidade: {selectedVaga.modalidade}</span>
              </div>
              {selectedVaga.remuneracao && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bolsa: {selectedVaga.remuneracao}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Empresa: {selectedVaga.empresa}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Prazo: {formatDate(selectedVaga.dataLimite)}</span>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Sobre a Vaga / Atividades
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">
                {selectedVaga.descricao}
              </p>
            </div>

            {/* Análise de Competências em Comum vs Faltantes */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
                  Competências no seu Perfil ({selectedVaga.competenciasEmComum.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVaga.competenciasEmComum.length > 0 ? (
                    selectedVaga.competenciasEmComum.map((c) => (
                      <Tag key={c} label={c} variant="matched" size="sm" />
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px]">Nenhuma competência em comum identificada.</span>
                  )}
                </div>
              </div>

              {selectedVaga.competenciasFaltantes.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Competências a Desenvolver ({selectedVaga.competenciasFaltantes.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVaga.competenciasFaltantes.map((c) => (
                      <Tag key={c} label={c} variant="missing" size="sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
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
                <Button variant="outline" size="sm" onClick={() => setSelectedVaga(null)} className="w-full sm:w-auto">
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
                <Button
                  variant={isVagaApplied(selectedVaga.id) ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={isVagaApplied(selectedVaga.id) || isApplying}
                  onClick={() => handleApply(selectedVaga)}
                  className="w-full sm:w-auto"
                >
                  {isVagaApplied(selectedVaga.id) ? 'Candidatura já enviada' : 'Confirmar Candidatura'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import { recomendacoesService } from '../services/recomendacoesService';
import { candidaturasService } from '../services/candidaturasService';
import type { VagaRecomendada, Aluno, Candidatura } from '../types';
import { VagaCard } from '../components/VagaCard';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { formatDate } from '../lib/utils';
import { getWhatsAppShareUrl, getVagaSystemUrl } from '../lib/shareUtils';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  DollarSign,
  Building2,
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

            {/* Bloco Nobre de Aderência */}
            <div className="p-4 bg-[#084734]/5 border border-[#084734]/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#084734] text-fia-lime flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {selectedVaga.aderenciaPorcentagem}%
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#084734] uppercase tracking-wider">
                    {selectedVaga.aderenciaPorcentagem >= 70 ? 'Forte Compatibilidade' : 'Compatibilidade em Desenvolvimento'}
                  </h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Calculado com base em {selectedVaga.competenciasNecessarias.length} requisitos da oportunidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sobre a Oportunidade & Atividades
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedVaga.descricao}
              </p>
            </div>

            {/* Análise de Competências em Comum vs Faltantes */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#084734] block mb-2">
                  ✓ Competências no seu Perfil ({selectedVaga.competenciasEmComum.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedVaga.competenciasEmComum.length > 0 ? (
                    selectedVaga.competenciasEmComum.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#084734]/10 text-[#084734] border border-[#084734]/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#084734]" />
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">Nenhuma competência em comum identificada ainda.</span>
                  )}
                </div>
              </div>

              {selectedVaga.competenciasFaltantes.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Competências Complementares ({selectedVaga.competenciasFaltantes.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedVaga.competenciasFaltantes.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem de Feedback de Cópia */}
            {feedbackMessage && (
              <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-center animate-fade-in">
                {feedbackMessage}
              </div>
            )}

            {/* Rodapé Elegante */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Opções de Compartilhamento à esquerda */}
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
                  title="Copiar link direto"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Link</span>
                </button>

                <a
                  href={getWhatsAppShareUrl(selectedVaga)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg transition-colors"
                >
                  <span>WhatsApp ↗</span>
                </a>
              </div>

              {/* Botões Principais de Decisão à direita */}
              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedVaga(null)}
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
                  <span>{isVagaApplied(selectedVaga.id) ? 'Candidatura Enviada' : 'Confirmar Candidatura'}</span>
                  {!isVagaApplied(selectedVaga.id) && <CheckCircle2 className="w-3.5 h-3.5 text-fia-lime" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

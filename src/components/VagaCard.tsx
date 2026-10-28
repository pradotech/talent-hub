import React, { useState } from 'react';
import type { Vaga, VagaRecomendada } from '../types';
import { Card, CardBody } from './Card';
import { formatDate } from '../lib/utils';
import { formatVagaForSharing, getWhatsAppShareUrl } from '../lib/shareUtils';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Copy, 
  Check, 
  Share2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface VagaCardProps {
  vaga: Vaga | VagaRecomendada;
  onApply?: (vaga: Vaga) => void;
  onViewDetails?: (vaga: Vaga) => void;
  isApplied?: boolean;
  showAdminView?: boolean;
  onManageCandidates?: (vaga: Vaga) => void;
  onToggleStatus?: (vaga: Vaga) => void;
}

export const VagaCard: React.FC<VagaCardProps> = ({
  vaga,
  onApply,
  onViewDetails,
  isApplied = false,
  showAdminView = false,
  onManageCandidates,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const isRecomendada = 'aderenciaPorcentagem' in vaga;
  const recomendada = isRecomendada ? (vaga as VagaRecomendada) : null;

  const handleCopyVaga = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatVagaForSharing(vaga);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getWhatsAppShareUrl(vaga);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl hover:border-[#142d59]/30 hover:shadow-lg transition-all duration-200 group text-left overflow-hidden">
      <CardBody className="flex-1 flex flex-col p-5 sm:p-6">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0 group-hover:bg-[#142d59]/10 group-hover:text-[#142d59] group-hover:border-[#142d59]/20 transition-all">
              {vaga.empresa ? vaga.empresa.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {vaga.empresa}
              </span>
              <h3 
                onClick={() => onViewDetails && onViewDetails(vaga)}
                className="text-base font-bold text-slate-900 group-hover:text-[#142d59] transition-colors leading-snug cursor-pointer truncate capitalize"
                title={vaga.titulo}
              >
                {vaga.titulo}
              </h3>
            </div>
          </div>

          {/* Badge de Aderência ou Status */}
          {recomendada && typeof recomendada.aderenciaPorcentagem === 'number' && (
            <div
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                recomendada.aderenciaPorcentagem >= 70
                  ? 'bg-[#084734]/10 text-[#084734] border-[#084734]/25'
                  : recomendada.aderenciaPorcentagem >= 40
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title="Aderência de competências calculada pelo perfil do aluno"
            >
              <Sparkles className="w-3 h-3" />
              <span>{recomendada.aderenciaPorcentagem}% Match</span>
            </div>
          )}

          {showAdminView && (
            <span
              className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${
                vaga.status === 'aberta'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {vaga.status === 'aberta' ? 'Ativa' : 'Encerrada'}
            </span>
          )}
        </div>

        {/* Descrição resumida */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {vaga.descricao}
        </p>

        {/* Chips de Metadados: Modalidade, Bolsa e Prazo */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500 mb-4 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {vaga.modalidade}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            {vaga.remuneracao ? vaga.remuneracao : 'A combinar'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Até {formatDate(vaga.dataLimite)}
          </span>
        </div>

        {/* Competências Requeridas (Tags) */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {vaga.competenciasNecessarias.slice(0, 4).map((skill) => {
              const isMatched =
                recomendada &&
                recomendada.competenciasEmComum &&
                recomendada.competenciasEmComum.some(
                  (c) => c.toLowerCase() === skill.toLowerCase()
                );

              return (
                <span
                  key={skill}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-medium ${
                    isMatched
                      ? 'bg-[#084734]/10 text-[#084734] border-[#084734]/25 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {skill}
                </span>
              );
            })}
            {vaga.competenciasNecessarias.length > 4 && (
              <span className="text-[11px] text-slate-400 self-center pl-1 font-medium">
                +{vaga.competenciasNecessarias.length - 4}
              </span>
            )}
          </div>
        </div>
      </CardBody>

      {/* Rodapé Elegante com Ações e Compartilhamento */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-t border-slate-100 gap-2">
        {/* Ações de Compartilhamento à esquerda */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyVaga}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
            title="Copiar dados da vaga"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-lg transition-all cursor-pointer"
            title="Compartilhar no WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botões Principais à direita */}
        <div className="flex items-center gap-2">
          {showAdminView ? (
            <>
              <button
                type="button"
                onClick={() => onManageCandidates && onManageCandidates(vaga)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                Inscritos
              </button>
              {onToggleStatus && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(vaga)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  {vaga.status === 'aberta' ? 'Encerrar' : 'Reabrir'}
                </button>
              )}
            </>
          ) : (
            <>
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(vaga)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
                >
                  Ver Detalhes
                </button>
              )}

              {onApply && (
                <button
                  type="button"
                  disabled={isApplied || vaga.status === 'encerrada'}
                  onClick={() => onApply(vaga)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
                    isApplied
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                      : 'bg-[#142d59] hover:bg-[#0f2347] text-white border border-[#142d59]'
                  }`}
                >
                  <span>{isApplied ? 'Inscrito' : 'Candidatar-se'}</span>
                  {!isApplied && <ArrowUpRight className="w-3.5 h-3.5 text-fia-lime" />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

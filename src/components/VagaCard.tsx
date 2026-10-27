import React, { useState } from 'react';
import type { Vaga, VagaRecomendada } from '../types';
import { Card, CardBody, CardFooter } from './Card';
import { Tag } from './Tag';
import { Button } from './Button';
import { formatDate } from '../lib/utils';
import { formatVagaForSharing, getWhatsAppShareUrl } from '../lib/shareUtils';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Building2, 
  Copy, 
  Check, 
  Share2 
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
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
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
    <Card className="flex flex-col h-full border-slate-200">
      <CardBody className="flex-1 flex flex-col p-5">
        {/* Header do Card: Empresa e Status */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-4 mb-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#142d59] uppercase tracking-wider bg-[#eef3fa] border border-[#d0dff2] px-2.5 py-0.5 rounded-md truncate max-w-full">
              <Building2 className="w-3.5 h-3.5 text-[#142d59] shrink-0" />
              <span className="truncate">{vaga.empresa}</span>
            </span>
            <h3 className="text-base font-bold tracking-tight text-slate-900 leading-snug hover:text-fia-deep transition-colors pt-1">
              {vaga.titulo}
            </h3>
          </div>

          {/* Badge de recomendação / aderência com cores FIA */}
          {recomendada && (
            <div
              className={`shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold border ${
                recomendada.aderenciaPorcentagem >= 70
                  ? 'bg-[#e9f2dc] text-[#084734] border-[#abbd88] font-bold shadow-2xs'
                  : recomendada.aderenciaPorcentagem >= 40
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
              title="Aderência de competências calculada pelo perfil"
            >
              {recomendada.aderenciaPorcentagem}% aderência
            </div>
          )}

          {showAdminView && (
            <span
              className={`shrink-0 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
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
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {vaga.descricao}
        </p>

        {/* Metadados: Modalidade, Remuneração e Prazo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-slate-500 mb-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{vaga.modalidade}</span>
          </div>

          {vaga.remuneracao ? (
            <div className="flex items-center gap-1.5 truncate">
              <DollarSign className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{vaga.remuneracao}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 truncate text-slate-400">
              <span>A combinar</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 truncate sm:col-span-2">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Inscrições até: {formatDate(vaga.dataLimite)}</span>
          </div>
        </div>

        {/* Competências / Skills Tags */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
            Requisitos de Competências:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {vaga.competenciasNecessarias.map((skill) => {
              const isMatched =
                recomendada &&
                recomendada.competenciasEmComum.some(
                  (c) => c.toLowerCase() === skill.toLowerCase()
                );

              return (
                <Tag
                  key={skill}
                  label={skill}
                  variant={isMatched ? 'matched' : 'default'}
                  size="sm"
                />
              );
            })}
          </div>
        </div>
      </CardBody>

      {/* Footer com Compartilhamento e Ações */}
      <CardFooter className="flex flex-col gap-2.5 bg-slate-50/80 p-3">
        {/* Barra de divulgação (Copiar e WhatsApp) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 w-full pt-0.5 text-xs text-slate-500 border-b border-slate-200/60 pb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Divulgar:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyVaga}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              title="Copiar dados da vaga para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              title="Enviar dados formatados desta vaga no WhatsApp"
            >
              <Share2 className="w-3 h-3 text-emerald-700" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Ações principais */}
        {showAdminView ? (
          <div className="flex items-center gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageCandidates && onManageCandidates(vaga)}
            >
              Ver Inscritos
            </Button>
            {onToggleStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStatus(vaga)}
                className="text-slate-600 text-xs"
              >
                {vaga.status === 'aberta' ? 'Encerrar Vaga' : 'Reabrir Vaga'}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full justify-between">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(vaga)}
                className="text-slate-600 hover:text-slate-900"
              >
                Detalhes
              </Button>
            )}
            {onApply && (
              <Button
                variant={isApplied ? 'secondary' : 'primary'}
                size="sm"
                disabled={isApplied || vaga.status === 'encerrada'}
                onClick={() => onApply(vaga)}
              >
                {isApplied ? 'Inscrição Enviada' : 'Candidatar-se'}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

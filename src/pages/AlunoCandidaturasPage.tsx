import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import { candidaturasService } from '../services/candidaturasService';
import type { Candidatura } from '../types';
import { Card, CardBody } from '../components/Card';
import { Tag } from '../components/Tag';
import { Button } from '../components/Button';
import { formatDate } from '../lib/utils';
import { UserCheck, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export const AlunoCandidaturasPage: React.FC = () => {
  const { user, role } = useAuth();

  // Administrador não possui candidaturas
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const usuarioId = user?.id || 'user-aluno-1';

  useEffect(() => {
    const carregar = async () => {
      setIsLoading(true);
      try {
        const alunoData = await alunosService.getAlunoByUsuarioId(usuarioId);
        if (alunoData) {
          const list = await candidaturasService.getCandidaturasByAluno(alunoData.id);
          setCandidaturas(list);
        }
      } finally {
        setIsLoading(false);
      }
    };
    carregar();
  }, [usuarioId]);

  const renderStatusBadge = (status: Candidatura['status']) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Aprovado para Entrevista
          </span>
        );
      case 'em_analise':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Em Análise Docente
          </span>
        );
      case 'rejeitado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            Processo Concluído
          </span>
        );
      case 'pendente':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Inscrição Recebida
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
          Acompanhamento de Processos
        </span>
        <h1 className="text-2xl font-bold text-fia-navy flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-fia-navy" />
          Minhas Candidaturas
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Histórico e status das suas participações em processos seletivos e vagas da plataforma
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
          Carregando suas candidaturas...
        </div>
      ) : candidaturas.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            Você ainda não enviou nenhuma candidatura
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore as vagas abertas ou confira as oportunidades recomendadas de acordo com as
            competências do seu currículo.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/aluno/recomendacoes">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Ver Vagas Recomendadas
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {candidaturas.map((candidatura) => (
            <Card key={candidatura.id} className="border-slate-200">
              <CardBody className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {candidatura.vagaTitulo || 'Vaga Institucional FIA'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Enviada em {formatDate(candidatura.criadaEm)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {renderStatusBadge(candidatura.status)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Competências vinculadas na submissão:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {candidatura.alunoCompetencias.slice(0, 5).map((comp) => (
                        <Tag key={comp} label={comp} variant="default" size="sm" />
                      ))}
                      {candidatura.alunoCompetencias.length > 5 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{candidatura.alunoCompetencias.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {candidatura.compatibilidadeScore !== undefined && (
                    <div className="shrink-0 text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Aderência registrada
                      </span>
                      <span className="text-sm font-bold text-fia-navy">
                        {candidatura.compatibilidadeScore}%
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

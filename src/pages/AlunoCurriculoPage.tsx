import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import type { Aluno } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Info,
  ExternalLink 
} from 'lucide-react';

import { Navigate } from 'react-router-dom';

export const AlunoCurriculoPage: React.FC = () => {
  const { user, role } = useAuth();

  // O administrador não possui opção nem permissão para subir currículo
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const usuarioId = user?.id || 'user-aluno-1';

  const carregarDadosAluno = async () => {
    const data = await alunosService.getAlunoByUsuarioId(usuarioId);
    setAluno(data);
  };

  useEffect(() => {
    carregarDadosAluno();
  }, [usuarioId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccessMessage(null);
    try {
      const result = await alunosService.uploadCurriculo(usuarioId, file);
      setAluno(result.alunoAtualizado);
      setSuccessMessage(
        `Currículo processado com sucesso! Foram identificadas e mapeadas ${result.competenciasExtraidas.length} competências no seu perfil.`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillInput.trim() || !aluno) return;
    const trimmed = newSkillInput.trim();
    if (aluno.competencias.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const updatedSkills = [...aluno.competencias, trimmed];
    const updated = await alunosService.updateCompetencias(usuarioId, updatedSkills);
    setAluno(updated);
    setNewSkillInput('');
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!aluno) return;
    const updatedSkills = aluno.competencias.filter((s) => s !== skillToRemove);
    const updated = await alunosService.updateCompetencias(usuarioId, updatedSkills);
    setAluno(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
          Perfil Acadêmico
        </span>
        <h1 className="text-2xl font-bold text-fia-navy">
          Currículo & Mapeamento de Competências
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Faça o upload do seu currículo em PDF para que o sistema extraia suas competências e recomende vagas sob medida
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-slate-900 text-white text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload de Currículo */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. Upload do Currículo (PDF)
              </h2>
              <p className="text-xs text-slate-500">
                O arquivo é armazenado de forma segura e utilizado pelo algoritmo de recomendação
              </p>
            </div>
            {aluno?.curriculoUrl && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium self-start sm:self-auto">
                <CheckCircle className="w-3.5 h-3.5" />
                Currículo Ativo
              </span>
            )}
          </div>
        </CardHeader>

        <CardBody className="p-4 sm:p-6">
          <div className="border-2 border-dashed border-slate-300 rounded p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-800">
              Clique para selecionar seu currículo ou arraste o arquivo aqui
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Formatos aceitos: PDF (máx. 10MB)
            </p>

            <div className="mt-4">
              <label className="inline-block cursor-pointer w-full sm:w-auto">
                <span className="inline-flex items-center justify-center font-medium text-xs px-3.5 py-2.5 sm:py-2 rounded bg-fia-navy text-white hover:bg-fia-navy-800 transition-colors shadow-xs w-full sm:w-auto">
                  {isUploading ? 'Processando e Extraindo Competências...' : 'Selecionar Arquivo PDF'}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {aluno?.curriculoNomeArquivo && (
            <div className="mt-4 p-3 bg-white border border-slate-200 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium min-w-0">
                <FileText className="w-4 h-4 text-fia-navy shrink-0" />
                <span className="truncate">{aluno.curriculoNomeArquivo}</span>
              </div>
              {aluno.curriculoUrl && (
                <a
                  href={aluno.curriculoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fia-accent hover:underline inline-flex items-center gap-1 text-[11px] shrink-0"
                >
                  Visualizar PDF
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Competências Extraídas e Gestão de Tags */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fia-navy" />
                2. Competências e Conhecimentos Associados
              </h2>
              <p className="text-xs text-slate-500">
                Tags extraídas automaticamente pelo sistema. Você pode adicionar ou remover competências para calibrar as recomendações.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded self-start sm:self-auto">
              {aluno?.competencias.length || 0} competências
            </span>
          </div>
        </CardHeader>

        <CardBody className="p-4 sm:p-6 space-y-4">
          {/* Input para adicionar nova competência */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Adicionar nova competência (ex: Econometria, Tableau, Negociação)..."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSkill}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              Adicionar
            </Button>
          </div>

          {/* Tags do Aluno */}
          <div className="pt-2">
            {aluno?.competencias && aluno.competencias.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {aluno.competencias.map((comp) => (
                  <Tag
                    key={comp}
                    label={comp}
                    variant="matched"
                    size="md"
                    onRemove={() => handleRemoveSkill(comp)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                Nenhuma competência vinculada ainda. Envie seu currículo ou adicione manualmente acima.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-2 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Dica de Matching:</strong> Quanto mais alinhadas estiverem suas competências
              com os requisitos cadastrados pelos professores, maior será sua porcentagem de
              aderência no ranking das vagas.
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { vagasService } from '../services/vagasService';
import type { ModalidadeVaga } from '../types';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { ArrowLeft, Plus, Check, Building2, Link as LinkIcon, ShieldCheck } from 'lucide-react';

const novaVagaSchema = z.object({
  titulo: z.string().min(4, 'O título da vaga deve ter no mínimo 4 caracteres'),
  empresa: z.string().min(2, 'Informe o nome da empresa ou instituição contratante'),
  departamento: z.string().optional(),
  modalidade: z.enum(['Presencial', 'Híbrido', 'Remoto']),
  remuneracao: z.string().optional(),
  linkInscricao: z.string().optional(),
  dataLimite: z.string().min(1, 'Defina a data limite para inscrições'),
  descricao: z.string().min(20, 'A descrição deve ter no mínimo 20 caracteres detalhando a oportunidade'),
});

type NovaVagaFormData = z.infer<typeof novaVagaSchema>;

const SUGGESTED_SKILLS = [
  'Python',
  'SQL',
  'Excel Avançado',
  'Power BI',
  'Modelagem Financeira',
  'Valuation',
  'Gestão de Projetos',
  'Scrum',
  'React',
  'TypeScript',
  'Contabilidade',
  'Estatística',
  'Inglês Avançado',
];

export const AdminNovaVagaPage: React.FC = () => {
  const navigate = useNavigate();

  const [skills, setSkills] = useState<string[]>(['Excel Avançado', 'Modelagem Financeira']);
  const [skillInput, setSkillInput] = useState<string>('');
  const [skillError, setSkillError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaVagaFormData>({
    resolver: zodResolver(novaVagaSchema),
    defaultValues: {
      modalidade: 'Híbrido',
      dataLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError('Esta competência já foi adicionada.');
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput('');
    setSkillError(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const onSubmit = async (data: NovaVagaFormData) => {
    if (skills.length === 0) {
      setSkillError('Adicione pelo menos 1 competência requerida para calibrar o motor de recomendação.');
      return;
    }

    try {
      await vagasService.createVaga({
        titulo: data.titulo,
        empresa: data.empresa,
        departamento: data.departamento || undefined,
        modalidade: data.modalidade as ModalidadeVaga,
        remuneracao: data.remuneracao || undefined,
        linkInscricao: data.linkInscricao || undefined,
        dataLimite: data.dataLimite,
        descricao: data.descricao,
        competenciasNecessarias: skills,
      });

      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Botão de retorno e cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="text-slate-500 hover:text-slate-900 transition-colors p-1"
          aria-label="Voltar para dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-fia-navy">Cadastrar Nova Vaga</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-fia-navy" />
              Administração
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cadastre oportunidades corporativas de empresas parceiras para os alunos da FIA
          </p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardBody className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Título e Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Vaga / Cargo *
                </label>
                <input
                  type="text"
                  {...register('titulo')}
                  placeholder="Ex: Analista de M&A e Finanças Corporativas"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                />
                {errors.titulo && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.titulo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Empresa / Organização Contratante *
                </label>
                <input
                  type="text"
                  {...register('empresa')}
                  placeholder="Ex: BTG Pactual, Itaú BBA, Ambev, FIA LABS"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                />
                {errors.empresa && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.empresa.message}</p>
                )}
              </div>
            </div>

            {/* Modalidade, Remuneração e Prazo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modalidade de Atuação *
                </label>
                <select
                  {...register('modalidade')}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                >
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                </select>
                {errors.modalidade && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.modalidade.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faixa Salarial / Bolsa (opcional)
                </label>
                <input
                  type="text"
                  {...register('remuneracao')}
                  placeholder="Ex: R$ 4.500,00 ou A combinar"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo Limite de Inscrição *
                </label>
                <input
                  type="date"
                  {...register('dataLimite')}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                />
                {errors.dataLimite && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.dataLimite.message}</p>
                )}
              </div>
            </div>

            {/* Link de inscrição externa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                Link de Inscrição Oficial da Empresa (opcional)
              </label>
              <input
                type="text"
                {...register('linkInscricao')}
                placeholder="Ex: https://vagas.empresa.com.br/posicao-123"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se preenchido, os alunos poderão acessar diretamente o portal de recrutamento oficial da empresa.
              </p>
            </div>

            {/* Competências / Skills Requeridas */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Requisitos Técnicos e Competências (Tags) *
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tags utilizadas no motor de compatibilidade de currículos dos alunos da FIA.
                </p>
              </div>

              {/* Input de tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  placeholder="Digite uma competência (ex: SQL, Valuation) e tecle Enter"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddSkill(skillInput)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar
                </Button>
              </div>

              {skillError && <p className="text-[11px] text-red-600">{skillError}</p>}

              {/* Tags selecionadas */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <Tag
                    key={skill}
                    label={skill}
                    variant="matched"
                    onRemove={() => handleRemoveSkill(skill)}
                  />
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                  Sugestões:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleAddSkill(suggestion)}
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Detalhada das Atividades *
              </label>
              <textarea
                {...register('descricao')}
                rows={5}
                placeholder="Descreva as responsabilidades da posição, modelo de trabalho, benefícios e requisitos comportamentais..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-fia-navy focus:border-fia-navy outline-none"
              />
              {errors.descricao && (
                <p className="text-[11px] text-red-600 mt-1">{errors.descricao.message}</p>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Check className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Publicar Vaga no Mural
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

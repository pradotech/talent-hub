import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import { curriculoParserService } from '../services/curriculoParserService';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import {
  UploadCloud,
  Sparkles,
  AlertCircle,
  Plus,
  ArrowRight,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
} from 'lucide-react';
import fiaLogoDarkImg from '../assets/fia-logo-dark.png';

const SUGGESTED_SKILLS = [
  'Python',
  'SQL',
  'Excel Avançado',
  'Power BI',
  'Modelagem Financeira',
  'Valuation',
  'Gestão de Projetos',
  'Scrum',
  'Contabilidade',
  'Estatística',
  'Inglês Avançado',
  'Machine Learning',
  'Finanças Corporativas',
  'Tableau',
];

export const AlunoOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const usuarioId = user?.id || '';

  // Estados do formulário
  const [nome, setNome] = useState<string>(user?.nome && user.nome !== 'Usuário' ? user.nome : '');
  const [idade, setIdade] = useState<string>('');
  const [graduacao, setGraduacao] = useState<string>('');
  const [segundaGraduacao, setSegundaGraduacao] = useState<string>('');
  const [experiencia, setExperiencia] = useState<string>('');
  const [competencias, setCompetencias] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Estados do arquivo e parsing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Carrega dados já existentes caso haja
    if (usuarioId) {
      alunosService.getAlunoByUsuarioId(usuarioId).then((perfil) => {
        if (perfil) {
          if (perfil.nome && !nome) setNome(perfil.nome);
          if (perfil.idade && !idade) setIdade(String(perfil.idade));
          if (perfil.graduacao && !graduacao) setGraduacao(perfil.graduacao);
          if (perfil.experiencia && !experiencia) setExperiencia(perfil.experiencia);
          if (perfil.competencias && perfil.competencias.length > 0 && competencias.length === 0) {
            setCompetencias(perfil.competencias);
          }
        }
      });
    }
  }, [usuarioId]);

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseSuccessMsg(null);
    setErrorMessage(null);

    try {
      const extracted = await curriculoParserService.parseCurriculo(file);

      // Preenche os campos automaticamente com o que foi extraído
      if (extracted.nome) {
        const isEmailFallback = !nome || (user?.email && nome.toLowerCase() === user.email.split('@')[0].toLowerCase());
        if (isEmailFallback || !nome) {
          setNome(extracted.nome);
        }
      }
      if (extracted.idade) {
        setIdade(String(extracted.idade));
      }
      if (extracted.graduacao) {
        setGraduacao(extracted.graduacao);
      }
      if (extracted.segundaGraduacao) {
        setSegundaGraduacao(extracted.segundaGraduacao);
      }
      if (extracted.experiencia) {
        setExperiencia(extracted.experiencia);
      }

      // Mescla competências identificadas sem duplicatas
      const infoGrad = extracted.segundaGraduacao ? ' e 2 formações acadêmicas' : '';
      if (extracted.competencias.length > 0) {
        const merged = Array.from(new Set([...competencias, ...extracted.competencias]));
        setCompetencias(merged);
        setParseSuccessMsg(
          `Currículo analisado! Identificamos ${extracted.competencias.length} competências${infoGrad} mapeadas para as oportunidades da FIA.`
        );
      } else {
        setParseSuccessMsg(
          `Arquivo recebido com sucesso${infoGrad ? ` (${infoGrad.trim()})` : ''}. Revise os campos preenchidos e informe suas competências caso necessário.`
        );
      }
    } catch (err) {
      console.warn('Erro na extração:', err);
      setParseSuccessMsg('Arquivo anexado com sucesso.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (competencias.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setCompetencias([...competencias, trimmed]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCompetencias(competencias.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!idade || parseInt(idade, 10) < 16) {
      setErrorMessage('Por favor, informe uma idade válida.');
      return;
    }
    if (!graduacao.trim()) {
      setErrorMessage('Por favor, informe seu curso ou graduação.');
      return;
    }
    if (competencias.length === 0) {
      setErrorMessage('Adicione pelo menos 1 competência para calibrar o motor de vagas recomendadas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let fileUrl = '';
      if (selectedFile) {
        fileUrl = URL.createObjectURL(selectedFile);
      }

      const graduacaoFinal = segundaGraduacao.trim()
        ? `${graduacao.trim()} • ${segundaGraduacao.trim()}`
        : graduacao.trim();

      await alunosService.completarOnboarding(usuarioId, {
        nome: nome.trim(),
        idade: parseInt(idade, 10),
        graduacao: graduacaoFinal,
        experiencia: experiencia.trim() || undefined,
        competencias,
        curriculoUrl: fileUrl || undefined,
        curriculoNomeArquivo: selectedFile?.name || undefined,
      });

      // Redireciona diretamente para o motor de recomendações
      navigate('/aluno/recomendacoes', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Falha ao concluir o perfil. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Topo Institucional */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <img src={fiaLogoDarkImg} alt="FIA Business School" className="h-8 w-auto object-contain" />
            <div className="flex flex-col text-left pl-2.5 border-l border-slate-200">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                Talent Hub
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#142d59] font-semibold mt-1">
                Primeiro Acesso • Perfil do Aluno
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">Passo Único de Boas-Vindas</span>
        </div>

        {/* Título e Orientação */}
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complete seu perfil profissional
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Anexe seu currículo em <strong>PDF</strong> ou <strong>Word (.docx)</strong>. Nosso sistema extrairá
            automaticamente suas competências para calcular o <strong>match perfeito</strong> com as oportunidades da FIA.
          </p>
        </div>

        {/* Feedback de Erro */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* 1. ZONA DE UPLOAD DO CURRÍCULO COM EXTRAÇÃO INTELIGENTE */}
          <Card className="border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Upload de Currículo (PDF ou Word)
              </label>

              <div className="relative border-2 border-dashed border-slate-300 hover:border-fia-deep rounded-xl p-6 text-center transition-all bg-slate-50/60 hover:bg-white group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-[#eef3fa] flex items-center justify-center transition-colors">
                    {isParsing ? (
                      <div className="w-6 h-6 border-2 border-[#142d59]/30 border-t-[#142d59] rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-[#142d59]" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {isParsing
                        ? 'Lendo documento e extraindo competências...'
                        : selectedFile
                        ? `Arquivo selecionado: ${selectedFile.name}`
                        : 'Arraste ou clique para selecionar seu currículo'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formatos aceitos: PDF ou Word (.docx / .doc) de até 10 MB
                    </p>
                  </div>
                </div>
              </div>

              {parseSuccessMsg && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{parseSuccessMsg}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 2. DADOS BÁSICOS PREENCHIDOS AUTOMATICAMENTE */}
          <Card className="border-slate-200 shadow-sm">
            <CardBody className="p-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Informações Pessoais & Formação
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 text-left">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                      required
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Idade *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min={16}
                      max={90}
                      value={idade}
                      onChange={(e) => setIdade(e.target.value)}
                      placeholder="Ex: 22"
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 1ª Graduação / Formação Principal */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Graduação / Formação Principal *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={graduacao}
                    onChange={(e) => setGraduacao(e.target.value)}
                    placeholder="Ex: Administração, Economia, Engenharia ou Ciência de Dados"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                    required
                  />
                </div>
              </div>

              {/* 2ª Graduação ou Pós-Graduação / MBA */}
              <div className="text-left">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Segunda Graduação ou Pós-Graduação / MBA (Opcional)
                  </label>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Opcional</span>
                </div>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={segundaGraduacao}
                    onChange={(e) => setSegundaGraduacao(e.target.value)}
                    placeholder="Ex: Pós em Finanças, MBA em Gestão, Análise de Dados ou 2ª Graduação"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resumo de Experiência Profissional (Opcional)
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    value={experiencia}
                    onChange={(e) => setExperiencia(e.target.value)}
                    placeholder="Ex: Estagiário em Finanças na Empresa X (1 ano), atuação com conciliação e relatórios."
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 3. COMPETÊNCIAS PARA MATCH COM AS VAGAS */}
          <Card className="border-slate-200 shadow-sm">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Competências Identificadas (Tags para Match com Vagas) *
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Essas tags são cruzadas diretamente com os requisitos das vagas cadastradas no portal.
                  </p>
                </div>
                <span className="text-xs font-semibold text-fia-deep bg-slate-100 px-2 py-0.5 rounded">
                  {competencias.length} competência(s)
                </span>
              </div>

              {/* Lista de tags do aluno */}
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {competencias.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Nenhuma competência adicionada ainda. Anexe o currículo ou adicione abaixo.
                  </span>
                ) : (
                  competencias.map((skill) => (
                    <Tag
                      key={skill}
                      label={skill}
                      onRemove={() => handleRemoveSkill(skill)}
                    />
                  ))
                )}
              </div>

              {/* Input para adicionar nova tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  placeholder="Digitar nova competência (ex: SQL, Power BI, Valuation) e tecle Enter"
                  className="flex-1 text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fia-deep/15 focus:border-fia-deep"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSkill(newSkillInput)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Sugestões rápidas */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Sugestões frequentes nas vagas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.filter((s) => !competencias.includes(s)).slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* BOTÃO DE CONCLUSÃO */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-lg bg-[#142d59] hover:bg-[#0f2347] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border border-[#142d59]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando perfil e calculando aderência...</span>
                </>
              ) : (
                <>
                  <span>Concluir Perfil e Ver Vagas Aderentes</span>
                  <ArrowRight className="w-4 h-4 text-fia-lime" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { alunosService } from '../services/alunosService';
import type { Aluno } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Tag } from '../components/Tag';
import { Modal } from '../components/Modal';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Info,
  ExternalLink,
  GraduationCap,
  User,
  Calendar,
  Mail,
  Edit3
} from 'lucide-react';

export const AlunoCurriculoPage: React.FC = () => {
  const { user, role } = useAuth();

  // O administrador não possui opção de currículo de aluno
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal de edição de dados pessoais
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editNome, setEditNome] = useState<string>('');
  const [editIdade, setEditIdade] = useState<string>('');
  const [editGraduacao, setEditGraduacao] = useState<string>('');
  const [editSegundaGraduacao, setEditSegundaGraduacao] = useState<string>('');
  const [editExperiencia, setEditExperiencia] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const usuarioId = user?.id || '';

  const carregarDadosAluno = async () => {
    setIsLoading(true);
    try {
      const data = await alunosService.getAlunoByUsuarioId(usuarioId);
      if (data) {
        setAluno(data);
      } else if (user) {
        // Fallback inicial com dados de autenticação
        setAluno({
          id: user.id,
          usuarioId: user.id,
          nome: user.nome,
          email: user.email,
          competencias: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (usuarioId) {
      carregarDadosAluno();
    }
  }, [usuarioId]);

  const handleOpenEditModal = () => {
    if (!aluno) return;
    setEditNome(aluno.nome || '');
    setEditIdade(aluno.idade ? String(aluno.idade) : '');

    // Se houver mais de uma graduação separada por ponto
    if (aluno.graduacao && aluno.graduacao.includes(' • ')) {
      const parts = aluno.graduacao.split(' • ');
      setEditGraduacao(parts[0] || '');
      setEditSegundaGraduacao(parts[1] || '');
    } else {
      setEditGraduacao(aluno.graduacao || '');
      setEditSegundaGraduacao('');
    }

    setEditExperiencia(aluno.experiencia || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;
    setIsSaving(true);
    try {
      const graduacaoFinal = editSegundaGraduacao.trim()
        ? `${editGraduacao.trim()} • ${editSegundaGraduacao.trim()}`
        : editGraduacao.trim();

      const updated = await alunosService.completarOnboarding(usuarioId, {
        nome: editNome.trim(),
        idade: parseInt(editIdade, 10) || 20,
        graduacao: graduacaoFinal,
        experiencia: editExperiencia.trim() || undefined,
        competencias: aluno.competencias,
        curriculoUrl: aluno.curriculoUrl,
        curriculoNomeArquivo: aluno.curriculoNomeArquivo,
      });

      setAluno(updated);
      setIsEditModalOpen(false);
      setFeedbackMessage('Dados do perfil acadêmico atualizados com sucesso!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedbackMessage(null);
    try {
      const result = await alunosService.uploadCurriculo(usuarioId, file);
      setAluno(result.alunoAtualizado);
      setFeedbackMessage(
        `Currículo processado! ${result.competenciasExtraidas.length} competências foram extraídas e sincronizadas.`
      );
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      console.warn('Erro ao processar currículo:', err);
      setFeedbackMessage('Falha ao processar o arquivo. Tente novamente.');
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
    try {
      const updated = await alunosService.updateCompetencias(usuarioId, updatedSkills);
      setAluno(updated);
      setNewSkillInput('');
    } catch {
      // Atualização otimista
      setAluno({ ...aluno, competencias: updatedSkills });
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!aluno) return;
    const updatedSkills = aluno.competencias.filter((s) => s !== skillToRemove);
    try {
      const updated = await alunosService.updateCompetencias(usuarioId, updatedSkills);
      setAluno(updated);
    } catch {
      setAluno({ ...aluno, competencias: updatedSkills });
    }
  };

  // Separação visual das graduações se houver mais de uma
  const graduacoesList = aluno?.graduacao
    ? aluno.graduacao.split(' • ').map((g) => g.trim())
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 text-left">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-[#142d59]" />
            Talent Hub • FIA Business School
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Meu Perfil Acadêmico & Competências
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie seus dados pessoais, formação, currículo e as competências usadas no motor de recomendação.
          </p>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Editar Dados
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 text-left animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          Carregando dados do perfil acadêmico...
        </div>
      ) : (
        <div className="space-y-6">
          {/* CARD 1: DADOS PESSOAIS & FORMAÇÃO */}
          <Card className="border-slate-200 shadow-xs text-left">
            <CardHeader className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#142d59]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Informações Pessoais & Formação Acadêmica
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#084734] bg-[#084734]/10 border border-[#084734]/20 px-2.5 py-0.5 rounded-full">
                Aluno FIA
              </span>
            </CardHeader>

            <CardBody className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Nome Completo
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {aluno?.nome || 'Não informado'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    E-mail Institucional
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{aluno?.email || user?.email}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Idade
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{aluno?.idade ? `${aluno.idade} anos` : 'Não informada'}</span>
                  </p>
                </div>
              </div>

              {/* Formação Acadêmica */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Formação Acadêmica & Cursos:
                </span>
                {graduacoesList.length > 0 ? (
                  <div className="space-y-2">
                    {graduacoesList.map((grad, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <GraduationCap className="w-4 h-4 text-[#142d59] shrink-0" />
                        <span>
                          {idx === 0 ? '1ª Graduação: ' : '2ª Formação / Pós: '}
                          <strong className="text-[#142d59] font-bold">{grad}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma formação registrada ainda. Clique em "Editar Dados" para adicionar.
                  </p>
                )}
              </div>

              {/* Experiência Profissional */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Resumo de Experiência Profissional:
                </span>
                {aluno?.experiencia ? (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80 whitespace-pre-line">
                    {aluno.experiencia}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum resumo de experiência cadastrado no momento.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* CARD 2: CURRÍCULO ANEXADO */}
          <Card className="border-slate-200 shadow-xs text-left">
            <CardHeader className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#142d59]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Documento de Currículo (PDF ou Word)
                </h3>
              </div>
              {aluno?.curriculoNomeArquivo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Arquivo Vinculado
                </span>
              )}
            </CardHeader>

            <CardBody className="p-5 sm:p-6 space-y-4">
              {aluno?.curriculoNomeArquivo ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#142d59] font-bold shrink-0">
                      <FileText className="w-5 h-5 text-[#142d59]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {aluno.curriculoNomeArquivo}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Currículo utilizado para o cálculo de aderência com as vagas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {aluno.curriculoUrl && (
                      <a
                        href={aluno.curriculoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                      >
                        <span>Visualizar</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}

                    <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#142d59] bg-[#eef3fa] hover:bg-[#dce9f8] border border-[#c6dcf5] rounded-lg transition-colors cursor-pointer">
                      <span>Substituir</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">
                    {isUploading ? 'Processando e extraindo dados...' : 'Nenhum currículo anexado ainda'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Anexe seu currículo em PDF ou Word (.docx) para que o sistema extraia automaticamente suas competências.
                  </p>
                  <div className="mt-4">
                    <label className="inline-flex items-center justify-center font-medium text-xs px-4 py-2 rounded-lg bg-[#142d59] text-white hover:bg-[#0d1e3c] transition-colors cursor-pointer shadow-xs">
                      <span>{isUploading ? 'Processando...' : 'Selecionar Arquivo de Currículo'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* CARD 3: COMPETÊNCIAS MAPEADAS */}
          <Card className="border-slate-200 shadow-xs text-left">
            <CardHeader className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#142d59]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Competências Mapeadas & Inteligência de Vagas
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                {aluno?.competencias.length || 0} competência(s)
              </span>
            </CardHeader>

            <CardBody className="p-5 sm:p-6 space-y-4">
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
                  placeholder="Digitar nova competência (ex: SQL, Power BI, Valuation, Scrum)..."
                  className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59] outline-none"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddSkill}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full sm:w-auto"
                >
                  Adicionar
                </Button>
              </div>

              {/* Lista de Tags do Aluno */}
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
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Nenhuma competência mapeada ainda. Anexe seu currículo acima ou adicione manualmente.
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Como funciona o Match FIA:</strong> As competências cadastradas acima são comparadas em tempo real com os requisitos exigidos pelos professores nas vagas, gerando a pontuação de aderência personalizada para o seu perfil.
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DOS DADOS PESSOAIS */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Dados do Perfil Acadêmico"
        subtitle="Atualize suas informações cadastrais na FIA"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfileData} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Idade *
              </label>
              <input
                type="number"
                min={16}
                max={90}
                value={editIdade}
                onChange={(e) => setEditIdade(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Graduação / Formação Principal *
            </label>
            <input
              type="text"
              value={editGraduacao}
              onChange={(e) => setEditGraduacao(e.target.value)}
              placeholder="Ex: Administração, Economia, Engenharia..."
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59]"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Segunda Graduação ou Pós-Graduação / MBA (Opcional)
              </label>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Opcional</span>
            </div>
            <input
              type="text"
              value={editSegundaGraduacao}
              onChange={(e) => setEditSegundaGraduacao(e.target.value)}
              placeholder="Ex: Pós em Finanças, MBA em Gestão..."
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resumo de Experiência Profissional (Opcional)
            </label>
            <textarea
              rows={3}
              value={editExperiencia}
              onChange={(e) => setEditExperiencia(e.target.value)}
              placeholder="Descreva brevemente sua atuação e histórico profissional..."
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#142d59]/15 focus:border-[#142d59]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

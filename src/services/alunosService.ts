import type { Aluno } from '../types';
import { INITIAL_ALUNOS } from './mockData';

const STORAGE_KEY = 'fia_alunos_v2';

function getStoredAlunos(): Aluno[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ALUNOS));
    return INITIAL_ALUNOS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ALUNOS;
  }
}

function saveStoredAlunos(alunos: Aluno[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alunos));
}

export const alunosService = {
  // Obter todos os alunos cadastrados na plataforma (visão Administrador)
  async getTodosAlunos(): Promise<Aluno[]> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('alunos').select('*').order('nome', { ascending: true });
    await new Promise((res) => setTimeout(res, 200));
    return getStoredAlunos();
  },

  // Obter perfil do aluno pelo usuarioId
  async getAlunoByUsuarioId(usuarioId: string): Promise<Aluno | null> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('alunos').select('*').eq('usuario_id', usuarioId).single();
    await new Promise((res) => setTimeout(res, 150));
    const alunos = getStoredAlunos();
    let aluno = alunos.find((a) => a.usuarioId === usuarioId);
    
    // Se não existir aluno para este usuarioId no mock, cria um registro inicial
    if (!aluno) {
      aluno = {
        id: `aluno-${Date.now()}`,
        usuarioId,
        nome: 'Aluno FIA',
        email: 'aluno@aluno.fia.com.br',
        competencias: [],
      };
      alunos.push(aluno);
      saveStoredAlunos(alunos);
    }
    return aluno;
  },

  // Atualizar dados cadastrais e competências do aluno
  async updateAlunoPerfil(usuarioId: string, updates: Partial<Aluno>): Promise<Aluno> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('alunos').update(updates).eq('usuario_id', usuarioId).select().single();
    await new Promise((res) => setTimeout(res, 200));
    const alunos = getStoredAlunos();
    const index = alunos.findIndex((a) => a.usuarioId === usuarioId);
    if (index === -1) throw new Error('Aluno não encontrado');

    const updated = { ...alunos[index], ...updates };
    alunos[index] = updated;
    saveStoredAlunos(alunos);
    return updated;
  },

  // Upload de currículo em PDF e extração automática de competências
  async uploadCurriculo(
    usuarioId: string,
    file: File
  ): Promise<{ curriculoUrl: string; competenciasExtraidas: string[]; alunoAtualizado: Aluno }> {
    // TODO: Supabase real:
    // 1. Storage: const { data: storageData, error: storageError } = await supabase.storage.from('curriculos').upload(`${usuarioId}/${file.name}`, file);
    // 2. Edge Function (IA/Parsing): const { data: parseData } = await supabase.functions.invoke('parse-curriculo', { body: { path: storageData.path } });
    // 3. Atualizar tabela 'alunos' com as competencias retornadas da Edge Function
    await new Promise((res) => setTimeout(res, 1200));

    // Mock inteligente de extração com base no nome do arquivo ou tags de mercado
    const mockExtractedSkills = [
      'Python',
      'SQL',
      'Power BI',
      'Modelagem Financeira',
      'Excel Avançado',
      'Valuation',
      'Gestão de Projetos',
    ];

    const fakeUrl = URL.createObjectURL(file);
    const alunos = getStoredAlunos();
    const index = alunos.findIndex((a) => a.usuarioId === usuarioId);
    
    // Unir as competências já existentes com as novas extraídas sem duplicidade
    const existing = index !== -1 ? alunos[index].competencias : [];
    const mergedSkills = Array.from(new Set([...existing, ...mockExtractedSkills]));

    let updatedAluno: Aluno;
    if (index !== -1) {
      updatedAluno = {
        ...alunos[index],
        curriculoUrl: fakeUrl,
        curriculoNomeArquivo: file.name,
        competencias: mergedSkills,
      };
      alunos[index] = updatedAluno;
    } else {
      updatedAluno = {
        id: `aluno-${Date.now()}`,
        usuarioId,
        nome: 'Aluno FIA',
        email: 'aluno@aluno.fia.com.br',
        curriculoUrl: fakeUrl,
        curriculoNomeArquivo: file.name,
        competencias: mergedSkills,
      };
      alunos.push(updatedAluno);
    }

    saveStoredAlunos(alunos);

    return {
      curriculoUrl: fakeUrl,
      competenciasExtraidas: mockExtractedSkills,
      alunoAtualizado: updatedAluno,
    };
  },

  // Adicionar ou remover competência individualmente
  async updateCompetencias(usuarioId: string, competencias: string[]): Promise<Aluno> {
    return this.updateAlunoPerfil(usuarioId, { competencias });
  },
};

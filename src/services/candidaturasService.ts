import type { Candidatura, StatusCandidatura, Aluno, Vaga } from '../types';
import { INITIAL_CANDIDATURAS } from './mockData';
import { calculateAdherence } from '../lib/utils';

const STORAGE_KEY = 'fia_candidaturas';

function getStoredCandidaturas(): Candidatura[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CANDIDATURAS));
    return INITIAL_CANDIDATURAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CANDIDATURAS;
  }
}

function saveStoredCandidaturas(candidaturas: Candidatura[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidaturas));
}

export const candidaturasService = {
  // Obter candidaturas enviadas por um aluno
  async getCandidaturasByAluno(alunoId: string): Promise<Candidatura[]> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('candidaturas').select('*, vagas(*)').eq('aluno_id', alunoId).order('criada_em', { ascending: false });
    await new Promise((res) => setTimeout(res, 200));
    const list = getStoredCandidaturas();
    return list.filter((c) => c.alunoId === alunoId);
  },

  // Obter candidaturas recebidas para uma vaga específica
  async getCandidaturasByVaga(vagaId: string): Promise<Candidatura[]> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('candidaturas').select('*, alunos(*)').eq('vaga_id', vagaId).order('criada_em', { ascending: false });
    await new Promise((res) => setTimeout(res, 200));
    const list = getStoredCandidaturas();
    return list.filter((c) => c.vagaId === vagaId);
  },

  // Criar nova candidatura do aluno para uma vaga
  async createCandidatura(vaga: Vaga, aluno: Aluno): Promise<Candidatura> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('candidaturas').insert([{ vaga_id: vaga.id, aluno_id: aluno.id, status: 'pendente' }]).select().single();
    await new Promise((res) => setTimeout(res, 300));
    const list = getStoredCandidaturas();

    // Evitar candidatura duplicada
    const alreadyApplied = list.some((c) => c.vagaId === vaga.id && c.alunoId === aluno.id);
    if (alreadyApplied) {
      throw new Error('Você já se candidatou a esta vaga.');
    }

    const { aderenciaPorcentagem } = calculateAdherence(aluno.competencias, vaga.competenciasNecessarias);

    const novaCandidatura: Candidatura = {
      id: `cand-${Date.now()}`,
      vagaId: vaga.id,
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      alunoEmail: aluno.email,
      alunoCurriculoUrl: aluno.curriculoUrl,
      alunoCompetencias: aluno.competencias,
      compatibilidadeScore: aderenciaPorcentagem,
      status: 'pendente',
      criadaEm: new Date().toISOString(),
      vagaTitulo: vaga.titulo,
    };

    list.unshift(novaCandidatura);
    saveStoredCandidaturas(list);
    return novaCandidatura;
  },

  // Atualizar status pelo professor (ex: em_analise, aprovado, rejeitado)
  async updateStatusCandidatura(id: string, status: StatusCandidatura): Promise<Candidatura> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('candidaturas').update({ status }).eq('id', id).select().single();
    await new Promise((res) => setTimeout(res, 200));
    const list = getStoredCandidaturas();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Candidatura não encontrada');

    list[index].status = status;
    saveStoredCandidaturas(list);
    return list[index];
  },
};

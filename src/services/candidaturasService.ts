import type { Candidatura, StatusCandidatura, Aluno, Vaga } from '../types';
import { calculateAdherence } from '../lib/utils';

const STORAGE_KEY = 'fia_candidaturas';

function getStoredCandidaturas(): Candidatura[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveStoredCandidaturas(candidaturas: Candidatura[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidaturas));
}

export const candidaturasService = {
  // Obter candidaturas enviadas por um aluno
  async getCandidaturasByAluno(alunoId: string): Promise<Candidatura[]> {
    await new Promise((res) => setTimeout(res, 150));
    const list = getStoredCandidaturas();
    return list.filter((c) => c.alunoId === alunoId);
  },

  // Obter candidaturas recebidas para uma vaga específica
  async getCandidaturasByVaga(vagaId: string): Promise<Candidatura[]> {
    await new Promise((res) => setTimeout(res, 150));
    const list = getStoredCandidaturas();
    return list.filter((c) => c.vagaId === vagaId);
  },

  // Criar nova candidatura do aluno para uma vaga
  async createCandidatura(vaga: Vaga, aluno: Aluno): Promise<Candidatura> {
    await new Promise((res) => setTimeout(res, 250));
    const list = getStoredCandidaturas();

    // Evitar candidatura duplicada
    const existing = list.find((c) => c.vagaId === vaga.id && c.alunoId === aluno.id);
    if (existing) {
      return existing;
    }

    const { aderenciaPorcentagem } = calculateAdherence(
      vaga.competenciasNecessarias,
      aluno.competencias
    );

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

  // Atualizar status da candidatura (Administrador)
  async updateStatus(id: string, status: StatusCandidatura): Promise<Candidatura> {
    await new Promise((res) => setTimeout(res, 150));
    const list = getStoredCandidaturas();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Candidatura não encontrada');

    list[index].status = status;
    saveStoredCandidaturas(list);
    return list[index];
  },

  // Alias para manter compatibilidade com AdminDashboardPage
  async updateStatusCandidatura(id: string, status: StatusCandidatura): Promise<Candidatura> {
    return this.updateStatus(id, status);
  },
};

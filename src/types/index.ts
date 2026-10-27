export type UserRole = 'admin' | 'aluno';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  criadoEm: string;
}

export interface Administrador {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  cargo?: string;
}

export interface Aluno {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  curso?: string;
  periodo?: string;
  curriculoUrl?: string;
  curriculoNomeArquivo?: string;
  competencias: string[];
}

export type ModalidadeVaga = 'Presencial' | 'Híbrido' | 'Remoto';
export type StatusVaga = 'aberta' | 'encerrada';

export interface Vaga {
  id: string;
  titulo: string;
  descricao: string;
  empresa: string;
  departamento?: string;
  linkInscricao?: string;
  modalidade: ModalidadeVaga;
  remuneracao?: string;
  competenciasNecessarias: string[];
  dataLimite: string;
  status: StatusVaga;
  criadaEm: string;
}

export type StatusCandidatura = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';

export interface Candidatura {
  id: string;
  vagaId: string;
  alunoId: string;
  alunoNome: string;
  alunoEmail: string;
  alunoCurriculoUrl?: string;
  alunoCompetencias: string[];
  compatibilidadeScore?: number; // 0 a 100 (%)
  status: StatusCandidatura;
  criadaEm: string;
  vagaTitulo?: string;
}

export interface VagaRecomendada extends Vaga {
  aderenciaPorcentagem: number;
  competenciasEmComum: string[];
  competenciasFaltantes: string[];
}

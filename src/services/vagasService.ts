import type { Vaga, StatusVaga } from '../types';
import { INITIAL_VAGAS } from './mockData';

const STORAGE_KEY = 'fia_vagas_v2';

function getStoredVagas(): Vaga[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_VAGAS));
    return INITIAL_VAGAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_VAGAS;
  }
}

function saveStoredVagas(vagas: Vaga[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vagas));
}

export interface CreateVagaDTO {
  titulo: string;
  empresa: string;
  departamento?: string;
  descricao: string;
  modalidade: 'Presencial' | 'Híbrido' | 'Remoto';
  remuneracao?: string;
  linkInscricao?: string;
  competenciasNecessarias: string[];
  dataLimite: string;
}

export const vagasService = {
  // Obter todas as vagas abertas (visão Aluno)
  async getVagas(): Promise<Vaga[]> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('vagas').select('*').eq('status', 'aberta').order('criada_em', { ascending: false });
    await new Promise((res) => setTimeout(res, 200));
    const vagas = getStoredVagas();
    return vagas.filter((v) => v.status === 'aberta');
  },

  // Obter todas as vagas para o Administrador (abertas e encerradas)
  async getAllVagas(): Promise<Vaga[]> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('vagas').select('*').order('criada_em', { ascending: false });
    await new Promise((res) => setTimeout(res, 200));
    return getStoredVagas();
  },

  // Obter vaga por ID
  async getVagaById(id: string): Promise<Vaga | null> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('vagas').select('*').eq('id', id).single();
    await new Promise((res) => setTimeout(res, 150));
    const vagas = getStoredVagas();
    return vagas.find((v) => v.id === id) || null;
  },

  // Criar nova vaga (cadastrada por admin ou aluno)
  async createVaga(dto: CreateVagaDTO): Promise<Vaga> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('vagas').insert([dto]).select().single();
    await new Promise((res) => setTimeout(res, 250));
    const vagas = getStoredVagas();

    const novaVaga: Vaga = {
      id: `vaga-${Date.now()}`,
      titulo: dto.titulo,
      empresa: dto.empresa,
      departamento: dto.departamento,
      descricao: dto.descricao,
      modalidade: dto.modalidade,
      remuneracao: dto.remuneracao,
      linkInscricao: dto.linkInscricao,
      competenciasNecessarias: dto.competenciasNecessarias,
      dataLimite: dto.dataLimite,
      status: 'aberta',
      criadaEm: new Date().toISOString(),
    };

    vagas.unshift(novaVaga);
    saveStoredVagas(vagas);
    return novaVaga;
  },

  // Atualizar vaga existente
  async updateVaga(id: string, updates: Partial<Vaga>): Promise<Vaga> {
    // TODO: Supabase real:
    // const { data, error } = await supabase.from('vagas').update(updates).eq('id', id).select().single();
    await new Promise((res) => setTimeout(res, 200));
    const vagas = getStoredVagas();
    const index = vagas.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vaga não encontrada');

    const updated = { ...vagas[index], ...updates };
    vagas[index] = updated;
    saveStoredVagas(vagas);
    return updated;
  },

  // Alternar status da vaga (aberta/encerrada)
  async toggleStatusVaga(id: string, newStatus: StatusVaga): Promise<Vaga> {
    return this.updateVaga(id, { status: newStatus });
  },

  // Excluir vaga
  async deleteVaga(id: string): Promise<void> {
    // TODO: Supabase real:
    // const { error } = await supabase.from('vagas').delete().eq('id', id);
    await new Promise((res) => setTimeout(res, 200));
    const vagas = getStoredVagas();
    const filtered = vagas.filter((v) => v.id !== id);
    saveStoredVagas(filtered);
  },
};

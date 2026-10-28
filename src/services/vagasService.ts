import type { Vaga, StatusVaga, ModalidadeVaga } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'fia_vagas_v2';

interface VagaRow {
  id: string;
  titulo: string;
  empresa: string;
  departamento: string | null;
  descricao: string;
  modalidade: ModalidadeVaga;
  remuneracao: string | null;
  link_inscricao: string | null;
  competencias_necessarias: string[];
  data_limite: string;
  status: StatusVaga;
  criada_em: string;
  criada_por?: string | null;
}

function mapRowToVaga(row: VagaRow): Vaga {
  return {
    id: row.id,
    titulo: row.titulo,
    empresa: row.empresa,
    departamento: row.departamento || undefined,
    descricao: row.descricao,
    modalidade: row.modalidade,
    remuneracao: row.remuneracao || undefined,
    linkInscricao: row.link_inscricao || undefined,
    competenciasNecessarias: row.competencias_necessarias || [],
    dataLimite: row.data_limite,
    status: row.status,
    criadaEm: row.criada_em,
  };
}

function getStoredVagas(): Vaga[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
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
  modalidade: ModalidadeVaga;
  remuneracao?: string;
  linkInscricao?: string;
  competenciasNecessarias: string[];
  dataLimite: string;
}

export const vagasService = {
  // Obter todas as vagas abertas (visão Aluno / Mural público)
  async getVagas(): Promise<Vaga[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('vagas')
          .select('*')
          .eq('status', 'aberta')
          .order('criada_em', { ascending: false });

        if (!error && data) {
          const list = (data as VagaRow[]).map(mapRowToVaga);
          saveStoredVagas(list);
          return list;
        }
      } catch (err) {
        console.warn('Erro ao carregar vagas abertas do Supabase:', err);
      }
    }

    const vagas = getStoredVagas();
    return vagas.filter((v) => v.status === 'aberta');
  },

  // Obter todas as vagas para o Administrador (abertas e encerradas)
  async getAllVagas(): Promise<Vaga[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('vagas')
          .select('*')
          .order('criada_em', { ascending: false });

        if (!error && data) {
          const list = (data as VagaRow[]).map(mapRowToVaga);
          saveStoredVagas(list);
          return list;
        }
      } catch (err) {
        console.warn('Erro ao carregar todas as vagas do Supabase:', err);
      }
    }

    return getStoredVagas();
  },

  // Obter vaga por ID
  async getVagaById(id: string): Promise<Vaga | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('vagas')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return mapRowToVaga(data as VagaRow);
        }
      } catch (err) {
        console.warn('Erro ao buscar vaga por ID no Supabase:', err);
      }
    }

    const vagas = getStoredVagas();
    return vagas.find((v) => v.id === id) || null;
  },

  // Criar nova vaga diretamente no Supabase
  async createVaga(dto: CreateVagaDTO): Promise<Vaga> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const payload = {
        titulo: dto.titulo.trim(),
        empresa: dto.empresa.trim(),
        departamento: dto.departamento?.trim() || null,
        descricao: dto.descricao.trim(),
        modalidade: dto.modalidade,
        remuneracao: dto.remuneracao?.trim() || null,
        link_inscricao: dto.linkInscricao?.trim() || null,
        competencias_necessarias: dto.competenciasNecessarias,
        data_limite: dto.dataLimite,
        status: 'aberta' as const,
        criada_por: userId,
      };

      const { data, error } = await supabase
        .from('vagas')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao cadastrar vaga no Supabase: ${error.message}`);
      }

      if (data) {
        const novaVaga = mapRowToVaga(data as VagaRow);
        const locais = getStoredVagas();
        locais.unshift(novaVaga);
        saveStoredVagas(locais);
        return novaVaga;
      }
    }

    throw new Error('Supabase não está configurado para salvar a vaga no banco.');
  },

  // Atualizar vaga existente no Supabase
  async updateVaga(id: string, updates: Partial<Vaga>): Promise<Vaga> {
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = {};
      if (updates.titulo !== undefined) payload.titulo = updates.titulo;
      if (updates.empresa !== undefined) payload.empresa = updates.empresa;
      if (updates.departamento !== undefined) payload.departamento = updates.departamento;
      if (updates.descricao !== undefined) payload.descricao = updates.descricao;
      if (updates.modalidade !== undefined) payload.modalidade = updates.modalidade;
      if (updates.remuneracao !== undefined) payload.remuneracao = updates.remuneracao;
      if (updates.linkInscricao !== undefined) payload.link_inscricao = updates.linkInscricao;
      if (updates.competenciasNecessarias !== undefined) payload.competencias_necessarias = updates.competenciasNecessarias;
      if (updates.dataLimite !== undefined) payload.data_limite = updates.dataLimite;
      if (updates.status !== undefined) payload.status = updates.status;

      const { data, error } = await supabase
        .from('vagas')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar vaga no Supabase: ${error.message}`);
      }

      if (data) {
        const updated = mapRowToVaga(data as VagaRow);
        const vagas = getStoredVagas();
        const idx = vagas.findIndex((v) => v.id === id);
        if (idx !== -1) {
          vagas[idx] = updated;
          saveStoredVagas(vagas);
        }
        return updated;
      }
    }

    throw new Error('Supabase não configurado');
  },

  // Alternar status da vaga (aberta/encerrada)
  async toggleStatusVaga(id: string, newStatus: StatusVaga): Promise<Vaga> {
    return this.updateVaga(id, { status: newStatus });
  },

  // Excluir vaga no Supabase
  async deleteVaga(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('vagas').delete().eq('id', id);
      if (error) {
        throw new Error(`Erro ao excluir vaga no Supabase: ${error.message}`);
      }
    }
    const vagas = getStoredVagas();
    const filtered = vagas.filter((v) => v.id !== id);
    saveStoredVagas(filtered);
  },
};

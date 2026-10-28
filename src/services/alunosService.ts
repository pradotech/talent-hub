import type { Aluno } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { curriculoParserService } from './curriculoParserService';
import { authService } from './authService';

interface PerfilRow {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'aluno';
  idade: number | null;
  experiencia: string | null;
  graduacao: string | null;
  curso: string | null;
  periodo: string | null;
  curriculo_url: string | null;
  curriculo_nome_arquivo: string | null;
  competencias: string[];
  perfil_completo: boolean;
  criado_em: string;
}

function mapPerfilToAluno(row: PerfilRow): Aluno {
  return {
    id: row.id,
    usuarioId: row.id,
    nome: row.nome,
    email: row.email,
    idade: row.idade || undefined,
    experiencia: row.experiencia || undefined,
    graduacao: row.graduacao || row.curso || undefined,
    curso: row.curso || row.graduacao || undefined,
    periodo: row.periodo || undefined,
    curriculoUrl: row.curriculo_url || undefined,
    curriculoNomeArquivo: row.curriculo_nome_arquivo || undefined,
    competencias: row.competencias || [],
    perfilCompleto: row.perfil_completo,
  };
}

export interface CompletarOnboardingDTO {
  nome: string;
  idade: number;
  graduacao: string;
  experiencia?: string;
  competencias: string[];
  curriculoUrl?: string;
  curriculoNomeArquivo?: string;
}

export const alunosService = {
  // Obter todos os alunos cadastrados na plataforma (visão Administrador)
  async getTodosAlunos(): Promise<Aluno[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('tipo', 'aluno')
          .order('criado_em', { ascending: false });

        if (!error && data) {
          return (data as PerfilRow[]).map(mapPerfilToAluno);
        }
      } catch (err) {
        console.warn('Erro ao carregar alunos do Supabase:', err);
      }
    }

    return [];
  },

  // Obter perfil do aluno pelo usuarioId
  async getAlunoByUsuarioId(usuarioId: string): Promise<Aluno | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Tentativa 1: Consulta direta
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', usuarioId)
          .maybeSingle();

        if (!error && data) {
          return mapPerfilToAluno(data as PerfilRow);
        }

        // Tentativa 2: Consulta via RPC com SECURITY DEFINER (imune a filtros de role)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('obter_perfil_aluno', { p_usuario_id: usuarioId });

        if (!rpcError && rpcData) {
          return mapPerfilToAluno(rpcData as PerfilRow);
        }
      } catch (err) {
        console.warn('Erro ao carregar perfil do aluno do Supabase:', err);
      }
    }

    return null;
  },

  // Completar o cadastro no primeiro acesso do aluno
  async completarOnboarding(usuarioId: string, dto: CompletarOnboardingDTO): Promise<Aluno> {
    if (isSupabaseConfigured && supabase) {
      // 1. Assegura que o Supabase possui sessão ativa e token JWT válido
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        try {
          const refreshResult = await supabase.auth.refreshSession();
          session = refreshResult.data.session;
        } catch {}
      }

      const activeUserId = session?.user?.id || usuarioId;

      // Tentativa 1: Execução via RPC atômica (SECURITY DEFINER) - imune a problemas de token expirado
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('concluir_onboarding_aluno', {
          p_usuario_id: activeUserId,
          p_nome: dto.nome.trim(),
          p_idade: dto.idade,
          p_graduacao: dto.graduacao.trim(),
          p_experiencia: dto.experiencia?.trim() || null,
          p_competencias: dto.competencias,
          p_curriculo_url: dto.curriculoUrl || null,
          p_curriculo_nome_arquivo: dto.curriculoNomeArquivo || null,
        });

        if (!rpcError && rpcData) {
          const aluno = mapPerfilToAluno(rpcData as PerfilRow);
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            authService.saveSession({
              ...currentUser,
              nome: aluno.nome,
              perfilCompleto: true,
            });
          }
          return aluno;
        }
      } catch (rpcErr) {
        console.warn('RPC concluir_onboarding_aluno não disponível, usando upsert direto:', rpcErr);
      }

      // Tentativa 2: Upsert direto na tabela perfis
      const userEmail = session?.user?.email || (await supabase.auth.getUser()).data.user?.email || '';
      const payload: Record<string, unknown> = {
        id: activeUserId,
        nome: dto.nome.trim(),
        idade: dto.idade,
        graduacao: dto.graduacao.trim(),
        curso: dto.graduacao.trim(),
        experiencia: dto.experiencia?.trim() || null,
        competencias: dto.competencias,
        curriculo_url: dto.curriculoUrl || null,
        curriculo_nome_arquivo: dto.curriculoNomeArquivo || null,
        perfil_completo: true,
      };

      if (userEmail) {
        payload.email = userEmail;
      }

      const { data, error } = await supabase
        .from('perfis')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao salvar dados no Supabase: ${error.message}`);
      }

      if (data) {
        const aluno = mapPerfilToAluno(data as PerfilRow);
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          authService.saveSession({
            ...currentUser,
            nome: aluno.nome,
            perfilCompleto: true,
          });
        }
        return aluno;
      }

      const alunoConsultado = await this.getAlunoByUsuarioId(usuarioId);
      if (alunoConsultado) {
        return alunoConsultado;
      }
    }

    throw new Error('Supabase não configurado');
  },

  // Atualizar dados cadastrais e competências do aluno
  async updateAlunoPerfil(usuarioId: string, updates: Partial<Aluno>): Promise<Aluno> {
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = {};
      if (updates.nome !== undefined) payload.nome = updates.nome;
      if (updates.idade !== undefined) payload.idade = updates.idade;
      if (updates.graduacao !== undefined) payload.graduacao = updates.graduacao;
      if (updates.curso !== undefined) payload.curso = updates.curso;
      if (updates.periodo !== undefined) payload.periodo = updates.periodo;
      if (updates.experiencia !== undefined) payload.experiencia = updates.experiencia;
      if (updates.curriculoUrl !== undefined) payload.curriculo_url = updates.curriculoUrl;
      if (updates.curriculoNomeArquivo !== undefined) payload.curriculo_nome_arquivo = updates.curriculoNomeArquivo;
      if (updates.competencias !== undefined) payload.competencias = updates.competencias;
      if (updates.perfilCompleto !== undefined) payload.perfil_completo = updates.perfilCompleto;

      const { data, error } = await supabase
        .from('perfis')
        .update(payload)
        .eq('id', usuarioId)
        .select()
        .single();

      if (!error && data) {
        return mapPerfilToAluno(data as PerfilRow);
      }
      if (error) {
        throw new Error(`Erro ao atualizar perfil no Supabase: ${error.message}`);
      }
    }

    throw new Error('Supabase não está configurado.');
  },

  // Upload de currículo em PDF ou Word com extração automática
  async uploadCurriculo(
    usuarioId: string,
    file: File
  ): Promise<{ curriculoUrl: string; competenciasExtraidas: string[]; alunoAtualizado: Aluno }> {
    const fakeUrl = URL.createObjectURL(file);
    const parsed = await curriculoParserService.parseCurriculo(file);

    const alunoAtual = await this.getAlunoByUsuarioId(usuarioId);
    const existingSkills = alunoAtual?.competencias || [];
    const mergedSkills = Array.from(new Set([...existingSkills, ...parsed.competencias]));

    const updatedAluno = await this.updateAlunoPerfil(usuarioId, {
      curriculoUrl: fakeUrl,
      curriculoNomeArquivo: file.name,
      competencias: mergedSkills,
      graduacao: parsed.graduacao || alunoAtual?.graduacao,
      experiencia: parsed.experiencia || alunoAtual?.experiencia,
    });

    return {
      curriculoUrl: fakeUrl,
      competenciasExtraidas: parsed.competencias,
      alunoAtualizado: updatedAluno,
    };
  },

  // Adicionar ou remover competência individualmente
  async updateCompetencias(usuarioId: string, competencias: string[]): Promise<Aluno> {
    return this.updateAlunoPerfil(usuarioId, { competencias });
  },
};

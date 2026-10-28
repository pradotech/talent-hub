import type { User } from '@supabase/supabase-js';
import type { Usuario, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const AUTH_STORAGE_KEY = 'fia_auth_user_v2';

export function mapSupabaseUserToUsuario(user: User, perfilTipo?: UserRole, perfilNome?: string): Usuario {
  const metadata = user.user_metadata ?? {};
  const rawRole = (
    perfilTipo ||
    (typeof metadata.tipo === 'string'
      ? metadata.tipo
      : typeof metadata.role === 'string'
      ? metadata.role
      : '')
  ).toLowerCase();

  // Padrão rigoroso: se não for expressamente 'admin', é 'aluno'
  const tipo: UserRole = rawRole === 'admin' ? 'admin' : 'aluno';

  const nome = (
    perfilNome ||
    (typeof metadata.nome === 'string' && metadata.nome
      ? metadata.nome
      : typeof metadata.name === 'string' && metadata.name
      ? metadata.name
      : typeof metadata.full_name === 'string' && metadata.full_name
      ? metadata.full_name
      : user.email?.split('@')[0] || 'Usuário')
  );

  return {
    id: user.id,
    nome,
    email: user.email ?? '',
    tipo,
    criadoEm: user.created_at,
  };
}

export const authService = {
  /**
   * Realiza login exclusivamente por e-mail e senha no Supabase Auth.
   */
  async loginWithPassword(email: string, senha: string): Promise<Usuario> {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = senha.trim();

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('O serviço de autenticação do Supabase não está configurado.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: cleanPassword,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais de acesso.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Não foi possível identificar o usuário autenticado.');
    }

    // Consulta perfil do usuário na tabela perfis para obter tipo e nome atualizados
    let perfilTipo: UserRole | undefined;
    let perfilNome: string | undefined;

    try {
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('tipo, nome')
        .eq('id', data.user.id)
        .maybeSingle();

      if (perfilData) {
        perfilTipo = perfilData.tipo as UserRole;
        perfilNome = perfilData.nome;
      }
    } catch {
      // Usa fallback de metadados
    }

    const usuario = mapSupabaseUserToUsuario(data.user, perfilTipo, perfilNome);
    this.saveSession(usuario);
    return usuario;
  },

  /**
   * Realiza cadastro via Supabase Auth (com tipo 'aluno' por padrão).
   */
  async register(nome: string, email: string, role: UserRole = 'aluno', senha?: string): Promise<Usuario> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();
    const finalRole: UserRole = role === 'admin' ? 'admin' : 'aluno';

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('O serviço de autenticação do Supabase não está configurado.');
    }

    if (!senha) {
      throw new Error('A senha é obrigatória para realizar o cadastro.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: senha,
      options: {
        data: {
          nome: cleanNome,
          tipo: finalRole,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Falha ao processar o cadastro do usuário.');
    }

    // Se o signUp não estabeleceu sessão ativa imediata, realiza login com as credenciais cadastradas
    if (!data.session) {
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: senha,
        });
      } catch (err) {
        console.warn('Login automático pós-cadastro aguardando confirmação:', err);
      }
    }

    const usuario = mapSupabaseUserToUsuario(data.user, finalRole, cleanNome);
    this.saveSession(usuario);
    return usuario;
  },

  /**
   * Recupera o usuário da sessão inicial via Supabase.
   */
  async getInitialUser(): Promise<Usuario | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let perfilTipo: UserRole | undefined;
          let perfilNome: string | undefined;

          try {
            const { data: perfilData } = await supabase
              .from('perfis')
              .select('tipo, nome')
              .eq('id', session.user.id)
              .maybeSingle();

            if (perfilData) {
              perfilTipo = perfilData.tipo as UserRole;
              perfilNome = perfilData.nome;
            }
          } catch {}

          const usuario = mapSupabaseUserToUsuario(session.user, perfilTipo, perfilNome);
          this.saveSession(usuario);
          return usuario;
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão do Supabase:', err);
      }
    }

    return this.getCurrentUser();
  },

  getCurrentUser(): Usuario | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Usuario;
      if (parsed && (parsed.tipo === 'admin' || parsed.tipo === 'aluno')) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  saveSession(usuario: Usuario): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(usuario));
  },

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }
  },
};

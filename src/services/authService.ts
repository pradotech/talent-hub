import type { Usuario, UserRole } from '../types';

export const AUTH_STORAGE_KEY = 'fia_auth_user_v2';

export interface FakeUserProfile {
  email: string;
  senha: string;
  role: UserRole;
  usuario: Usuario;
}

// Perfis mockados solicitados para demonstração
export const FAKE_PROFILES: FakeUserProfile[] = [
  {
    email: 'adm@teste.com.br',
    senha: '@13setTESTE',
    role: 'admin',
    usuario: {
      id: 'user-admin-1',
      nome: 'Administrador FIA',
      email: 'adm@teste.com.br',
      tipo: 'admin',
      criadoEm: '2026-09-01T08:00:00Z',
    },
  },
  {
    email: 'aluno@teste.com.br',
    senha: '@13setAluno',
    role: 'aluno',
    usuario: {
      id: 'user-aluno-1',
      nome: 'Lucas Silveira Mendes',
      email: 'aluno@teste.com.br',
      tipo: 'aluno',
      criadoEm: '2026-09-15T10:00:00Z',
    },
  },
];

export const authService = {
  /**
   * Realiza login por e-mail e senha.
   * Valida as credenciais dos perfis de demonstração (ou cadastradas localmente).
   * TODO: Integrar com Supabase Auth real via `supabase.auth.signInWithPassword({ email, password })`
   */
  async loginWithPassword(email: string, senha: string): Promise<Usuario> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = senha.trim();

    const matchedProfile = FAKE_PROFILES.find(
      (profile) =>
        profile.email.toLowerCase() === normalizedEmail &&
        profile.senha === cleanPassword
    );

    if (!matchedProfile) {
      throw new Error('E-mail ou senha incorretos. Verifique suas credenciais de acesso.');
    }

    this.saveSession(matchedProfile.usuario);
    return matchedProfile.usuario;
  },

  /**
   * Realiza cadastro simulado.
   * TODO: Integrar com Supabase Auth real via `supabase.auth.signUp({ email, password })`
   */
  async register(nome: string, email: string, role: UserRole): Promise<Usuario> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const novoUsuario: Usuario = {
      id: `user-${role}-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      tipo: role,
      criadoEm: new Date().toISOString(),
    };

    this.saveSession(novoUsuario);
    return novoUsuario;
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

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
